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
    const fontFamily = config.fontFamily
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
      // const rows = config.gridRows || 14
      const colWidth = (rect.width - 2 * margin) / cols
      // const rowHeight = (rect.height - 2 * margin) / rows // 预览高度有限，这里只是示意

      // 解析单词列表
      const vocabList = config.text.split('\n').filter((line: string) => line.trim()).map((line: string) => {
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

    } else if (config.practiceType === 'workbook') {
      // 练习册模式预览
      // const gridSizeMap = { small: 1, medium: 1.5, large: 2 }
      const gridStyle = config.workbookStyle || 'tianzige'
      
      // 颜色映射
      const colorMap = {
        black: '#000000',
        gray: '#808080',
        blue: '#0000FF',
        red: '#FF0000'
      }
      const gridColor = colorMap[(config.gridColor || 'black') as keyof typeof colorMap]
      
      if (gridStyle === 'staff') {
        // 五线谱特殊处理
        const lineSpacing = 10 // 线间距
        const staffSpacing = 40 // 谱间距
        const availableWidth = rect.width - 2 * margin
        const availableHeight = rect.height - 2 * margin
        
        const staffHeight = 4 * lineSpacing
        const totalStaffHeight = staffHeight + staffSpacing
        const staffCount = Math.floor(availableHeight / totalStaffHeight)
        
        ctx.strokeStyle = gridColor
        ctx.lineWidth = 1
        
        for (let i = 0; i < staffCount; i++) {
            const startY = margin + i * totalStaffHeight
            
            // 画5条线
            for (let j = 0; j < 5; j++) {
                const y = startY + j * lineSpacing
                ctx.beginPath()
                ctx.moveTo(margin, y)
                ctx.lineTo(margin + availableWidth, y)
                ctx.stroke()
            }
            
            // 画左右边界线
            ctx.beginPath()
            ctx.moveTo(margin, startY)
            ctx.lineTo(margin, startY + staffHeight)
            ctx.stroke()
            
            ctx.beginPath()
            ctx.moveTo(margin + availableWidth, startY)
            ctx.lineTo(margin + availableWidth, startY + staffHeight)
            ctx.stroke()
        }
      } else {
        // 根据格子大小设置固定列数
        const colsMap = { small: 15, medium: 10, large: 7 }
        const cols = colsMap[(config.gridSize || 'medium') as keyof typeof colsMap]
        
        const cellSpacing = 3 // 格子间距3px
        
        // 平铺填满整个预览区域
        const availableWidth = rect.width - 2 * margin
        const availableHeight = rect.height - 2 * margin
        const gridSizePx = Math.min(
          (availableWidth - (cols - 1) * cellSpacing) / cols,
          (availableHeight - 9 * cellSpacing) / 10 // 假设最多10行
        )
        
        const rows = Math.floor((availableHeight - 9 * cellSpacing) / (gridSizePx + cellSpacing))
        const totalGridWidth = cols * gridSizePx + (cols - 1) * cellSpacing
        const totalGridHeight = rows * gridSizePx + (rows - 1) * cellSpacing
        
        // 居中显示
        const startX = margin + (availableWidth - totalGridWidth) / 2
        const startY = margin + (availableHeight - totalGridHeight) / 2
        
        // 绘制网格
        ctx.strokeStyle = gridColor
        ctx.lineWidth = 1
        
        // 绘制水平线
        for (let r = 0; r <= rows; r++) {
          const y = startY + r * (gridSizePx + cellSpacing)
          ctx.beginPath()
          ctx.moveTo(startX, y)
          ctx.lineTo(startX + totalGridWidth, y)
          ctx.stroke()
        }
        
        // 绘制垂直线
        for (let c = 0; c <= cols; c++) {
          const x = startX + c * (gridSizePx + cellSpacing)
          ctx.beginPath()
          ctx.moveTo(x, startY)
          ctx.lineTo(x, startY + rows * (gridSizePx + cellSpacing))
          ctx.stroke()
        }
        
        // 根据不同格子样式绘制特殊线条
        if (gridStyle === 'tianzige') {
          // 田字格：四周边框，里面十字虚线
          ctx.setLineDash([3, 3]) // 设置虚线
          ctx.lineWidth = 0.5
          for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
              const cellX = startX + c * (gridSizePx + cellSpacing)
              const cellY = startY + r * (gridSizePx + cellSpacing)
              
              // 画十字虚线
              const midX = cellX + gridSizePx / 2
              const midY = cellY + gridSizePx / 2
              ctx.beginPath()
              ctx.moveTo(cellX, midY)
              ctx.lineTo(cellX + gridSizePx, midY)
              ctx.stroke()
              
              ctx.beginPath()
              ctx.moveTo(midX, cellY)
              ctx.lineTo(midX, cellY + gridSizePx)
              ctx.stroke()
            }
          }
          ctx.setLineDash([]) // 恢复实线
        } else if (gridStyle === 'mizi') {
          // 米字格：四周边框，里面米字虚线
          ctx.setLineDash([3, 3]) // 设置虚线
          ctx.lineWidth = 0.5
          for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
              const cellX = startX + c * (gridSizePx + cellSpacing)
              const cellY = startY + r * (gridSizePx + cellSpacing)
              
              // 画米字虚线（对角线+十字线）
              ctx.beginPath()
              ctx.moveTo(cellX, cellY)
              ctx.lineTo(cellX + gridSizePx, cellY + gridSizePx)
              ctx.stroke()
              
              ctx.beginPath()
              ctx.moveTo(cellX + gridSizePx, cellY)
              ctx.lineTo(cellX, cellY + gridSizePx)
              ctx.stroke()
              
              // 画十字中线
              const midX = cellX + gridSizePx / 2
              const midY = cellY + gridSizePx / 2
              ctx.beginPath()
              ctx.moveTo(cellX, midY)
              ctx.lineTo(cellX + gridSizePx, midY)
              ctx.stroke()
              
              ctx.beginPath()
              ctx.moveTo(midX, cellY)
              ctx.lineTo(midX, cellY + gridSizePx)
              ctx.stroke()
            }
          }
          ctx.setLineDash([]) // 恢复实线
        } else if (gridStyle === 'pinyin') {
          // 拼音格：四线三格，左右间距小一点，上下大一点
          ctx.lineWidth = 0.8
          for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
              const cellX = startX + c * (gridSizePx + cellSpacing)
              const cellY = startY + r * (gridSizePx + cellSpacing)
              
              // 四线三格：中间区域占主要部分，上下留白较大
              const paddingY = gridSizePx * 0.25 // 上下各留25%
              const contentHeight = gridSizePx * 0.5 // 中间内容占50%
              const oneThird = contentHeight / 3
              
              const line1Y = cellY + paddingY
              const line2Y = cellY + paddingY + oneThird
              const line3Y = cellY + paddingY + 2 * oneThird
              const line4Y = cellY + paddingY + 3 * oneThird
              
              const paddingX = 4 // 左右间距
              
              // 画4条线
              ctx.beginPath()
              ctx.moveTo(cellX + paddingX, line1Y)
              ctx.lineTo(cellX + gridSizePx - paddingX, line1Y)
              ctx.stroke()
              
              ctx.beginPath()
              ctx.moveTo(cellX + paddingX, line2Y)
              ctx.lineTo(cellX + gridSizePx - paddingX, line2Y)
              ctx.stroke()
              
              ctx.beginPath()
              ctx.moveTo(cellX + paddingX, line3Y)
              ctx.lineTo(cellX + gridSizePx - paddingX, line3Y)
              ctx.stroke()
              
              ctx.beginPath()
              ctx.moveTo(cellX + paddingX, line4Y)
              ctx.lineTo(cellX + gridSizePx - paddingX, line4Y)
              ctx.stroke()
            }
          }
        }
      }
      // square 样式只需要基础网格线，上面已经绘制

    } else {
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((document as any).fonts) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (document as any).fonts.load(fontString).then(() => {
        render()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
