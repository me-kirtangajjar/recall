# Recall

A local-first memory timeline for preserving life's most meaningful moments.

Recall lets you create beautiful memories with photos, videos, stories, tags, dates, and times. Everything is stored privately on your device, with seamless ZIP backup and restore support when you want to move your timeline somewhere else.

## Why Recall

Most memory apps assume your private life should live in someone else's cloud. Recall takes the opposite approach.

- No accounts
- No backend
- No database
- No analytics
- No cookies
- No cloud uploads

Your memories stay in your browser unless you choose to export a backup.

## Features

- Create, edit, and delete memories
- Add multiple photos and videos per memory
- Preserve original media quality without compression
- Choose a cover photo or video for each memory
- Auto-save every change to browser storage
- Export a ZIP backup with `timeline.json` and original media files
- Import a ZIP backup and replace or merge with the current timeline
- Search memories by title, description, or tag
- Filter by preset tags like Travel, Family, Love, Achievement, and Everyday
- Switch between timeline view and year/chapter view
- See "This Day in History" for memories from past years
- See a deterministic "Memory of the Day"
- Fully client-side and deployable on Vercel's free tier

## Privacy Model

Recall is designed as a private, local-first app.

Primary storage is browser IndexedDB:

```text
recall_db
```

Recall stores memory metadata and original media blobs in IndexedDB. This avoids the synchronous writes and small quota limits of `localStorage`, and keeps large photos/videos out of JSON strings.

The app also reads older `localStorage` data from `recall_data` or `timelines_data` for migration, then moves that archive into IndexedDB.

ZIP backup is optional. It is only created when the user explicitly chooses **Save Backup**. Import is also user-triggered through a local file picker.

## Media Handling

Recall stores uploaded media as original `Blob`/`File` data in IndexedDB. It does not resize, compress, transcode, or reduce quality.

Supported uploads include common image and video formats such as:

- Images: JPG, PNG, WEBP, GIF, AVIF, HEIC, HEIF, BMP, TIFF, SVG
- Videos: MP4, MOV, WEBM, AVI, MKV, MPEG, OGV, 3GP, MTS, M2TS

Browser preview support can vary for formats like HEIC, AVI, or MKV, but Recall still preserves the original file data for backup.

## Important Storage Note

Because Recall keeps media at original quality, large videos and high-resolution photos can still fill browser storage. If quota is exceeded, the app shows a friendly warning and encourages exporting a ZIP backup.

For very large personal archives, frequent ZIP backups are recommended.

## Tech Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- React Context + `useReducer`
- Framer Motion
- Lucide React
- JSZip
- File Saver
- IndexedDB
- Browser File, Blob, and FileReader APIs

## Getting Started

Install dependencies:

```bash
npm install
```

Run the development server:

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

## Scripts

```bash
npm run dev
```

Starts the local development server.

```bash
npm run build
```

Creates a production build.

```bash
npm run start
```

Runs the production build locally.

```bash
npm run lint
```

Runs ESLint.

## Project Structure

```text
app/
  page.tsx                 Welcome screen
  timeline/page.tsx        Main timeline route
  layout.tsx               Root layout, fonts, providers

components/
  export/                  Import/export hooks
  memory/                  Add/edit panel and detail modal
  timeline/                Timeline UI, year view, cards, banners
  ui/                      Shared interface components

context/
  MemoriesContext.tsx      Memory state and IndexedDB sync
  UIContext.tsx            Toast state

lib/
  dbUtils.ts               IndexedDB records and media blob storage
  dateUtils.ts             Date formatting and daily memory logic
  imageUtils.ts            Original-quality media file handling
  searchUtils.ts           Search/filter helpers
  storageUtils.ts          Legacy localStorage migration
  types.ts                 Shared TypeScript types
  zipUtils.ts              ZIP export/import logic
```

User memories are not deployed or synced. They remain in each user's browser storage unless that user exports and imports a backup.
