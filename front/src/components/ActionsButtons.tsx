"use client"

import { Button } from "@/components/ui/button"
import { Plus } from 'lucide-react'
import { useCallback } from "react"
import { useRouter } from "next-nprogress-bar"

interface ActionButtonsProps {
  onExport?: () => void
  drawerTrigger?: React.ReactNode
  exportLabel?: string
  showExport?: boolean
}

export function ActionButtons({
  onExport,
  drawerTrigger,
  exportLabel = "Export",
  showExport = true,
}: ActionButtonsProps) {
  const router = useRouter()

  const handleExport = useCallback(() => {
    if (onExport) {
      onExport()
    } else {
      console.log('Exportando...')
    }
  }, [onExport])

  return (
    <div className="flex items-center gap-2">
      {showExport && (
        <Button
          variant="outline"
          className="text-primary hover:text-primary hover:bg-primary/10"
          onClick={handleExport}
        >
          {exportLabel}
        </Button>
      )}
      {drawerTrigger}
    </div>
  )
}

// Botón de Exportar reutilizable
export function ExportButton({ 
  onClick,
  label = "Export" 
}: { 
  onClick?: () => void
  label?: string 
}) {
  const handleExport = useCallback(() => {
    if (onClick) {
      onClick()
    } else {
      console.log('Exportando...')
    }
  }, [onClick])

  return (
    <Button
      variant="outline"
      className="text-primary hover:text-primary hover:bg-primary/10"
      onClick={handleExport}
    >
      {label}
    </Button>
  )
}

// Botón de Agregar reutilizable
export function AddButton({ 
  onClick,
  label = "Add",
  icon = true
}: { 
  onClick?: () => void
  label?: string
  icon?: boolean
}) {
  const handleClick = useCallback(() => {
    if (onClick) {
      onClick()
    } else {
      console.log('Agregando...')
    }
  }, [onClick])

  return (
    <Button
      className="bg-primary text-white hover:bg-primary/90"
      onClick={handleClick}
    >
      {icon && <Plus className="mr-2 h-4 w-4" />}
      {label}
    </Button>
  )
}