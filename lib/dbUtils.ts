import type { Memory, MemoryMedia } from "@/lib/types";
import { base64ToBlob, getMimeFromDataUrl } from "@/lib/imageUtils";
import { inferMediaTypeFromStoredValue, normalizeImages, stripOriginalFiles } from "@/lib/utils";

const DB_NAME = "recall_db";
const DB_VERSION = 1;
const MEMORIES_STORE = "memories";
const MEDIA_STORE = "media";

interface StoredMedia extends Omit<MemoryMedia, "objectUrl" | "originalFile" | "base64"> {
  memoryId: string;
}

interface StoredMemory extends Omit<Memory, "images"> {
  images: StoredMedia[];
}

interface StoredMediaBlob {
  id: string;
  blob: Blob;
}

export async function readMemoriesFromDb(): Promise<Memory[]> {
  const db = await openRecallDb();
  const records = await getAll<StoredMemory>(db, MEMORIES_STORE);
  const memories = await Promise.all(records.map((record) => hydrateMemory(db, record)));
  db.close();
  return memories;
}

export async function saveMemoryToDb(memory: Memory): Promise<void> {
  const blobs = await collectMediaBlobs(memory);
  const db = await openRecallDb();
  const transaction = db.transaction([MEMORIES_STORE, MEDIA_STORE], "readwrite");
  const memoriesStore = transaction.objectStore(MEMORIES_STORE);
  const mediaStore = transaction.objectStore(MEDIA_STORE);

  await requestToPromise(memoriesStore.put(toStoredMemory(memory)));

  for (const item of blobs) {
    await requestToPromise(mediaStore.put(item));
  }

  await transactionDone(transaction);
  db.close();
}

export async function replaceMemoriesInDb(memories: Memory[]): Promise<void> {
  const blobs = await Promise.all(memories.map(collectMediaBlobs));
  const db = await openRecallDb();
  const transaction = db.transaction([MEMORIES_STORE, MEDIA_STORE], "readwrite");
  const memoriesStore = transaction.objectStore(MEMORIES_STORE);
  const mediaStore = transaction.objectStore(MEDIA_STORE);

  await requestToPromise(memoriesStore.clear());
  await requestToPromise(mediaStore.clear());

  for (const memory of memories) {
    await requestToPromise(memoriesStore.put(toStoredMemory(memory)));
  }

  for (const item of blobs.flat()) {
    await requestToPromise(mediaStore.put(item));
  }

  await transactionDone(transaction);
  db.close();
}

export async function mergeMemoriesIntoDb(memories: Memory[]): Promise<void> {
  const blobs = await Promise.all(memories.map(collectMediaBlobs));
  const db = await openRecallDb();
  const transaction = db.transaction([MEMORIES_STORE, MEDIA_STORE], "readwrite");
  const memoriesStore = transaction.objectStore(MEMORIES_STORE);
  const mediaStore = transaction.objectStore(MEDIA_STORE);

  for (const memory of memories) {
    await requestToPromise(memoriesStore.put(toStoredMemory(memory)));
  }

  for (const item of blobs.flat()) {
    await requestToPromise(mediaStore.put(item));
  }

  await transactionDone(transaction);
  db.close();
}

export async function deleteMemoryFromDb(memory: Memory): Promise<void> {
  const db = await openRecallDb();
  const transaction = db.transaction([MEMORIES_STORE, MEDIA_STORE], "readwrite");
  await requestToPromise(transaction.objectStore(MEMORIES_STORE).delete(memory.id));

  for (const media of memory.images) {
    await requestToPromise(transaction.objectStore(MEDIA_STORE).delete(media.id));
  }

  await transactionDone(transaction);
  db.close();
}

export async function clearRecallDb(): Promise<void> {
  const db = await openRecallDb();
  const transaction = db.transaction([MEMORIES_STORE, MEDIA_STORE], "readwrite");
  await requestToPromise(transaction.objectStore(MEMORIES_STORE).clear());
  await requestToPromise(transaction.objectStore(MEDIA_STORE).clear());
  await transactionDone(transaction);
  db.close();
}

export async function getMediaBlob(mediaId: string): Promise<Blob | null> {
  const db = await openRecallDb();
  const record = await requestToPromise<StoredMediaBlob | undefined>(
    db.transaction(MEDIA_STORE, "readonly").objectStore(MEDIA_STORE).get(mediaId),
  );
  db.close();
  return record?.blob ?? null;
}

export function revokeMemoryUrls(memories: Memory[]): void {
  for (const memory of memories) {
    for (const media of memory.images) {
      if (media.objectUrl) {
        URL.revokeObjectURL(media.objectUrl);
      }
    }
  }
}

function openRecallDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(MEMORIES_STORE)) {
        db.createObjectStore(MEMORIES_STORE, { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains(MEDIA_STORE)) {
        db.createObjectStore(MEDIA_STORE, { keyPath: "id" });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Unable to open Recall storage."));
  });
}

function getAll<T>(db: IDBDatabase, storeName: string): Promise<T[]> {
  return requestToPromise<T[]>(
    db.transaction(storeName, "readonly").objectStore(storeName).getAll(),
  );
}

async function hydrateMemory(db: IDBDatabase, record: StoredMemory): Promise<Memory> {
  const images = await Promise.all(
    record.images.map(async (media) => {
      const storedBlob = await requestToPromise<StoredMediaBlob | undefined>(
        db.transaction(MEDIA_STORE, "readonly").objectStore(MEDIA_STORE).get(media.id),
      );
      const objectUrl = storedBlob?.blob ? URL.createObjectURL(storedBlob.blob) : undefined;

      return {
        ...media,
        objectUrl,
      };
    }),
  );

  return {
    ...record,
    images: normalizeImages(images),
  };
}

function toStoredMemory(memory: Memory): StoredMemory {
  const clean = stripOriginalFiles(memory);
  return {
    ...clean,
    images: clean.images.map((media) => ({
      id: media.id,
      zipPath: media.zipPath,
      isCover: media.isCover,
      mediaType: media.mediaType,
      mimeType: media.mimeType,
      fileName: media.fileName,
      fileSize: media.fileSize,
      memoryId: memory.id,
    })),
  };
}

async function blobFromMedia(media: MemoryMedia): Promise<Blob | null> {
  if (media.originalFile) {
    return media.originalFile;
  }

  if (media.base64) {
    return base64ToBlob(media.base64);
  }

  if (media.objectUrl) {
    try {
      const response = await fetch(media.objectUrl);
      return await response.blob();
    } catch {
      return null;
    }
  }

  return null;
}

async function collectMediaBlobs(memory: Memory): Promise<StoredMediaBlob[]> {
  const blobs = await Promise.all(
    memory.images.map(async (media) => {
      const blob = await blobFromMedia(media);
      return blob ? { id: media.id, blob } : null;
    }),
  );

  return blobs.filter((item): item is StoredMediaBlob => item !== null);
}

export function hydrateLegacyMedia(media: MemoryMedia): MemoryMedia {
  if (!media.base64) {
    return media;
  }

  const blob = base64ToBlob(media.base64);
  const mimeType = media.mimeType || getMimeFromDataUrl(media.base64) || blob.type || "application/octet-stream";
  const mediaType = media.mediaType ?? inferMediaTypeFromStoredValue({
    base64: media.base64,
    mimeType,
    fileName: media.fileName,
  });

  return {
    ...media,
    mediaType,
    mimeType,
    fileSize: media.fileSize || blob.size,
    objectUrl: URL.createObjectURL(blob),
  };
}

function requestToPromise<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Recall storage request failed."));
  });
}

function transactionDone(transaction: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error ?? new Error("Recall storage transaction failed."));
    transaction.onabort = () => reject(transaction.error ?? new Error("Recall storage transaction was cancelled."));
  });
}
