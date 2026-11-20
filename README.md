# Pembelajar EN ↔ AR

Aplikasi belajar kosakata **Inggris · العربية · Indonesia** — dibangun ulang dengan **React (Vite)** di frontend dan **Node.js (Express)** di backend, siap di-deploy ke **GitHub Pages** (frontend) dan **Render** (backend) dengan **Firebase Firestore** sebagai database.

> v2.0 · Frontend React + Backend Express + Firestore. Versi statis lama (app.js) masih bisa dipakai fallback.

---

## Struktur proyek

```
├── client/                    # Frontend React (Vite)
│   ├── src/
│   │   ├── components/        # Header, Tabs, Modal, Toast, Footer, Icons
│   │   ├── views/             # Dashboard, Cards, Quiz, Phrases, Translate, Settings, Suggestions
│   │   ├── hooks/             # useStudyItems
│   │   ├── lib/               # api, language, srs, speech, storage
│   │   ├── state/             # AppContext (reducer + provider)
│   │   └── styles/            # tokens.css + app.css (tema gelap/terang)
│   ├── scripts/copy-data.mjs  # salin dataset statis ke public/data
│   └── dist/                  # hasil build (deploy ke GitHub Pages)
├── server/                    # Backend Express
│   ├── index.js               # HTTP + semua route API
│   ├── db/                    # pabrik store: firestore.js | local.js (JSON fallback)
│   ├── lib/lexicon.js         # lexicon kompak server-side (cache)
│   └── scripts/seed-firestore.js
├── assets/data/               # dataset statis (82 kategori, ±12.000 entri)
├── render.yaml                # blueprint deploy Render
└── .github/workflows/deploy-pages.yml
```

## Fitur

- **Dasbor** — ring progres harian, streak, rekor, statistik belajar, kategori paling sulit, daftar kesalahan 24 jam.
- **Kartu** — flashcard 3D balik, audio EN/AR/ID (Web Speech + fallback TTS server), favorit, filter (Semua/Favorit/Sulit/Baru/Kuat), badge SRS.
- **Kuis** — 10 soal per sesi, timer lingkaran (bisa dimatikan), pemilihan soal berbobot SRS, ringkasan sesi, mode "ulangi kesalahan".
- **Frasa** — grid kartu EN/AR/ID dengan audio per baris dan paginasi.
- **Terjemah** — kamus lokal ±5.000 entri lewat API `/api/lexicon` (kompak, bukan 3MB), deteksi bahasa otomatis, tambah kata tak dikenal ke kamus lokal, riwayat, bantuan AI (Ollama via backend).
- **Saran kata** — form + status, bisa dirapikan AI, admin bisa menandai selesai.
- **Sinkronisasi progres** — SRS/favorit/riwayat tersimpan di localStorage **dan** tersinkron ke backend (`progress/{deviceId}` di Firestore).
- Tampilan baru: tema gelap/terang/sistem, glassmorphism header, animasi halus, responsif penuh, pintasan papan ketik (`1–5`, `/`, spasi, ←→, S).

## Menjalankan lokal

```bash
# 1. Backend (mode JSON lokal, tanpa Firebase)
cd server
npm install
npm start            # http://localhost:8020

# 2. Frontend (terminal kedua)
cd client
npm install
npm run dev          # http://localhost:5173 (proxy API ke :8020)
```

Build produksi frontend only:

```bash
cd client && npm run build     # hasil di client/dist
```

Backend otomatis menyajikan `client/dist` bila ada — jadi satu service Render bisa menampung API + frontend sekaligus.

---

## Deploy

### 1. Frontend → GitHub Pages

Workflow [.github/workflows/deploy-pages.yml](.github/workflows/deploy-pages.yml) sudah ada: setiap push ke `main` mem-build `client/` dan men-deploy `client/dist` ke Pages. Aktifkan di **Settings → Pages → Source: GitHub Actions**.

Build production membaca alamat backend dari `VITE_API_BASE` di [client/.env.production](client/.env.production) (default `https://pembelajaran-api.onrender.com/`, ganti bila domain Render kamu berbeda):

```bash
VITE_API_BASE=https://pembelajaran-api.onrender.com/
```

`npm run dev` tidak membaca file itu, jadi saat development semua panggilan `/api`, `/tts`, dan `/ai` tetap lewat proxy same-origin di `vite.config.js`. Jalur alternatif (tanpa build ulang): isi `apiBase` di [client/public/app.config.js](client/public/app.config.js) atau lewat **Pengaturan → Server & API** di aplikasi (tersimpan per perangkat); nilai runtime itu menang atas `VITE_API_BASE`.

### 1b. Frontend → Firebase Hosting

[firebase.json](firebase.json) sudah menyajikan `client/dist`:

```bash
cd client && npm run build
firebase deploy --only hosting --project pembelajaran-90f14
```

Karena Hosting tidak mem-proxy `/api` ke server lain, build hosted wajib memakai `VITE_API_BASE` absolut di atas. Tambahkan juga domain hosting ke **Firebase Authentication → Settings → Authorized domains** (`pembelajaran-90f14.web.app` dan `pembelajaran-90f14.firebaseapp.com`) agar login Google bekerja.

> Mode fallback: bila `app.config.js` tidak diisi, aplikasi tetap jalan memakai `client/public/data` (dataset statis) + localStorage — hanya fitur server yang mati.

### 2. Backend → Render

1. Push repo ke GitHub.
2. Di Render: **New → Blueprint**, pilih repo — [render.yaml](render.yaml) otomatis membuat service `pembelajaran-api`.
3. Isi environment variables:
   - `FIREBASE_SERVICE_ACCOUNT` — **isi file service account JSON Firebase** (satu baris, tanpa enter). Render → Environment → Add.
   - `API_BASE_URL` — URL publik service (mis. `https://pembelajaran-api.onrender.com/`)
   - `CORS_ORIGINS` — URL Pages kamu (mis. `https://username.github.io`), koma bila lebih dari satu
   - `ADMIN_USERNAME` / `ADMIN_PASSWORD` — untuk login admin (upload, status saran)
   - `OLLAMA_BASE_URL` / `OLLAMA_MODEL` — opsional, untuk fitur AI

Health check: `GET /api/health` — balik `{"ok":true,"storage":"firestore|json"}`.

**Frontend ikut di server Render (satu URL).** [render.yaml](render.yaml) memakai build command
`npm install && cd ../client && npm ci && npm run build`, lalu Express menyajikan `client/dist`,
jadi `https://pembelajaran-api.onrender.com/` langsung membuka aplikasi dan semua panggilan
`/api`, `/tts`, `/ai` tetap same-origin. Kalau service dibuat manual (bukan Blueprint), set
**Build Command** di Render → Settings persis seperti di atas, lalu **Manual Deploy**; tanpa itu
halaman root akan 404 "Frontend belum di-build".

Build React di Render memakai `client/.env.production` (`VITE_API_BASE` absolut). Untuk pemakaian
same-origin, kosongkan nilai itu (`VITE_API_BASE=`) agar aplikasi memanggil backend dari origin
halaman, dan tetap isi `apiBase`/Authorized domains hanya bila memakai Hosting/Pages terpisah.

### 2b. Backend di host container gratis

[Dockerfile](Dockerfile) di root membangun React + Express dalam satu image (port `8080`), jadi
cocok untuk host gratis berbasis container:

```bash
docker build -t pembelajaran .
docker run -p 8080:8080 -e STORAGE=firestore -e FIREBASE_SERVICE_ACCOUNT='{...}' pembelajaran
```

Langkah di host (contoh **Northflank Sandbox** — gratis, 2 service selalu aktif tanpa tidur):

1. New Service → Dockerfile → repo ini, konteks build root, Dockerfile `Dockerfile`.
2. Port publik `8080` (HTTP), health check `/api/health`.
3. Tambahkan env yang sama seperti Render: `FIREBASE_SERVICE_ACCOUNT`, `FIREBASE_WEB_API_KEY`,
   `GOOGLE_OAUTH_CLIENT_ID`, `STORAGE=firestore`, `CORS_ORIGINS`.
4. Deploy; host memberi domain HTTPS. Masukkan domain itu ke Firebase Authentication →
   Authorized domains bila ingin login Google.

Alternatif lain: Render free (tidur setelah 15 menit idle, tanpa kartu), Koyeb/Railway (butuh
kartu), Zeabur. Untuk penyimpanan: `STORAGE=json` menulis ke disk container yang hilang saat
restart, jadi di host gratis pakai Firestore.

### 3. Firebase Firestore (database sementara)

Backend memakai Firestore bila kredensial ada, otomatis fallback ke JSON lokal bila tidak.

1. Firebase Console → buat project → **Firestore Database** (mode Native).
2. **Project settings → Service accounts → Generate new private key** → salin isi JSON-nya ke env `FIREBASE_SERVICE_ACCOUNT` di Render.
3. Seed dataset statis ke Firestore (sekali):

```bash
cd server
FIREBASE_SERVICE_ACCOUNT='{...json...}' node scripts/seed-firestore.js --dry-run   # lihat ringkasan
FIREBASE_SERVICE_ACCOUNT='{...json...}' node scripts/seed-firestore.js             # tulis
```

Skema Firestore:

| Collection | Isi |
|---|---|
| `categories/{id}` | `{ id, name, count, order }` |
| `entries/{cat}__{n}` | `{ category, index, items: [...] }` (chunk < 1MB) |
| `meta/catalog` | ringkasan kategori untuk respon cepat |
| `word_suggestions/{id}` | saran kata |
| `progress/{deviceId}` | `{ payload, updated_at }` — progres belajar per perangkat |

> Tanpa seed: backend lewat JSON lokal tetap menyajikan seluruh kategori, jadi aplikasi langsung dipakai sebelum Firestore di-seed.

## API

| Endpoint | Ket |
|---|---|
| `GET /api/health` | status + storage aktif + statistik lexicon |
| `GET /api/catalog` | daftar kategori + jumlah entri per kategori |
| `GET /api/entries/:categoryId` | entri satu kategori |
| `GET /api/entries` | seluruh entri |
| `GET /api/lexicon` | lexicon kompak (EN/AR/ID) untuk fitur Terjemah |
| `GET·PUT /api/progress/:deviceId` | baca/simpan progres belajar |
| `GET /tts?lang&text` | audio TTS (rate-limited) |
| `GET·POST /word-suggestions` | baca/kirim saran kata |
| `POST /word-suggestions-status` | ubah status (admin) |
| `POST /ai/translate`, `/ai/word-suggestion-draft` | bantuan Ollama |
| `POST /admin/login·logout·session` | sesi admin |
| `POST /upload`, `/import-animals`, `/import-vegetables` | admin |

## Catatan

- Data belajar (SRS, favorit, riwayat) milik perangkat: localStorage dulu, sinkron ke Firestore pas ada jaringan.
- `client/public/data` dibuat otomatis oleh `scripts/copy-data.mjs` (jangan edit manual; sudah di-gitignore).
- `scripts/*.py` di root adalah script generator dataset (sudah terpakai) — boleh dihapus kalau dataset tidak lagi dikembangkan.
- Path `/assets/*` tetap dilayani backend (folder `assets/`, termasuk `user-images/` hasil upload admin).
