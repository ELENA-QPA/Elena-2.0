"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner } from "sonner"

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      position="bottom-right"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-white group-[.toaster]:text-gray-800 group-[.toaster]:border group-[.toaster]:border-elena-pink-100 group-[.toaster]:shadow-md group-[.toaster]:rounded-lg",
          description:
            "group-[.toast]:text-gray-500 group-[.toast]:text-sm",
          success:
            "group-[.toaster]:border-elena-pink-300 group-[.toaster]:text-elena-pink-700 [&>[data-icon]]:text-elena-pink-500",
          error:
            "group-[.toaster]:border-red-200 group-[.toaster]:text-red-700 [&>[data-icon]]:text-red-500",
          loading:
            "group-[.toaster]:border-elena-pink-100 group-[.toaster]:text-elena-pink-600 [&>[data-icon]]:text-elena-pink-400",
          actionButton:
            "group-[.toast]:bg-elena-pink-500 group-[.toast]:text-white",
          cancelButton:
            "group-[.toast]:bg-elena-pink-50 group-[.toast]:text-elena-pink-600",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
