// context/AuthContext.tsx
'use client' // Only for Next.js 13+ App Router

import { createContext, useContext, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation' // For App Router
// import { useRouter } from 'next/router' // For Pages Router
export interface User {
  id: number
  role: Role
}

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    async function loadUser() {
      try {
        const response = await fetch('/api/auth/session')
        const data = await response.json()
        
        if (response.ok) {
          setUser(data)
        } else {
          setUser(null)
        }
      } catch (error) {
        setUser(null)
      } finally {
        setLoading(false)
      }
    }
    
    loadUser()
  }, [])

  const login = async (email: string, password: string) => {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
    const data = await response.json()

    if (response.ok) {
      setUser(data);
    } else {
      throw new Error(data.message || 'Login failed')
    }
  }

  const register = async (email: string, password: string) => {
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })

    const data = await response.json()

    if (response.ok) {
      setUser(data)
      router.push('/auth')
    } else {
      throw new Error(data.message || 'Registration failed')
    }
  }


  const logout = async () => {
    try{
      setLoading(true)
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include', // Ensure cookies are sent with the request
      });

      if (response.ok) {
        setUser(null)
        window.location.href = '/auth' // Redirect to login page
      }
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)