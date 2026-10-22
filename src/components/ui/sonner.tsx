"use client"

import { Toaster as Sonner, type ToasterProps } from "sonner"

import { useTheme } from "@/lib/relo/theme"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme } = useTheme()

  return (
    <Sonner
      theme={theme}
      className="toaster group"
      style={
        {
          "--normal-bg": "var(--surface-3)",
          "--normal-text": "var(--ink)",
          "--normal-border": "var(--line-strong)",
        } as React.CSSProperties
      }
      {...props}
    />
  )
}

export { Toaster }
