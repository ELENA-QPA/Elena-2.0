"use client"

import React, { useMemo } from "react"
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
} from "recharts"

interface ChartData {
  name: string
  value: number
}

interface SeriesData {
  name: string
  data: ChartData[]
  color: string
}

interface SimpleLineChartProps {
  data: ChartData[]
  width?: number
  height?: number
  color?: string
}

export function SimpleLineChart({ data, width = 400, height = 300, color = "#8884d8" }: SimpleLineChartProps) {
  return (
    <ResponsiveContainer width={width} height={height}>
      <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#666" }} />
        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#666" }} />
        <Tooltip
          contentStyle={{
            backgroundColor: "#fff",
            border: "1px solid #e0e0e0",
            borderRadius: "8px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
          }}
        />
        <Line
          type="monotone"
          dataKey="value"
          stroke={color}
          strokeWidth={3}
          dot={{ fill: color, strokeWidth: 2, r: 4 }}
          activeDot={{ r: 6, stroke: color, strokeWidth: 2 }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}

interface SimpleGroupedBarChartProps {
  series: SeriesData[]
  width?: number
  height?: number
  barSize?: number
}

export function SimpleGroupedBarChart({ series, width = 800, height = 400, barSize = 24 }: SimpleGroupedBarChartProps) {
  // Transform data for grouped bar chart
  const transformedData = React.useMemo(() => {
    if (!series.length || !series[0].data.length) return []

    const months = series[0].data.map((item) => item.name)
    return months.map((month) => {
      const dataPoint: any = { name: month }
      series.forEach((s) => {
        const monthData = s.data.find((d) => d.name === month)
        dataPoint[s.name] = monthData ? monthData.value : 0
      })
      return dataPoint
    })
  }, [series])

  return (
    <ResponsiveContainer width={width} height={height}>
      <BarChart data={transformedData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#666" }} />
        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#666" }} />
        <Tooltip
          contentStyle={{
            backgroundColor: "#fff",
            border: "1px solid #e0e0e0",
            borderRadius: "8px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
          }}
        />
        {series.map((s, index) => (
          <Bar key={s.name} dataKey={s.name} fill={s.color} radius={[2, 2, 0, 0]} barSize={barSize} />
        ))}
      </BarChart>
    </ResponsiveContainer>
  )
}

interface SimplePillBarChartProps {
  data: Array<{
    name: string
    value: number
    color: string
  }>
  width?: number | string
  height?: number
}

export function SimplePillBarChart({ data, width = '100%', height = 300 }: SimplePillBarChartProps) {
  const maxValue = Math.max(...data.map((d) => d.value))

  return (
    <div className="w-full h-full flex flex-col justify-center">
      {/* Aumentar separación entre columnas (gap-12) y reducir tamaño de texto de etiquetas */}
      <div className="flex items-end justify-center gap-12 px-4 pb-12" style={{ height: height - 100 }}>
        {data.map((item, index) => {
          const heightPercent = (item.value / maxValue) * 100
          const barHeight = Math.max((heightPercent / 100) * (height - 140), 20)

          return (
            <div key={index} className="flex flex-col items-center group relative" style={{ width: "45px" }}>
              {/* Pill-shaped Bar */}
              <div className="relative mb-4">
                <div
                  className="relative rounded-full shadow-lg hover:shadow-xl transition-all duration-300 group-hover:scale-105 cursor-pointer"
                  style={{
                    width: "45px",
                    height: `${barHeight}px`,
                    backgroundColor: item.color,
                    background: `linear-gradient(135deg, ${item.color} 0%, ${item.color}dd 50%, ${item.color}bb 100%)`,
                  }}
                >
                  {/* Top rounded cap */}
                  <div
                    className="absolute -top-1 left-0 right-0 rounded-full"
                    style={{
                      height: "12px",
                      backgroundColor: item.color,
                      background: `linear-gradient(135deg, ${item.color} 0%, ${item.color}ee 100%)`,
                    }}
                  />

                  {/* Value label */}
                  <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white px-2 py-1 rounded text-xs font-semibold whitespace-nowrap z-10">
                    {item.value}
                  </div>
                </div>
              </div>

              {/* Floating Label */}
              <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 text-center z-20">
                <div className="text-[10px] font-medium text-gray-700 leading-tight break-words w-16">{item.name}</div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap justify-center gap-3 mt-4 pt-4 border-t border-gray-200">
        {data.map((item, index) => (
          <div key={index} className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
            <span className="text-xs text-gray-600">{item.name}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// Additional chart components for completeness
interface SimpleBarChartProps {
  data: Array<{
    name: string
    value: number
    color?: string
  }>
  width?: number | string
  height?: number
  barSize?: number
  barCategoryGap?: string | number
}

export function SimpleBarChart({ data, width = '100%', height = 300, barSize = 20, barCategoryGap = '8%' }: SimpleBarChartProps) {
  return (
    <ResponsiveContainer width={width} height={height}>
      <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }} barCategoryGap={barCategoryGap}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#666" }} />
        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#666" }} />
        <Tooltip
          contentStyle={{
            backgroundColor: "#fff",
            border: "1px solid #e0e0e0",
            borderRadius: "8px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
          }}
        />
        <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={barSize}>
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color || "#8884d8"} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

interface SimplePieChartProps {
  data: Array<{
    name: string
    value: number
    color?: string
  }>
  width?: number | string
  height?: number
}

export function SimplePieChart({ data, width = '100%', height = 300 }: SimplePieChartProps) {
  const colors = ["#db2777", "#82ca9d", "#ffc658", "#ff7300", "#00ff00", "#0088fe", "#ffbb28", "#ff8042"]

  // Ensure each data item has a color
  const dataWithColors = data.map((item, index) => ({
    ...item,
    color: item.color || colors[index % colors.length]
  }))

  // Calculate total for percentage calculation
  const total = dataWithColors.reduce((sum, item) => sum + item.value, 0)

  return (
    <ResponsiveContainer width={width} height={height}>
      <PieChart>
        <Pie
          data={dataWithColors}
          cx="50%"
          cy="50%"
          outerRadius={Math.max(60, Math.min(100, height / 2 - 10))}
          innerRadius={Math.max(30, Math.min(60, height / 4))}
          paddingAngle={2}
          dataKey="value"
        >
          {dataWithColors.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            backgroundColor: "#fff",
            border: "1px solid #e0e0e0",
            borderRadius: "8px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
          }}
          formatter={(value: any, name: string) => {
            const percentage = total > 0 ? Math.round((value / total) * 100) : 0
            return [`${percentage}%`, name]
          }}
        />
      </PieChart>
    </ResponsiveContainer>
  )
}

interface SimpleMultiLineChartProps {
  series: Array<{
    name: string
    data: ChartData[]
    color: string
  }>
  width?: number
  height?: number
}

export function SimpleMultiLineChart({ series, width = 800, height = 400 }: SimpleMultiLineChartProps) {
  // Transform data for multi-line chart
  const transformedData = React.useMemo(() => {
    if (!series.length || !series[0].data.length) return []

    const months = series[0].data.map((item) => item.name)
    return months.map((month) => {
      const dataPoint: any = { name: month }
      series.forEach((s) => {
        const monthData = s.data.find((d) => d.name === month)
        dataPoint[s.name] = monthData ? monthData.value : 0
      })
      return dataPoint
    })
  }, [series])

  // Si las dimensiones son fijas, usar contenedor normal en lugar de ResponsiveContainer
  const ChartComponent = useMemo(() => {
    if (width && height) {
      return (
        <LineChart width={width} height={height} data={transformedData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#666" }} />
          <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#666" }} />
          <Tooltip
            contentStyle={{
              backgroundColor: "#fff",
              border: "1px solid #e0e0e0",
              borderRadius: "8px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
            }}
          />
          {series.map((s, index) => (
            <Line
              key={s.name}
              type="monotone"
              dataKey={s.name}
              stroke={s.color}
              strokeWidth={3}
              dot={{ fill: s.color, strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, stroke: s.color, strokeWidth: 2 }}
            />
          ))}
        </LineChart>
      );
    } else {
      return (
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={transformedData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#666" }} />
            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#666" }} />
            <Tooltip
              contentStyle={{
                backgroundColor: "#fff",
                border: "1px solid #e0e0e0",
                borderRadius: "8px",
                boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
              }}
            />
            {series.map((s, index) => (
              <Line
                key={s.name}
                type="monotone"
                dataKey={s.name}
                stroke={s.color}
                strokeWidth={3}
                dot={{ fill: s.color, strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: s.color, strokeWidth: 2 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      );
    }
  }, [width, height, transformedData, series]);

  return ChartComponent
}
