import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react"
import { firebaseConfigured, refreshCurrentUser, subscribeAuth } from "../lib/firebase.js"

export const AuthContext = createContext(null)

/**
 * Hanya menyimpan status sesi Firebase. Aksi masuk/daftar/keluar dipakai
 * langsung dari lib/firebase.js oleh layar yang membutuhkannya.
 */
export function AuthProvider({ children }) {
  const configured = firebaseConfigured()
  const [user, setUser] = useState(null)
  const [ready, setReady] = useState(!configured)

  useEffect(() => {
    let alive = true
    let unsubscribe = () => {}
    subscribeAuth(next => {
      if (!alive) return
      setUser(next)
      setReady(true)
    })
      .then(stop => {
        if (alive) unsubscribe = stop || (() => {})
        else if (stop) stop()
      })
      .catch(() => {
        if (alive) setReady(true)
      })
    return () => {
      alive = false
      unsubscribe()
    }
  }, [])

  const refreshUser = useCallback(async () => {
    const next = await refreshCurrentUser()
    if (next) {
      // Salin field yang dipakai UI; spread User Firebase bisa kehilangan getter providerData.
      const profile = {
        uid: next.uid,
        email: next.email || "",
        emailVerified: !!next.emailVerified,
        displayName: next.displayName || "",
        providerData: (next.providerData || []).map(item => ({ providerId: item.providerId }))
      }
      setUser(profile)
      return profile
    }
    return null
  }, [])

  const value = useMemo(
    () => ({ configured, user, ready, refreshUser }),
    [configured, user, ready, refreshUser]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error("useAuth harus dipakai di dalam AuthProvider")
  return context
}
