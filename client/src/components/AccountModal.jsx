import { useState } from "react"
import { useApp } from "../state/useApp.js"
import { useAuth } from "../state/AuthContext.jsx"
import { useSync } from "../state/SyncContext.jsx"
import {
  authErrorMessage,
  currentIdToken,
  linkGoogle,
  reauthenticateWithGoogle,
  sendMagicLink,
  sendPasswordReset,
  sendVerificationEmail,
  signInEmail,
  signInGoogle,
  signUpEmail,
  signOutUser
} from "../lib/firebase.js"
import {
  deleteAccount as deleteAccountRequest,
  fetchAccountProgress,
  generateFamilyCode,
  joinFamily,
  leaveFamily,
  requestDeletionTicket
} from "../lib/accountApi.js"
import { accountDisplayName, accountInitial, levelFromPoints } from "../lib/accountLevel.js"
import { deleteAccountWithReauth } from "../lib/accountDeletion.js"
import { resetAccountSession } from "../lib/accountOwner.js"
import { clearKidsStorage } from "../hooks/useKidsProgress.js"
import { STORAGE_KEY } from "../lib/storage.js"
import { IconX } from "./Icons.jsx"

function syncLabel(status, lastSaved, error) {
  if (status === "loading") return "Menyambung ke akun…"
  if (status === "saving") return "Menyimpan…"
  if (status === "offline") return error ? `Offline: ${error}` : "Offline — progres belum tersimpan"
  if (status === "error") return error ? `Gagal menyimpan: ${error}` : "Gagal menyimpan"
  if (lastSaved) return `Tersimpan ${new Date(lastSaved).toLocaleTimeString("id-ID")}`
  return "Siap menyimpan ke akun"
}

function clearLocalProgress() {
  clearKidsStorage()
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    /* localStorage diblokir: abaikan */
  }
}

const ACHIEVEMENTS = [
  { id: "first", icon: "🌱", label: "Langkah pertama", test: stats => stats.points > 0 },
  { id: "stars100", icon: "⭐", label: "100 bintang", test: stats => stats.stars >= 100 },
  { id: "mastered50", icon: "📚", label: "50 kata dikuasai", test: stats => stats.mastered >= 50 },
  { id: "streak7", icon: "🔥", label: "7 hari beruntun", test: stats => stats.streak >= 7 },
  { id: "favorites", icon: "💜", label: "10 favorit", test: stats => stats.favorites >= 10 },
  { id: "quiz100", icon: "🎯", label: "100 jawaban", test: stats => stats.attempts >= 100 },
  { id: "level3", icon: "🏅", label: "Level 3", test: stats => stats.level >= 3 }
]

const EMPTY_STATS = {
  points: 0,
  stars: 0,
  mastered: 0,
  streak: 0,
  attempts: 0,
  favorites: 0,
  level: 1,
  levelTitle: "Pemula"
}

export default function AccountModal() {
  const { state, actions } = useApp()
  const { configured, user, ready, refreshUser } = useAuth()
  const { status, lastSaved, error, flushNow, retry, refresh, session, queue } = useSync()
  const profile = session.account && session.account.profile
  const stats = session.stats || EMPTY_STATS
  const role = (session.account && session.account.role) || "user"
  const family = session.family || null
  const level = stats.level ? { level: stats.level, title: stats.levelTitle } : levelFromPoints(stats.points)
  const [mode, setMode] = useState("masuk")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState("")
  const [formError, setFormError] = useState("")
  const [discardConfirm, setDiscardConfirm] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const [deleteBusy, setDeleteBusy] = useState(false)
  const [deletePassword, setDeletePassword] = useState("")
  const [deleteError, setDeleteError] = useState("")
  const [magicSent, setMagicSent] = useState("")
  const [profileBusy, setProfileBusy] = useState(false)
  const [profileError, setProfileError] = useState("")
  const [familyCode, setFamilyCode] = useState("")
  const [joinCode, setJoinCode] = useState("")
  const [familyBusy, setFamilyBusy] = useState(false)
  const [familyError, setFamilyError] = useState("")
  const [familyMessage, setFamilyMessage] = useState("")

  if (!state.ui.accountOpen) return null

  const close = () => {
    setDiscardConfirm(false)
    setDeleteConfirm(false)
    setDeletePassword("")
    setDeleteError("")
    actions.setUi({ accountOpen: false })
  }

  const fail = errorValue => {
    setFormError(authErrorMessage(errorValue))
    setMessage("")
  }

  const submit = async event => {
    event.preventDefault()
    setBusy(true)
    setFormError("")
    setMessage("")
    try {
      if (mode === "tautan") {
        if (!email.trim()) throw new Error("Isi email dulu untuk menerima tautan masuk.")
        await sendMagicLink(email)
        setMagicSent(email.trim())
        setMessage("Tautan masuk sudah dikirim. Buka email itu di perangkat ini untuk masuk.")
      } else if (mode === "daftar") {
        await signUpEmail(email, password)
        await sendVerificationEmail().catch(() => {})
        setMessage("Akun dibuat. Kami mengirim tautan verifikasi ke email kamu.")
      } else {
        await signInEmail(email, password)
        setMessage("Berhasil masuk. Progres akan disinkronkan otomatis.")
      }
      setPassword("")
    } catch (errorValue) {
      fail(errorValue)
    } finally {
      setBusy(false)
    }
  }

  const googleLogin = async () => {
    setBusy(true)
    setFormError("")
    setMessage("")
    try {
      await signInGoogle()
      setMessage("Berhasil masuk dengan Google. Progres akan disinkronkan otomatis.")
      setPassword("")
    } catch (errorValue) {
      fail(errorValue)
    } finally {
      setBusy(false)
    }
  }

  const forgotPassword = async () => {
    if (!email.trim()) {
      setFormError("Isi email akun dulu, lalu tekan Lupa password.")
      return
    }
    setBusy(true)
    setFormError("")
    setMessage("")
    try {
      await sendPasswordReset(email)
      setMessage("Tautan reset password sudah dikirim. Periksa kotak masuk dan folder spam.")
    } catch (errorValue) {
      fail(errorValue)
    } finally {
      setBusy(false)
    }
  }

  const resendVerification = async () => {
    setBusy(true)
    setFormError("")
    setMessage("")
    try {
      await sendVerificationEmail()
      setMessage("Email verifikasi dikirim ulang. Buka tautannya, lalu tekan Cek verifikasi.")
    } catch (errorValue) {
      fail(errorValue)
    } finally {
      setBusy(false)
    }
  }

  const checkVerification = async () => {
    setBusy(true)
    setFormError("")
    setMessage("")
    try {
      const next = await refreshUser()
      if (next && next.emailVerified) setMessage("Email sudah terverifikasi. Terima kasih!")
      else setMessage("Email belum terverifikasi. Buka tautan di email lalu coba lagi.")
    } catch (errorValue) {
      fail(errorValue)
    } finally {
      setBusy(false)
    }
  }

  const connectGoogle = async () => {
    setBusy(true)
    setFormError("")
    setMessage("")
    try {
      await linkGoogle()
      await refreshUser()
      setMessage("Akun Google terhubung. Sekarang bisa masuk dengan satu klik.")
    } catch (errorValue) {
      fail(errorValue)
    } finally {
      setBusy(false)
    }
  }

  const exportData = async () => {
    setBusy(true)
    setFormError("")
    setMessage("")
    try {
      const token = await currentIdToken()
      if (!token) throw new Error("Sesi login berakhir. Silakan masuk lagi.")
      const data = await fetchAccountProgress(token)
      const payload = {
        exported_at: new Date().toISOString(),
        uid: data.uid,
        email: user && user.email,
        account: data.account || null
      }
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" })
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = `pembelajar-${new Date().toISOString().slice(0, 10)}.json`
      document.body.appendChild(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(url)
      setMessage("Salinan progres diunduh.")
    } catch (errorValue) {
      fail(errorValue)
    } finally {
      setBusy(false)
    }
  }

  const withToken = async task => {
    const token = await currentIdToken()
    if (!token) throw new Error("Sesi login berakhir. Silakan masuk lagi.")
    return task(token)
  }

  const toggleLeaderboard = async () => {
    setProfileBusy(true)
    setProfileError("")
    try {
      queue({ profile: { leaderboard: !(profile && profile.leaderboard) } })
      const result = await flushNow()
      if (!result.ok) throw new Error(result.error || "Belum tersimpan. Coba lagi.")
    } catch (errorValue) {
      setProfileError(errorValue && errorValue.message ? errorValue.message : "Gagal menyimpan")
    } finally {
      setProfileBusy(false)
    }
  }

  const createFamilyCode = async () => {
    setFamilyBusy(true)
    setFamilyError("")
    setFamilyMessage("")
    try {
      if (profile && profile.familyCode) {
        try {
          await navigator.clipboard.writeText(profile.familyCode)
          setFamilyMessage("Kode keluarga disalin.")
        } catch {
          setFamilyMessage(`Kode keluarga: ${profile.familyCode}`)
        }
        return
      }
      const data = await withToken(token => generateFamilyCode(token))
      setFamilyCode(data.code || "")
      setFamilyMessage("Kode keluarga siap dibagikan.")
      await retryProfile()
    } catch (errorValue) {
      setFamilyError(errorValue && errorValue.message ? errorValue.message : "Gagal membuat kode")
    } finally {
      setFamilyBusy(false)
    }
  }

  const joinFamilyCode = async () => {
    setFamilyBusy(true)
    setFamilyError("")
    setFamilyMessage("")
    try {
      const data = await withToken(token => joinFamily(token, joinCode))
      setJoinCode("")
      setFamilyMessage(`Bergabung dengan keluarga ${data.family ? data.family.ownerName : ""}.`.trim())
      await retryProfile()
    } catch (errorValue) {
      setFamilyError(errorValue && errorValue.message ? errorValue.message : "Gagal bergabung")
    } finally {
      setFamilyBusy(false)
    }
  }

  const leaveFamilyGroup = async () => {
    setFamilyBusy(true)
    setFamilyError("")
    setFamilyMessage("")
    try {
      await withToken(token => leaveFamily(token))
      setFamilyMessage("Kamu keluar dari keluarga. Profil anak di perangkat ini tetap ada.")
      await retryProfile()
    } catch (errorValue) {
      setFamilyError(errorValue && errorValue.message ? errorValue.message : "Gagal keluar")
    } finally {
      setFamilyBusy(false)
    }
  }

  const retryProfile = async () => refresh().catch(() => false)

  const logout = async () => {
    setFormError("")
    setMessage("")
    const saved = await flushNow()
    if (!saved.ok) {
      setFormError(
        `Perubahan terakhir belum tersimpan.${saved.error ? ` ${saved.error}` : ""} Kamu bisa mencoba lagi atau keluar tanpa menyimpannya.`
      )
      setDiscardConfirm(true)
      return
    }
    await signOutUser()
    resetAccountSession()
    setDiscardConfirm(false)
    setMode("masuk")
  }

  const discardLogout = async () => {
    setFormError("")
    try {
      await signOutUser()
      resetAccountSession()
      clearLocalProgress()
      setDiscardConfirm(false)
      setMode("masuk")
    } catch (errorValue) {
      fail(errorValue)
    }
  }

  const startDelete = () => {
    setDeleteError("")
    setDeletePassword("")
    setDeleteConfirm(true)
  }

  const cancelDelete = () => {
    if (deleteBusy) return
    setDeleteConfirm(false)
    setDeletePassword("")
    setDeleteError("")
  }

  const verifyAndDelete = async method => {
    setDeleteBusy(true)
    setDeleteError("")
    setFormError("")
    setMessage("")
    try {
      // Verifikasi dulu; API hapus hanya dipanggil dengan tiket yang sah.
      await deleteAccountWithReauth({
        method,
        password: deletePassword,
        getToken: () => currentIdToken(),
        googleReauthentication: reauthenticateWithGoogle,
        requestTicket: requestDeletionTicket,
        deleteAccount: deleteAccountRequest
      })
      // Akun sudah terhapus di server; kegagalan sign-out lokal tidak boleh menahan pembersihan.
      await signOutUser().catch(() => {})
      resetAccountSession()
      clearLocalProgress()
      setMessage("Akun dan semua progres sudah dihapus.")
      setDeleteConfirm(false)
      setDeletePassword("")
      actions.setUi({ accountOpen: false })
    } catch (errorValue) {
      // Verifikasi gagal: batalkan langkah hapus dan jangan panggil API penghapusan.
      setDeleteConfirm(false)
      setDeletePassword("")
      setDeleteError(authErrorMessage(errorValue))
    } finally {
      setDeleteBusy(false)
    }
  }

  const providers = (user && user.providerData ? user.providerData : []).map(item => item.providerId)
  const googleLinked = providers.includes("google.com")
  const passwordLinked = providers.includes("password")
  const syncFailed = status === "offline" || status === "error"

  return (
    <div className="modal" role="dialog" aria-modal="true" aria-labelledby="account-title">
      <div className="modal-backdrop" onClick={close} />
      <div className="modal-card account-card">
        <div className="modal-head">
          <div>
            <div className="modal-title" id="account-title">
              {user ? "Akun kamu" : "Masuk atau daftar"}
            </div>
            <div className="modal-sub">Simpan bintang, level, stiker, dan progres ke akun</div>
          </div>
          <button className="icon-btn" onClick={close} aria-label="Tutup">
            <IconX />
          </button>
        </div>

        <div className="modal-body">
          {!configured ? (
            <div className="account-note">
              <p>
                <strong>Login belum aktif.</strong> Konfigurasi Firebase belum diisi, jadi progres masih
                tersimpan di perangkat ini saja.
              </p>
              <ol className="account-steps">
                <li>
                  Buat project Firebase, lalu aktifkan <b>Authentication → Email/Password</b> (dan{" "}
                  <b>Google</b> bila ingin login Google).
                </li>
                <li>
                  Tambahkan web app, salin konfigurasinya ke <code>client/public/app.config.js</code>.
                </li>
                <li>
                  Isi <code>FIREBASE_SERVICE_ACCOUNT</code> di server (Render) agar token login bisa
                  diverifikasi.
                </li>
              </ol>
              <pre className="account-code">{`window.PEMBELAJAR_CONFIG = Object.assign({
  firebase: {
    apiKey: "...",
    authDomain: "project.firebaseapp.com",
    projectId: "...",
    appId: "..."
  }
}, window.PEMBELAJAR_CONFIG || {})`}</pre>
              <p className="note">
                Setelah diisi, tombol Masuk/Daftar langsung aktif. Tidak ada password yang disimpan di
                server — autentikasi sepenuhnya di Firebase.
              </p>
            </div>
          ) : user ? (
            <div className="account-profile-wrap">
              <div className="account-profile">
                <div className="account-avatar" aria-hidden>
                  {(profile && profile.avatar) || accountInitial(profile, user.email)}
                </div>
                <div className="account-identity">
                  <div className="account-email">
                    {accountDisplayName(profile, user.email)}
                    {role === "admin" ? <span className="role-badge">Admin</span> : null}
                  </div>
                  <div className="account-subline">
                    <span className="level-pill">Lv {level.level} · {level.title}</span>
                    <span>{user.email}</span>
                  </div>
                  <div className={`account-sync status-${status}`}>
                    {syncLabel(status, lastSaved, error)}
                  </div>
                </div>
                <button
                  className="btn btn-ghost btn-sm account-edit"
                  onClick={() => actions.setUi({ accountOpen: false, onboardingOpen: true })}
                >
                  Edit profil
                </button>
              </div>

              <div className="account-stat-grid">
                <div className="account-stat">
                  <strong>{stats.points}</strong>
                  <span>Poin</span>
                </div>
                <div className="account-stat">
                  <strong>⭐ {stats.stars}</strong>
                  <span>Bintang</span>
                </div>
                <div className="account-stat">
                  <strong>{stats.mastered}</strong>
                  <span>Kata dikuasai</span>
                </div>
                <div className="account-stat">
                  <strong>🔥 {stats.streak}</strong>
                  <span>Hari beruntun</span>
                </div>
              </div>

              <div className="achievement-row">
                {ACHIEVEMENTS.map(badge => {
                  const unlocked = badge.test(stats)
                  return (
                    <span
                      key={badge.id}
                      className={`achievement ${unlocked ? "unlocked" : "locked"}`}
                      title={badge.label}
                    >
                      <span aria-hidden>{badge.icon}</span>
                      {badge.label}
                    </span>
                  )
                })}
              </div>

              <div className="account-option-row">
                <label className="toggle-row compact">
                  <input
                    type="checkbox"
                    checked={Boolean(profile && profile.leaderboard)}
                    onChange={toggleLeaderboard}
                    disabled={profileBusy}
                  />
                  <span>Tampilkan saya di papan peringkat</span>
                </label>
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => actions.setUi({ leaderboardOpen: true })}
                >
                  Lihat peringkat
                </button>
              </div>
              {profileError ? <p className="account-error">{profileError}</p> : null}

              <div className="account-family">
                <div className="account-danger-title">Keluarga</div>
                {family && family.joined ? (
                  <>
                    <p className="note">
                      Profil Mode Anak dibagi dengan <strong>{family.ownerName}</strong>. Progres dewasa
                      tetap milik akun ini.
                    </p>
                    <button className="btn btn-ghost btn-sm" onClick={leaveFamilyGroup} disabled={familyBusy}>
                      Keluar dari keluarga
                    </button>
                  </>
                ) : (
                  <>
                    <p className="note">
                      Bagikan profil anak ke akun lain (mis. akun orang tua dan akun anak) dengan satu kode.
                    </p>
                    <div className="family-code-row">
                      <code className="family-code">{(profile && profile.familyCode) || familyCode || "——————"}</code>
                      <button className="btn btn-soft btn-sm" onClick={createFamilyCode} disabled={familyBusy}>
                        {profile && profile.familyCode ? "Salin kode" : "Buat kode"}
                      </button>
                    </div>
                    {profile && profile.familyCode ? (
                      <p className="note">Bagikan kode ini ke akun keluarga. Setiap kode hanya untuk satu akun.</p>
                    ) : null}
                    <div className="family-join-row">
                      <input
                        className="input"
                        value={joinCode}
                        onChange={event => setJoinCode(event.target.value.toUpperCase())}
                        placeholder="Masukkan kode keluarga"
                        maxLength={10}
                      />
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={joinFamilyCode}
                        disabled={familyBusy || joinCode.trim().length < 4}
                      >
                        Gabung
                      </button>
                    </div>
                  </>
                )}
                {familyError ? <p className="account-error">{familyError}</p> : null}
                {familyMessage ? <p className="account-ok">{familyMessage}</p> : null}
              </div>

              {user.emailVerified === false ? (
                <div className="account-verification">
                  <div>
                    <strong>Email belum diverifikasi.</strong>
                    <p className="note">Verifikasi membantu memulihkan akun bila password hilang.</p>
                  </div>
                  <div className="account-verification-actions">
                    <button className="btn btn-ghost btn-sm" onClick={resendVerification} disabled={busy}>
                      Kirim ulang
                    </button>
                    <button className="btn btn-ghost btn-sm" onClick={checkVerification} disabled={busy}>
                      Cek verifikasi
                    </button>
                  </div>
                </div>
              ) : null}

              {message ? <p className="account-ok">{message}</p> : null}
              {formError ? <p className="account-error">{formError}</p> : null}

              <p className="note">
                Bintang, level, stiker, cerita, dan progres latihan tersimpan di akun ini dan bisa
                dilanjutkan dari perangkat lain.
              </p>

              <div className="account-actions">
                {syncFailed ? (
                  <button className="btn btn-ghost" onClick={() => retry()}>
                    Coba sambung lagi
                  </button>
                ) : null}
                <button className="btn btn-ghost" onClick={close}>
                  Tutup
                </button>
                <button className="btn btn-danger" onClick={logout}>
                  Keluar
                </button>
              </div>

              {discardConfirm ? (
                <div className="account-warning">
                  <p>
                    Perubahan terakhir belum terkirim ke akun. Keluar sekarang akan membuang perubahan
                    tersebut dari perangkat ini.
                  </p>
                  <div className="account-warning-actions">
                    <button className="btn btn-ghost btn-sm" onClick={() => setDiscardConfirm(false)}>
                      Batal
                    </button>
                    <button className="btn btn-danger btn-sm" onClick={discardLogout}>
                      Keluar tanpa menyimpan
                    </button>
                  </div>
                </div>
              ) : null}

              <div className="account-links">
                {googleLinked ? (
                  <span className="account-badge">Google terhubung</span>
                ) : passwordLinked ? (
                  <button className="btn btn-ghost btn-sm" onClick={connectGoogle} disabled={busy}>
                    Hubungkan Google
                  </button>
                ) : null}
              </div>

              <div className="account-danger">
                <div className="account-danger-title">Data & akun</div>
                <div className="account-danger-actions">
                  <button className="btn btn-ghost btn-sm" onClick={exportData} disabled={busy}>
                    Ekspor data
                  </button>
                  {!deleteConfirm ? (
                    <button className="btn btn-ghost btn-sm" onClick={startDelete} disabled={deleteBusy}>
                      Hapus akun
                    </button>
                  ) : null}
                </div>

                {deleteConfirm ? (
                  <div className="account-danger-panel">
                    <strong>Verifikasi identitas sebelum menghapus</strong>
                    <p>
                      Semua progres, termasuk semua profil anak, akan dihapus permanen dan tidak bisa
                      dikembalikan. Password atau popup Google diverifikasi oleh server, bukan hanya
                      mengandalkan sesi login yang sedang aktif.
                    </p>
                    {passwordLinked ? (
                      <div className="form-row">
                        <label htmlFor="delete-password">Password akun</label>
                        <input
                          id="delete-password"
                          className="input"
                          type="password"
                          autoComplete="current-password"
                          value={deletePassword}
                          onChange={event => setDeletePassword(event.target.value)}
                          placeholder="Password akun kamu"
                          disabled={deleteBusy}
                        />
                      </div>
                    ) : null}
                    {deleteError ? <p className="account-error">{deleteError}</p> : null}
                    <div className="account-danger-actions">
                      {passwordLinked ? (
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => verifyAndDelete("password")}
                          disabled={deleteBusy || !deletePassword.trim()}
                        >
                          {deleteBusy ? <span className="spinner" /> : null}
                          Verifikasi & hapus
                        </button>
                      ) : null}
                      {googleLinked ? (
                        <button
                          className="btn btn-ghost btn-sm"
                          onClick={() => verifyAndDelete("google")}
                          disabled={deleteBusy}
                        >
                          Verifikasi dengan Google
                        </button>
                      ) : null}
                      {!passwordLinked && !googleLinked ? (
                        <p className="account-danger-note">
                          Metode login ini tidak mendukung verifikasi ulang. Keluar lalu masuk lagi, kemudian
                          coba hapus akun.
                        </p>
                      ) : null}
                      <button className="btn btn-ghost btn-sm" onClick={cancelDelete} disabled={deleteBusy}>
                        Batal
                      </button>
                    </div>
                  </div>
                ) : deleteError ? (
                  <p className="account-danger-note">{deleteError}</p>
                ) : null}
              </div>
            </div>
          ) : !ready ? (
            <div className="account-loading">
              <span className="spinner" /> Memeriksa sesi…
            </div>
          ) : (
            <>
              <button type="button" className="btn account-google" onClick={googleLogin} disabled={busy}>
                <span className="account-google-mark" aria-hidden>
                  G
                </span>
                Lanjut dengan Google
              </button>
              <div className="account-divider">
                <span>atau dengan email</span>
              </div>

              <div className="account-tabs">
                <button
                  type="button"
                  className={mode === "masuk" ? "active" : ""}
                  onClick={() => {
                    setMode("masuk")
                    setFormError("")
                    setMessage("")
                  }}
                >
                  Masuk
                </button>
                <button
                  type="button"
                  className={mode === "daftar" ? "active" : ""}
                  onClick={() => {
                    setMode("daftar")
                    setFormError("")
                    setMessage("")
                  }}
                >
                  Daftar
                </button>
                <button
                  type="button"
                  className={mode === "tautan" ? "active" : ""}
                  onClick={() => {
                    setMode("tautan")
                    setFormError("")
                    setMessage("")
                  }}
                >
                  Tautan email
                </button>
              </div>

              <form className="account-form" onSubmit={submit}>
                <div className="form-row">
                  <label htmlFor="account-email">Email</label>
                  <input
                    id="account-email"
                    className="input"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={event => setEmail(event.target.value)}
                    placeholder="nama@email.com"
                  />
                </div>
                {mode !== "tautan" ? (
                  <div className="form-row">
                    <label htmlFor="account-password">Password</label>
                    <input
                      id="account-password"
                      className="input"
                      type="password"
                      autoComplete={mode === "daftar" ? "new-password" : "current-password"}
                      required
                      minLength={6}
                      value={password}
                      onChange={event => setPassword(event.target.value)}
                      placeholder="Minimal 6 karakter"
                    />
                  </div>
                ) : (
                  <p className="note">
                    Tanpa password: kami mengirim tautan masuk ke emailmu. Buka tautan itu di perangkat
                    ini untuk masuk otomatis.
                  </p>
                )}
                {magicSent ? <p className="account-ok">Tautan dikirim ke {magicSent}.</p> : null}

                {formError ? <p className="account-error">{formError}</p> : null}
                {message ? <p className="account-ok">{message}</p> : null}

                <button className="btn btn-primary" type="submit" disabled={busy}>
                  {busy ? <span className="spinner" /> : null}
                  {mode === "daftar" ? "Buat akun" : mode === "tautan" ? "Kirim tautan masuk" : "Masuk"}
                </button>
              </form>

              {mode === "masuk" ? (
                <button type="button" className="account-link" onClick={forgotPassword} disabled={busy}>
                  Lupa password?
                </button>
              ) : null}

              <p className="note">
                Progres yang sudah ada di perangkat ini akan digabung ke akun saat pertama kali masuk.
                Login Google memerlukan provider Google yang aktif di Firebase Console.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
