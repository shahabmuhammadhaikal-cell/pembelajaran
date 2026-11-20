// Konfigurasi yg dibaca frontend React (window.PEMBELAJAR_CONFIG) saat render statis (misalnya GitHub Pages).
// Isi URL backend Render kamu di bawah, lalu commit + push agar Pages di-deploy ulang.
// Tanpa isi juga jalan: aplikasi memakai fallback dataset statis, dan URL backend
// bisa diisi dari aplikasi lewat Pengaturan → Server & API (tersimpan per perangkat).
//
// Login & simpan skor per akun (opsional): isi `firebase` dari Firebase Console →
// Project settings → Your apps → SDK setup and configuration (config web).
// Nilai di bawah ini memang publik (bukan rahasia). Kunci server
// (FIREBASE_SERVICE_ACCOUNT) hanya disimpan di Render, jangan di file ini.
window.PEMBELAJAR_CONFIG = Object.assign({
  apiBase: "", // contoh: "https://pembelajaran-api.onrender.com/"
  firebase: {
    apiKey: "AIzaSyDVFffqgybE1zE_GVfhP3QWycxgz_IDNDI",
    authDomain: "pembelajaran-90f14.firebaseapp.com",
    projectId: "pembelajaran-90f14",
    storageBucket: "pembelajaran-90f14.firebasestorage.app",
    messagingSenderId: "584399346944",
    appId: "1:584399346944:web:2c21af2603351aff8627e5"
  }
}, window.PEMBELAJAR_CONFIG || {})
