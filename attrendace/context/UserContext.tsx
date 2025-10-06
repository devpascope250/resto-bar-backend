// context/AuthContext.tsx
'use client' // Only for Next.js 13+ App Router

import { User } from '@prisma/client'
import { createContext, useContext, useEffect, useState } from 'react'
// import { useRouter } from 'next/router' // For Pages Router
interface UserContextType {
  userBasicInfo: User | null
  loading: boolean,
  accessToken: string
}

const UserContext = createContext<UserContextType>({} as UserContextType)

export function UserProvider({token, children }: {token: string, children: React.ReactNode }) {
  const [userBasicInfo, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [accessToken] = useState(token);
  useEffect(() => {
    async function loadUser() {
      try {
        const response = await fetch('/api/auth/basic_info')
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

  return (
    <UserContext.Provider value={{ userBasicInfo, loading, accessToken}}>
      {children}
    </UserContext.Provider>
  )
}

export const useUser = () => useContext(UserContext)