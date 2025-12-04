"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FileText, Users, BarChart3, Settings } from "lucide-react"
import Link from "next/link"

const dashboardCards = [
  {
    title: "Gestión de Expedientes",
    description: "Administra y consulta expedientes judiciales",
    icon: FileText,
    href: "/dashboard/expedientes",
  },
  {
    title: "Equipo",
    description: "Gestiona el equipo de trabajo y colaboradores",
    icon: Users,
    href: "/dashboard/equipo", 
  },
  {
    title: "Estadísticas",
    description: "Visualiza métricas y reportes del sistema",
    icon: BarChart3,
    href: "/dashboard/estadisticas",
  },
  {
    title: "Configuración",
    description: "Ajusta las preferencias del sistema",
    icon: Settings,
    href: "/dashboard/configuracion",
  },
]

export default function DashboardHomeViewNew() {
  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-pink-600 mb-2">
          Bienvenido a Elena
        </h1>
        <p className="text-gray-600">
          Sistema de gestión de casos judiciales
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {dashboardCards.map((card, index) => {
          const IconComponent = card.icon
          return (
            <Link key={index} href={card.href}>
              <Card className="group hover:shadow-lg transition-all duration-300 cursor-pointer border border-gray-200 bg-white hover:bg-gray-50">
                <CardHeader className="pb-3">
                  <div className="w-12 h-12 rounded-lg bg-pink-600 flex items-center justify-center mb-4 group-hover:bg-pink-700 transition-colors duration-300">
                    <IconComponent className="h-6 w-6 text-white" />
                  </div>
                  <CardTitle className="text-xl font-semibold text-gray-900 group-hover:text-gray-700">
                    {card.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    {card.description}
                  </p>
                </CardContent>
              </Card>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
