import { useApp } from "../state/useApp.js"
import { useAuth } from "../state/AuthContext.jsx"
import { useSync } from "../state/SyncContext.jsx"
import { IconBulb, IconMoon, IconSearch, IconSettings, IconSun, IconUser } from "./Icons.jsx"

export default function Header() {
  const { state, actions } = useApp()
  const { user } = useAuth()
  const { status: syncStatus, error: syncError, lastSaved, retry } = useSync()
  const { settings, catalog, ui } = state
  const syncFailed = syncStatus === "offline" || syncStatus === "error"
  const syncLabel = syncFailed
    ? "Gagal"
    : syncStatus === "loading"
      ? "Menyambung…"
      : syncStatus === "saving"
        ? "Menyimpan…"
        : "Tersimpan"
  const syncTitle = syncFailed
    ? syncError || "Perubahan belum tersimpan ke akun"
    : syncStatus === "loading"
      ? "Memuat progres dari akun"
      : syncStatus === "saving"
        ? "Perubahan sedang dikirim ke akun"
        : lastSaved
          ? `Tersimpan ke akun pukul ${new Date(lastSaved).toLocaleTimeString("id-ID")}`
          : "Progres akun sudah tersimpan"
  const isDark = settings.theme !== "light"

  const toggleTheme = () => {
    actions.setSetting("theme", isDark ? "light" : "dark")
  }

  return (
    <header className="app-header">
      <div className="header-inner">
        <div className="brand">
          <div className="brand-mark" aria-hidden>
            <span>ع</span>
          </div>
          <div className="brand-text">
            <span className="brand-title">Pembelajar</span>
            <span className="brand-sub">English · العربية · Indonesia</span>
          </div>
        </div>

        <div className="header-tools">
          <label className="field">
            <span className="field-label">Arah</span>
            <select
              value={settings.direction}
              onChange={event => actions.setSetting("direction", event.target.value)}
              aria-label="Arah terjemah"
            >
              <option value="en-ar">Inggris → Arab</option>
              <option value="ar-en">Arab → Inggris</option>
            </select>
          </label>

          <label className="field">
            <span className="field-label">Kategori</span>
            <select
              value={settings.category}
              onChange={event => actions.selectCategory(event.target.value)}
              aria-label="Kategori kosakata"
              disabled={!catalog.loaded}
            >
              {!catalog.loaded ? <option value="__loading">Memuat…</option> : null}
              <option value="__all">Semua kategori</option>
              {catalog.categories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.name}
                  {category.count ? ` (${category.count})` : ""}
                </option>
              ))}
            </select>
          </label>

          <label className="field search-field">
            <IconSearch />
            <input
              type="search"
              value={settings.search}
              onChange={event => actions.setSetting("search", event.target.value)}
              placeholder="Cari kata (EN/AR/ID)…"
              aria-label="Cari kata"
            />
          </label>

          <button
            className="icon-btn"
            onClick={toggleTheme}
            aria-label={isDark ? "Ganti ke tema terang" : "Ganti ke tema gelap"}
            title={isDark ? "Tema terang" : "Tema gelap"}
          >
            {isDark ? <IconSun /> : <IconMoon />}
          </button>

          {user ? (
            <div
              className={`sync-pill ${syncStatus}`}
              role="status"
              aria-live="polite"
              title={syncTitle}
            >
              <span className="sync-dot" aria-hidden />
              <span className="sync-label">{syncLabel}</span>
              {syncFailed ? (
                <button type="button" className="sync-retry" onClick={() => retry()}>
                  Coba lagi
                </button>
              ) : null}
            </div>
          ) : null}

          <button
            className={`icon-btn account-btn ${ui.accountOpen ? "active" : ""}`}
            onClick={() => actions.setUi({ accountOpen: !ui.accountOpen })}
            aria-label={user ? `Akun ${user.email || ""}` : "Masuk atau daftar"}
            title={user ? user.email || "Akun" : "Masuk untuk menyimpan skor"}
          >
            <IconUser />
            {user ? <span className="account-dot" aria-hidden /> : null}
          </button>

          <button
            className={`icon-btn ${ui.suggestionsOpen ? "active" : ""}`}
            onClick={() => actions.setUi({ suggestionsOpen: !ui.suggestionsOpen })}
            aria-label="Saran kata"
            title="Saran kata"
          >
            <IconBulb />
          </button>

          <button
            className={`icon-btn ${ui.settingsOpen ? "active" : ""}`}
            onClick={() => actions.setUi({ settingsOpen: !ui.settingsOpen })}
            aria-label="Pengaturan"
            title="Pengaturan"
          >
            <IconSettings />
          </button>
        </div>
      </div>
    </header>
  )
}
