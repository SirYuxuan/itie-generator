'use client'

import { HandwritingConfig } from '@/lib/types'
import { useEffect, useRef } from 'react'

interface PreviewCanvasProps {
  config: HandwritingConfig
}

export default function PreviewCanvas({ config }: PreviewCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const render = () => {
    // 设置画布大小
    const dpr = window.devicePixelRatio || 1
    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr
    ctx.scale(dpr, dpr)

    // 清空画布
    ctx.fillStyle = '#f0fdf4'
    ctx.fillRect(0, 0, rect.width, rect.height)

    // 设置字体
    let fontFamily = config.fontFamily
    // if (config.fontFamily === 'Hengshui') {
    //   fontFamily = 'Caveat, cursive'
    // }
    ctx.font = `${config.fontSize}px ${fontFamily}`
    ctx.fillStyle = '#000000'

    const margin = 20
    const lineHeight = config.lineHeight

    if (config.practiceType === 'vocabulary') {
      // 单词表模式预览
      const cols = config.gridCols || 4
      const rows = config.gridRows || 14
      const colWidth = (rect.width - 2 * margin) / cols
      const rowHeight = (rect.height - 2 * margin) / rows // 预览高度有限，这里只是示意

      // 解析单词列表
      const vocabList = config.text.split('\n').filter(line => line.trim()).map(line => {
        const parts = line.trim().split(/\s+/)
        return {
          word: parts[0] || '',
          meaning: parts.slice(1).join(' ') || ''
        }
      })

      // 限制预览数量
      // const previewCount = Math.min(vocabList.length, cols * 4) // 预览前4行
      // 预览填满整个画布
      const previewRows = Math.floor((rect.height - 2 * margin) / (config.lineHeight * 1.5))
      const previewCount = cols * previewRows

      for (let i = 0; i < previewCount; i++) {
        const r = Math.floor(i / cols)
        const c = i % cols
        const x = margin + c * colWidth
        const y = margin + r * config.lineHeight * 1.5 // 预览时行高稍微拉开一点

        if (y + config.lineHeight > rect.height - margin) break

        const item = vocabList[i] || { word: '', meaning: '' }
        // 预览时近似计算：9mm 对应 18px (6.3mm) -> 比例约 1.43
        // 这里使用 1.5 倍 fontSize 作为四线三格高度的近似值
        const fourLinesHeight = config.fontSize * 1.5
        const startY = y + (config.lineHeight - fourLinesHeight) / 2

        // 绘制四线三格
        const cellPadding = 5
        
        // 第一线
        ctx.strokeStyle = '#888888'
        ctx.lineWidth = 1
        ctx.setLineDash([])
        ctx.beginPath()
        ctx.moveTo(x, startY)
        ctx.lineTo(x + colWidth, startY)
        ctx.stroke()

        // 第二线 (虚线)
        ctx.setLineDash([2, 2])
        ctx.beginPath()
        ctx.moveTo(x, startY + fourLinesHeight * 0.33)
        ctx.lineTo(x + colWidth, startY + fourLinesHeight * 0.33)
        ctx.stroke()
        ctx.setLineDash([])

        // 第三线 (基线 - 绿色)
        ctx.strokeStyle = '#52c41a' // Ant Design Green-6
        ctx.beginPath()
        ctx.moveTo(x, startY + fourLinesHeight * 0.66)
        ctx.lineTo(x + colWidth, startY + fourLinesHeight * 0.66)
        ctx.stroke()

        // 第四线
        ctx.strokeStyle = '#888888'
        ctx.beginPath()
        ctx.moveTo(x, startY + fourLinesHeight)
        ctx.lineTo(x + colWidth, startY + fourLinesHeight)
        ctx.stroke()

        if (item.word) {
          // 绘制英文
          ctx.fillStyle = config.traceMode ? '#e5e7eb' : '#000000' // 描红模式为浅灰色，否则为黑色
          ctx.font = `${config.fontSize}px ${fontFamily}`
          ctx.textAlign = 'left'
          ctx.fillText(item.word, x + cellPadding, startY + fourLinesHeight * 0.66)
        }

        if (item.meaning) {
          // 绘制中文
          ctx.fillStyle = '#16a34a' // 绿色
          ctx.font = `${config.fontSize * 0.6}px HappyPlanet`
          ctx.textAlign = 'left'
          ctx.fillText(item.meaning, x + cellPadding, startY + fourLinesHeight + config.fontSize * 0.8)
        }
      }

    } else {
      // 句子模式预览
      let currentY = margin + lineHeight
      // 绘制预览(只显示前几行)
      const previewLines = Math.min(config.linesPerPage, 5)

      for (let i = 0; i < previewLines; i++) {
        if (currentY + lineHeight > rect.height - margin) break

        // 绘制辅助线(基线)
        if (config.showGuideLines) {
          ctx.strokeStyle = '#e0e0e0'
          ctx.lineWidth = 1
          ctx.setLineDash([])
          ctx.beginPath()
          ctx.moveTo(margin, currentY)
          ctx.lineTo(rect.width - margin, currentY)
          ctx.stroke()
        }

        // 绘制练习线
        ctx.strokeStyle = '#888888'
        ctx.lineWidth = 1.5
        
        if (config.lineType === 'dashed') {
          ctx.setLineDash([5, 5])
        } else if (config.lineType === 'dotted') {
          ctx.setLineDash([2, 3])
        } else if (config.lineType === 'alternating') {
          // 一行实线一行虚线交替
          if (i % 2 === 0) {
            ctx.setLineDash([]) // 实线
          } else {
            ctx.setLineDash([5, 5]) // 虚线
          }
        } else if (config.lineType === 'four-lines') {
          // 四线三格
          const fourLinesHeight = config.fontSize * 1.5
          const startY = currentY - fourLinesHeight * 0.6
          
          // 第一线
          ctx.setLineDash([])
          ctx.beginPath()
          ctx.moveTo(margin, startY)
          ctx.lineTo(rect.width - margin, startY)
          ctx.stroke()
          
          // 第二线 (虚线)
          ctx.setLineDash([2, 2])
          ctx.beginPath()
          ctx.moveTo(margin, startY + fourLinesHeight * 0.33)
          ctx.lineTo(rect.width - margin, startY + fourLinesHeight * 0.33)
          ctx.stroke()
          ctx.setLineDash([])
          
          // 第三线 (基线 - 绿色)
          ctx.strokeStyle = '#52c41a' // Ant Design Green-6
          ctx.beginPath()
          ctx.moveTo(margin, startY + fourLinesHeight * 0.66)
          ctx.lineTo(rect.width - margin, startY + fourLinesHeight * 0.66)
          ctx.stroke()
          ctx.strokeStyle = '#888888' // 恢复颜色
          
          // 第四线
          ctx.beginPath()
          ctx.moveTo(margin, startY + fourLinesHeight)
          ctx.lineTo(rect.width - margin, startY + fourLinesHeight)
          ctx.stroke()
        } else {
          ctx.setLineDash([])
        }

        if (config.lineType !== 'four-lines') {
          ctx.beginPath()
          ctx.moveTo(margin, currentY + lineHeight * 0.6)
          ctx.lineTo(rect.width - margin, currentY + lineHeight * 0.6)
          ctx.stroke()
        }

        // 第一行和奇数行显示示例文本
        if (i === 0 || i % 2 === 0) {
          ctx.fillStyle = '#b0b0b0'
          ctx.setLineDash([])
          if (config.lineType === 'four-lines') {
             const fourLinesHeight = config.fontSize * 1.5
             const startY = currentY - fourLinesHeight * 0.6
             ctx.fillText(config.text, margin, startY + fourLinesHeight * 0.66, rect.width - 2 * margin)
          } else {
             ctx.fillText(config.text, margin, currentY - config.fontSize * 0.2, rect.width - 2 * margin)
          }
        }

        currentY += lineHeight
      }
    }
    }

    render()
    
    // 确保字体加载完成后重新渲染
    const fontString = `${config.fontSize}px ${config.fontFamily}`
    if ((document as any).fonts) {
      (document as any).fonts.load(fontString).then(() => {
        render()
      }).catch((err: any) => {
        console.error('Font loading failed:', err)
      })
    }
  }, [config])

  return (
    <div className="border-2 border-gray-300 rounded-md overflow-hidden bg-white shadow-inner h-full w-full flex items-center justify-center">
      <canvas
        ref={canvasRef}
        className="max-w-full max-h-full object-contain"
        style={{ width: 'auto', height: '100%' }}
      />
    </div>
  )
}
