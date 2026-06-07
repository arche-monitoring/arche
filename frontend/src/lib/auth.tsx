import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react"
import { api } from "./api-client"

interface AuthContextType {
  user: string | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  isSetupRequired: boolean
  login: (username: string, password: string) => Promise<void>
  logout: () => Promise<void>
  setup: (username: string, password: string) => Promise<void>
  changeCredentials: (currentPassword: string, newUsername: string, newPassword: string) => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<string | null>(null)
  const [token, setToken] = useState<string | null>(() => {
    try { return localStorage.getItem("auth_token") } catch { return null }
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isSetupRequired, setIsSetupRequired] = useState(false)

  useEffect(() => {
    checkAuth()
  }, [])

  async function checkAuth() {
    setIsLoading(true)
    try {
      const result = await api.auth.me()
      if (result.authenticated && result.username) {
        setUser(result.username)
        setIsSetupRequired(false)
      } else if (result.setupRequired) {
        setUser(null)
        setIsSetupRequired(true)
        try { localStorage.removeItem("auth_token") } catch {}
        setToken(null)
      } else {
        setUser(null)
        setIsSetupRequired(false)
        try { localStorage.removeItem("auth_token") } catch {}
        setToken(null)
      }
    } catch {
      setUser(null)
      setIsSetupRequired(false)
    } finally {
      setIsLoading(false)
    }
  }

  const login = useCallback(async (username: string, password: string) => {
    const result = await api.auth.login(username, password)
    setToken(result.token)
    setUser(result.username)
    setIsSetupRequired(false)
    try { localStorage.setItem("auth_token", result.token) } catch {}
  }, [])

  const logout = useCallback(async () => {
    try { await api.auth.logout() } catch {}
    setToken(null)
    setUser(null)
    try { localStorage.removeItem("auth_token") } catch {}
  }, [])

  const setup = useCallback(async (username: string, password: string) => {
    const result = await api.auth.setup(username, password)
    setToken(result.token)
    setUser(result.username)
    setIsSetupRequired(false)
    try { localStorage.setItem("auth_token", result.token) } catch {}
  }, [])

  const changeCredentials = useCallback(async (currentPassword: string, newUsername: string, newPassword: string) => {
    const result = await api.auth.changeCredentials(currentPassword, newUsername, newPassword)
    setToken(result.token)
    setUser(result.username)
    try { localStorage.setItem("auth_token", result.token) } catch {}
  }, [])

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user && !!token,
        isLoading,
        isSetupRequired,
        login,
        logout,
        setup,
        changeCredentials,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within AuthProvider")
  return ctx
}
