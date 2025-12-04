
import { Suspense } from "react"
import ConfiguracionView from "@/views/ConfiguracionView/ConfiguracionView"

export default function ConfiguracionPage() {
  return (
    <Suspense fallback={<div>Cargando...</div>}>
      <ConfiguracionView />
    </Suspense>
  )
}
