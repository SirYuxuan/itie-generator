import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: '字帖生成器 - Handwriting Practice Generator',
  description: '在线生成英文字帖并导出为PDF',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  )
}
