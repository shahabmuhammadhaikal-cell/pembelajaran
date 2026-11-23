/**
 * Seed data statis (assets/) ke Firebase Firestore.
 *
 * Jalankan:
 *   cd server
 *   FIREBASE_SERVICE_ACCOUNT='{"type":"service_account",...}' node scripts/seed-firestore.js
 *
 * Atau set GOOGLE_APPLICATION_CREDENTIALS ke file service account.
 * Opsional:
 *   node scripts/seed-firestore.js --dry-run   (hanya menampilkan ringkasan)
 *
 * Server juga menyinkronkan Firestore otomatis saat start (katalog kosong atau
 * isi assets/data berubah), jadi skrip ini hanya untuk seed manual/verifikasi.
 */
const { loadLocalData, writeContent, chunkItems } = require("../db/seedContent")

async function main() {
  const dryRun = process.argv.includes("--dry-run")

  const { categories, allEntries, suggestions } = await loadLocalData()
  console.log(`[seed] kategori=${categories.length} entri=${allEntries.length} saran=${suggestions.length}`)

  if (dryRun) {
    for (const category of categories) {
      const items = allEntries.filter(item => item.__category === category.id)
      const chunks = chunkItems(items)
      console.log(`  - ${category.id.padEnd(28)} ${String(category.count).padStart(5)} entri  ${chunks.length} chunk`)
    }
    return
  }

  let admin
  try {
    admin = require("firebase-admin")
  } catch (error) {
    console.error("[seed] firebase-admin belum terpasang. Jalankan `npm install` di folder server.")
    process.exit(1)
  }

  const { parseServiceAccount, isFirestoreConfigured } = require("../db/firestore")
  if (!isFirestoreConfigured()) {
    console.error("[seed] Kredensial Firestore tidak ditemukan.")
    console.error("        Set FIREBASE_SERVICE_ACCOUNT (JSON) atau GOOGLE_APPLICATION_CREDENTIALS lalu ulangi.")
    process.exit(1)
  }

  if (!admin.apps.length) {
    const serviceAccount = parseServiceAccount()
    admin.initializeApp(
      serviceAccount
        ? { credential: admin.credential.cert(serviceAccount) }
        : { projectId: process.env.FIREBASE_PROJECT_ID || undefined }
    )
  }

  const db = admin.firestore()
  if (process.env.FIRESTORE_EMULATOR_HOST) {
    console.log(`[seed] emulator: ${process.env.FIRESTORE_EMULATOR_HOST}`)
  }

  await writeContent(db, { categories, allEntries, suggestions }, { log: message => console.log(message) })
  console.log("[seed] selesai.")
  await admin.app().delete()
}

main().catch(error => {
  console.error("[seed] gagal:", error)
  process.exit(1)
})
