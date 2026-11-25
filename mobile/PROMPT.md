# Prompt Aplikasi — Pembelajar Anak (React Native + Expo)

Dokumen ini bisa dipakai ulang sebagai prompt untuk membangun (atau membangun ulang) aplikasi mobile-nya.

---

## Peran

Kamu adalah pengembang aplikasi mobile React Native + Expo. Bangun aplikasi **Pembelajar Anak**: pendamping belajar bahasa Inggris–Arab untuk anak usia 4–9 tahun, berbahasa antarmuka Indonesia, yang bisa dipakai sepenuhnya tanpa internet.

## Tujuan

Anak belajar kosakata dan kalimat lewat kartu bergambar dan permainan singkat, mengumpulkan bintang, menaikkan level, dan membuka stiker. Orang tua bisa melihat ringkasan progres.

## Pengguna

- **Anak**: banyak mengetuk, sedikit membaca; tombol besar, emoji besar, warna cerah, suara.
- **Orang tua**: butuh ringkasan progres, pengaturan bahasa/panjang permainan, dan tombol reset.

## Teknologi

- Expo SDK 58 + React Native 0.88, React 19.
- **Expo Router** (file-based routing) untuk semua navigasi; rute di `src/app/`.
- `expo-speech` untuk pelafalan tiga bahasa (tanpa file audio).
- `@react-native-async-storage/async-storage` untuk progres lokal.
- JavaScript (template blank), tanpa backend, tanpa login.
- Materi dibundel sebagai `src/data/kids.json`, dihasilkan `npm run data` dari aplikasi web agar isi tetap sama.

## Struktur layar

1. **Beranda** (tab): sapaan + maskot, bintang & level, kartu "Lanjutkan belajar", pencarian kata/topik, daftar topik per kelompok (2 kolom), dan pintasan kata sulit bila ada.
2. **Belajar** (rute `belajar?topic=<id>`): kartu besar bergambar, kata dalam bahasa aktif, transliterasi Arab, tombol dengar/pelan, terjemahan dua bahasa lain yang bisa diketuk untuk didengar, bar kemajuan, tombol berikutnya/sebelumnya, dan tombol selesai topik yang memberi bintang + stiker.
3. **Main** (tab): empat permainan singkat — **Tebak Kata**, **Dengar & Pilih**, **Susun Kalimat**, **Huruf Awal**. Setiap permainan punya bar kemajuan, skor bintang, umpan balik benar/salah, kata salah tercatat sebagai kata sulit, dan layar hasil dengan bintang + rekor.
4. **Cerita** (tab + rute `cerita/<id>`): 12 cerita bergambar, tiap kalimat dalam tiga bahasa, putar suara per kalimat, lalu kuis 2 pertanyaan dan hadiah bintang.
5. **Progres** (tab): total kata dikuasai, topik selesai, bintang, rekor tiap permainan, bar per kelompok topik, album stiker, pengaturan (bahasa kata, ukuran panjang permainan, suara), dan reset progres dengan konfirmasi.

## Data

- 30 topik, 421 kata (`emoji`, `en`, `ar`, `tr`, `id`, opsional `big`/`sample`).
- 12 cerita (`sentences[]` tiga bahasa + `questions[]`).
- 22 frasa untuk Susun Kalimat.
- Stiker: bintang, per topik, per cerita, per permainan.
- Level dari jumlah bintang (Pemula → Legenda).

## Aturan main

- Jawaban benar tanpa salah pada ronde pertama memberi 1 bintang; menyelesaikan permainan memberi 2 bintang tambahan; menyelesaikan topik 3 bintang; cerita 4 bintang.
- Progres disimpan per kata (`learned`), per topik (`topicsDone`), stiker (`stickers`), rekor (`best`), dan kata salah (`mistakes` dengan hitungan).
- Panjang permainan mengikuti pengaturan: Pendek / Sedang / Panjang (jumlah soal menyesuaikan).
- Suara bisa dimatikan; teks Arab dibacakan transliterasinya bila perangkat tidak punya suara Arab.

## Gaya visual

Ceria dan ramah anak: latar gradasi lembut biru–krem–pink, kartu putih dengan sudut besar (20–26 px), bayangan tebal lembut (gaya tombol "3D"), aksen warna per topik, emoji sebagai ilustrasi utama, teks gelap `#2b1c46` dengan abu `#6d5f8a`, target sentuh minimal 44×44 px.

## Aksesibilitas

- Semua tombol punya label `accessibilityLabel` yang jelas.
- Kontras teks minimal 4.5:1, ukuran teks utama ≥ 16.
- Tidak ada informasi penting yang hanya disampaikan lewat warna.

## Non-tujuan

- Tanpa akun, sinkronisasi cloud, iklan, pembelian dalam aplikasi, atau konten dewasa (12.415 entri) di versi mobile pertama.
- Tanpa animasi berat atau video.

## Kriteria selesai

- `npx expo export --platform android` berhasil (bundel JS valid).
- Aplikasi bisa dibuka di Expo Go: Beranda → pilih topik → kartu bergambar dengan suara → selesai topik memberi bintang.
- Empat permainan bisa dimainkan sampai layar hasil; skor dan rekor tersimpan setelah aplikasi ditutup.
- Cerita bisa dibaca, kuis bisa dijawab, stiker bertambah.
- Progres bertahan setelah restart (AsyncStorage) dan reset berfungsi.
