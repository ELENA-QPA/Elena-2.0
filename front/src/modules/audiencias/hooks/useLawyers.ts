import { useProfile } from "@/modules/perfil/hook/useProfile"
import { useState, useEffect } from "react"

export function useLawyers() {
  const [lawyersRecord, setLawyersRecord] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { getUsersByRol } = useProfile()

  const loadLawyers = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const users = await getUsersByRol('lawyer')

      const record: Record<string, string> = {}
      users.forEach((u: any) => {
        const fullname = `${(u.name || '').trim()} ${(u.lastname || '').trim()}`.trim()
        const displayName = fullname || u.email || u._id
        record[displayName] = u._id
      })

      setLawyersRecord(record)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return { 
    lawyersRecord, 
    loading, 
    error, 
    loadLawyers 
  }
}
