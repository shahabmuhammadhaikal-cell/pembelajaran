import { useEffect, useState } from "react"
import Modal from "./Modal.jsx"
import { useApp } from "../state/useApp.js"
import { useAuth } from "../state/AuthContext.jsx"
import { currentIdToken } from "../lib/firebase.js"
import { fetchLeaderboard } from "../lib/accountApi.js"

const MEDALS = ["🥇", "🥈", "🥉"]

export default function LeaderboardModal() {
  const { state, actions } = useApp()
  const { user } = useAuth()
  const open = state.ui.leaderboardOpen
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (!open) return undefined
    let alive = true
    const load = async () => {
      setLoading(true)
      setError("")
      try {
        const token = user ? await currentIdToken() : ""
        const data = await fetchLeaderboard(token)
        if (!alive) return
        setRows(Array.isArray(data.rows) ? data.rows : [])
      } catch (err) {
        if (alive) setError(err && err.message ? err.message : "Gagal memuat papan peringkat")
      } finally {
        if (alive) setLoading(false)
      }
    }
    load()
    return () => {
      alive = false
    }
  }, [open, user])

  const close = () => actions.setUi({ leaderboardOpen: false })

  return (
    <Modal
      open={open}
      onClose={close}
      title="Papan peringkat"
      subtitle="Poin dari bintang, kata dikuasai, dan hari beruntun"
    >
      {loading ? (
        <div className="skeleton" style={{ height: 180 }} />
      ) : error ? (
        <p className="account-error">{error}</p>
      ) : rows.length ? (
        <div className="leaderboard-list">
          {rows.map(row => (
            <div key={`${row.rank}-${row.name}`} className={`leaderboard-row ${row.isYou ? "you" : ""}`}>
              <span className="leaderboard-rank">{MEDALS[row.rank - 1] || row.rank}</span>
              <span className="leaderboard-avatar" aria-hidden>{row.avatar}</span>
              <span className="leaderboard-copy">
                <strong>
                  {row.name}
                  {row.isYou ? <span className="badge">Kamu</span> : null}
                </strong>
                <span className="note">
                  Lv {row.level} · {row.levelTitle} · ⭐ {row.stars} · 🔥 {row.streak}
                </span>
              </span>
              <span className="leaderboard-points">{row.points}</span>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty" style={{ padding: 26 }}>
          <div className="empty-icon">🏅</div>
          <h3>Belum ada peserta</h3>
          <p>
            Papan peringkat hanya menampilkan akun yang ikut. Aktifkan “Tampilkan saya di papan
            peringkat” di pengaturan akun.
          </p>
          <button
            className="btn btn-primary"
            onClick={() => {
              close()
              actions.setUi({ accountOpen: true })
            }}
          >
            Buka pengaturan akun
          </button>
        </div>
      )}

      <p className="note" style={{ marginTop: 14 }}>
        Hanya nama, avatar, dan poin yang ditampilkan — tidak ada email atau data belajar mentah.
      </p>
    </Modal>
  )
}
