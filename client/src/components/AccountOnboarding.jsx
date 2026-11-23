import { useEffect, useMemo, useState } from "react"
import Modal from "./Modal.jsx"
import { useApp } from "../state/useApp.js"
import { useAuth } from "../state/AuthContext.jsx"
import { useSync } from "../state/SyncContext.jsx"
import { AVATAR_CHOICES } from "../lib/accountLevel.js"

const GOALS = [
  { value: 3, label: "Santai", hint: "3 aktivitas / hari" },
  { value: 5, label: "Rutin", hint: "5 aktivitas / hari" },
  { value: 10, label: "Serius", hint: "10 aktivitas / hari" }
]

const STEPS = ["Nama", "Avatar", "Target", "Selesai"]

export default function AccountOnboarding() {
  const { state, actions } = useApp()
  const { user } = useAuth()
  const { session, queue, flushNow } = useSync()
  const profile = session.account && session.account.profile
  const isEdit = Boolean(state.ui.onboardingOpen)
  const autoOpen = Boolean(user) && session.ready && session.account !== null && !isEdit
  const shouldOpen = isEdit || (autoOpen && !(profile && profile.onboarded))

  const [step, setStep] = useState(0)
  const [name, setName] = useState("")
  const [avatar, setAvatar] = useState(AVATAR_CHOICES[0])
  const [goal, setGoal] = useState(5)
  const [leaderboard, setLeaderboard] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  // Server belum punya kredensial Firebase: bukan masalah koneksi pengguna.
  const [setupBlocked, setSetupBlocked] = useState(false)

  const fallbackName = useMemo(() => {
    const email = String((user && user.email) || "")
    return email ? email.split("@")[0] : "Pembelajar"
  }, [user])

  useEffect(() => {
    if (!shouldOpen) return
    setStep(0)
    setError("")
    setSetupBlocked(false)
    setName((profile && profile.name) || fallbackName)
    setAvatar((profile && profile.avatar) || AVATAR_CHOICES[0])
    setGoal((profile && profile.dailyGoal) || state.settings.dailyGoal || 5)
    setLeaderboard(profile ? profile.leaderboard === true : true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shouldOpen, user])

  if (!shouldOpen) return null

  const close = () => {
    setBusy(false)
    setError("")
    setSetupBlocked(false)
    actions.setUi({ onboardingOpen: false })
  }

  const persist = async payload => {
    setBusy(true)
    setError("")
    try {
      queue({ profile: payload })
      const result = await flushNow()
      if (!result.ok) throw new Error(result.error || "Profil belum tersimpan. Coba lagi.")
      actions.setSetting("dailyGoal", payload.dailyGoal || goal)
      close()
    } catch (err) {
      const message = err && err.message ? err.message : "Gagal menyimpan profil"
      // Tanpa kredensial di server, menyimpan profil tidak mungkin berhasil.
      if (/FIREBASE_SERVICE_ACCOUNT|belum dikonfigurasi/i.test(message)) setSetupBlocked(true)
      else setError(message)
    } finally {
      setBusy(false)
    }
  }

  const finish = () =>
    persist({
      name: name.trim().slice(0, 40) || fallbackName,
      avatar,
      dailyGoal: goal,
      onboarded: true,
      leaderboard
    })

  const skip = () =>
    persist({
      name: (profile && profile.name) || "",
      avatar: (profile && profile.avatar) || "",
      onboarded: true,
      leaderboard: false
    })

  return (
    <Modal
      open={shouldOpen}
      onClose={setupBlocked || isEdit ? close : skip}
      title={isEdit ? "Edit profil" : "Selamat datang!"}
      subtitle={isEdit ? "Atur tampilan dan target harianmu" : "Kenalan dulu, lalu mulai belajar"}
    >
      <div className="onboarding-steps" aria-hidden>
        {STEPS.map((label, index) => (
          <span key={label} className={`step-dot ${index === step ? "active" : ""} ${index < step ? "done" : ""}`}>
            {index + 1}
          </span>
        ))}
      </div>

      {step === 0 ? (
        <div className="onboarding-body">
          <div className="onboarding-emoji">👋</div>
          <h3>Siapa nama panggilanmu?</h3>
          <p className="note">Nama ini tampil di profil dan papan peringkat. Boleh nama pendek saja.</p>
          <input
            className="input"
            value={name}
            maxLength={40}
            onChange={event => setName(event.target.value)}
            placeholder={fallbackName}
            autoFocus
          />
        </div>
      ) : null}

      {step === 1 ? (
        <div className="onboarding-body">
          <h3>Pilih avatar</h3>
          <p className="note">Avatar tampil di header dan kartu profil.</p>
          <div className="avatar-grid">
            {AVATAR_CHOICES.map(choice => (
              <button
                key={choice}
                type="button"
                className={`avatar-choice ${choice === avatar ? "active" : ""}`}
                onClick={() => setAvatar(choice)}
                aria-label={`Avatar ${choice}`}
              >
                {choice}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {step === 2 ? (
        <div className="onboarding-body">
          <h3>Target harian</h3>
          <p className="note">Pilih seberapa sering kamu ingin belajar. Bisa diubah kapan saja.</p>
          <div className="goal-grid">
            {GOALS.map(item => (
              <button
                key={item.value}
                type="button"
                className={`goal-choice ${goal === item.value ? "active" : ""}`}
                onClick={() => setGoal(item.value)}
              >
                <strong>{item.label}</strong>
                <span>{item.hint}</span>
              </button>
            ))}
          </div>
          <label className="toggle-row">
            <input
              type="checkbox"
              checked={leaderboard}
              onChange={event => setLeaderboard(event.target.checked)}
            />
            <span>
              Tampilkan saya di papan peringkat
              <span className="note">Hanya nama dan avatar, tanpa email. Bisa dimatikan kapan saja.</span>
            </span>
          </label>
        </div>
      ) : null}

      {step === 3 ? (
        <div className="onboarding-body">
          <div className="onboarding-emoji">{avatar}</div>
          <h3>Siap, {name.trim() || fallbackName}!</h3>
          <p className="note">
            Target {goal} aktivitas per hari{leaderboard ? ", ikut papan peringkat" : ""}. Semua progres
            tersimpan di akunmu.
          </p>
        </div>
      ) : null}

      {error ? <p className="account-error">{error}</p> : null}
      {setupBlocked ? (
        <p className="account-error">
          Sinkronisasi akun belum aktif di server ini, jadi profil belum bisa disimpan ke akun. Progresmu
          tetap tersimpan di perangkat ini. Tekan tutup untuk melanjutkan.
        </p>
      ) : null}

      <div className="onboarding-actions">
        {step > 0 ? (
          <button className="btn btn-ghost" type="button" onClick={() => setStep(step - 1)} disabled={busy}>
            Kembali
          </button>
        ) : !isEdit ? (
          <button className="btn btn-ghost" type="button" onClick={setupBlocked ? close : skip} disabled={busy}>
            {setupBlocked ? "Tutup" : "Lewati"}
          </button>
        ) : (
          <span />
        )}
        {step < 3 ? (
          <button className="btn btn-primary" type="button" onClick={() => setStep(step + 1)}>
            Lanjut
          </button>
        ) : (
          <button className="btn btn-primary" type="button" onClick={finish} disabled={busy}>
            {busy ? <span className="spinner" /> : null}
            {isEdit ? "Simpan profil" : "Mulai belajar"}
          </button>
        )}
      </div>
    </Modal>
  )
}
