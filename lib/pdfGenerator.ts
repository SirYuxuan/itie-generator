import jsPDF from 'jspdf'
import { HandwritingConfig } from './types'

// 字体数据缓存
let happyPlanetFontData: string | null = null
let hengshuiFontData: string | null = null

async function loadFonts(doc: jsPDF) {
  // 加载中文字体 - 快乐星球体
  if (!happyPlanetFontData) {
    try {
      const response = await fetch('/fonts/HappyPlanet.ttf')
      const buffer = await response.arrayBuffer()
      happyPlanetFontData = btoa(
        new Uint8Array(buffer)
          .reduce((data, byte) => data + String.fromCharCode(byte), '')
      )
    } catch (error) {
      console.error('Failed to load HappyPlanet font:', error)
    }
  }

  if (happyPlanetFontData) {
    const fontFileName = 'HappyPlanet.ttf'
    doc.addFileToVFS(fontFileName, happyPlanetFontData)
    doc.addFont(fontFileName, 'HappyPlanet', 'normal')
  }

  // 加载衡水体字体
  if (!hengshuiFontData) {
    try {
      const response = await fetch('/fonts/Hengshui.ttf')
      const buffer = await response.arrayBuffer()
      hengshuiFontData = btoa(
        new Uint8Array(buffer)
          .reduce((data, byte) => data + String.fromCharCode(byte), '')
      )
    } catch (error) {
      console.error('Failed to load Hengshui font:', error)
    }
  }

  if (hengshuiFontData) {
    const fontFileName = 'Hengshui.ttf'
    doc.addFileToVFS(fontFileName, hengshuiFontData)
    doc.addFont(fontFileName, 'Hengshui', 'normal')
  }
}

export async function generatePDF(config: HandwritingConfig) {
  // 创建PDF文档
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: config.pageSize === 'A4' ? 'a4' : 'letter',
  })

  // 加载字体
  await loadFonts(doc)

  const pageWidth = config.pageSize === 'A4' ? 210 : 215.9
  const pageHeight = config.pageSize === 'A4' ? 297 : 279.4
  const margin = 20
  const contentWidth = pageWidth - 2 * margin

  // 绘制淡背景色 (浅绿色)
  doc.setFillColor(240, 253, 244) // #f0fdf4
  doc.rect(0, 0, pageWidth, pageHeight, 'F')

  // 绘制页眉
  doc.setFontSize(9)
  doc.setTextColor(150, 150, 150)
  doc.text('CreateBy: https://itle.oofo.cc', pageWidth - margin, 10, { align: 'right' })

  // 将字号和行高从像素转换为毫米(近似转换)
  const fontSizeMM = config.fontSize * 0.35
  const lineHeightMM = config.lineHeight * 0.35

  // 设置字体
  let fontFamily = config.fontFamily.toLowerCase()
  if (config.fontFamily === 'Hengshui') {
    fontFamily = 'Hengshui'
  }
  doc.setFont(fontFamily, 'normal')
  doc.setFontSize(fontSizeMM * 2.83) // jsPDF使用pt单位

  if (config.practiceType === 'vocabulary') {
    // 单词表模式
    const cols = config.gridCols || 4
    const rows = config.gridRows || 14
    const colWidth = contentWidth / cols
    const rowHeight = (pageHeight - 2 * margin) / rows
    
    // 解析单词列表
    const vocabList = config.text.split('\n').filter(line => line.trim()).map(line => {
      const parts = line.trim().split(/\s+/)
      return {
        word: parts[0] || '',
        meaning: parts.slice(1).join(' ') || ''
      }
    })

    let currentWordIndex = 0
    
    // 绘制网格 - 无论是否有单词，都填满整页
    // 计算每页能放多少行
    // const rowsPerPage = rows // 已经由 config.gridRows 决定
    
    // 循环直到所有单词都绘制完毕，或者至少绘制一页
    let pageIndex = 0
    while (currentWordIndex < vocabList.length || pageIndex === 0) {
      if (pageIndex > 0) {
        doc.addPage()
        // 新页面也要绘制背景
        doc.setFillColor(240, 253, 244) // #f0fdf4
        doc.rect(0, 0, pageWidth, pageHeight, 'F')
        
        // 绘制页眉
        doc.setFontSize(9)
        doc.setTextColor(150, 150, 150)
        doc.text('CreateBy: https://itle.oofo.cc', pageWidth - margin, 10, { align: 'right' })
      }

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          // if (currentWordIndex >= vocabList.length) break // 不再跳出，继续绘制空格子

          const x = margin + c * colWidth
          const y = margin + r * rowHeight
          const item = vocabList[currentWordIndex] || { word: '', meaning: '' }

          // 绘制四线三格
          const cellPadding = 2
          const cellContentWidth = colWidth - 2 * cellPadding
          const cellContentHeight = rowHeight - 2 * cellPadding
          
          // 计算四线位置 (垂直居中)
          // 四线三格总高度固定为 9mm
          const fourLinesHeight = 9
          const startY = y + (rowHeight - fourLinesHeight) / 2
          
          // 绘制四线
          doc.setLineWidth(0.1)
          
          // 第一线 (Ascender)
          doc.setDrawColor(100, 100, 100) // 灰色
          doc.line(x, startY, x + colWidth, startY)
          
          // 第二线 (Mean)
          doc.setDrawColor(100, 100, 100) // 灰色
          // 手动绘制虚线
          const dashLen = 1
          const gapLen = 1
          let dashX = x
          while (dashX < x + colWidth) {
            doc.line(dashX, startY + fourLinesHeight * 0.33, Math.min(dashX + dashLen, x + colWidth), startY + fourLinesHeight * 0.33)
            dashX += dashLen + gapLen
          }
          
          // 第三线 (Baseline) - 绿色 (更和谐的绿色)
          doc.setDrawColor(82, 196, 26) // #52c41a (Ant Design Green-6)
          doc.line(x, startY + fourLinesHeight * 0.66, x + colWidth, startY + fourLinesHeight * 0.66)
          
          // 第四线 (Descender)
          doc.setDrawColor(100, 100, 100) // 灰色
          doc.line(x, startY + fourLinesHeight, x + colWidth, startY + fourLinesHeight)

          if (item.word) {
            // 绘制英文单词 (在基线上)
            if (config.traceMode) {
              doc.setTextColor(200, 200, 200) // 浅灰色用于描红
            } else {
              doc.setTextColor(0, 0, 0) // 黑色
            }
            doc.setFont(fontFamily, 'normal')
            doc.setFontSize(fontSizeMM * 2.83)
            // 调整文字位置，使其基线对齐第三线
            // jsPDF text y 是基线位置
            // 左对齐
            doc.text(item.word, x + cellPadding, startY + fourLinesHeight * 0.66, {
              align: 'left',
              maxWidth: cellContentWidth
            })
          }

          // 绘制中文含义 (挨着第四线下方)
          if (item.meaning) {
            doc.setTextColor(22, 163, 74) // 绿色
            // 切换到中文字体 - 使用快乐星球体
            doc.setFont('HappyPlanet', 'normal')
            doc.setFontSize(fontSizeMM * 1.5) // 较小字号
            // 左对齐，在第四线下方1mm处
            doc.text(item.meaning, x + cellPadding, startY + fourLinesHeight + 1, {
              align: 'left',
              maxWidth: cellContentWidth
            })
            // 恢复英文字体
            doc.setFont(fontFamily, 'normal')
          }

          currentWordIndex++
        }
      }
      
      pageIndex++
      // 如果还有单词没画完，继续下一页
      if (currentWordIndex >= vocabList.length) {
        break
      }
    }

  } else if (config.practiceType === 'workbook') {
    // 练习册模式
    const gridSizeMap = { small: 1, medium: 1.5, large: 2 }
    const gridSize = gridSizeMap[config.gridSize || 'medium'] // 默认1.5cm
    const gridStyle = config.workbookStyle || 'tianzige'
    const gridColor = config.gridColor || 'black'
    const textColor = config.textColor || 'black'
    
    // 颜色映射
    const colorMap = {
      black: [0, 0, 0],
      gray: [128, 128, 128],
      blue: [0, 0, 255],
      red: [255, 0, 0]
    }
    const gridColorRGB = colorMap[gridColor as keyof typeof colorMap] || [0, 0, 0]
    
    if (gridStyle === 'staff') {
      // 五线谱特殊处理
      const lineSpacing = 2.5 // 线间距 2.5mm
      const staffSpacing = 10 // 谱间距 10mm
      
      const staffHeight = 4 * lineSpacing
      const totalStaffHeight = staffHeight + staffSpacing
      const staffCount = Math.floor((pageHeight - 2 * margin) / totalStaffHeight)
      
      doc.setDrawColor(gridColorRGB[0], gridColorRGB[1], gridColorRGB[2])
      doc.setLineWidth(0.1)
      
      for (let i = 0; i < staffCount; i++) {
          const startY = margin + i * totalStaffHeight
          
          // 画5条线
          for (let j = 0; j < 5; j++) {
              const y = startY + j * lineSpacing
              doc.line(margin, y, pageWidth - margin, y)
          }
          
          // 画左右边界线
          doc.line(margin, startY, margin, startY + staffHeight)
          doc.line(pageWidth - margin, startY, pageWidth - margin, startY + staffHeight)
      }
    } else {
      // 根据格子大小设置固定列数
      const colsMap = { small: 15, medium: 10, large: 7 }
      const cols = colsMap[config.gridSize || 'medium']
      
      // 将cm转换为mm
      const gridSizeMM = gridSize * 10
      const cellSpacing = 3 // 格子间距3mm，让布局更美观
      
      // 计算总宽度和行数
      const totalGridWidth = cols * gridSizeMM + (cols - 1) * cellSpacing
      const rows = Math.floor((pageHeight - 2 * margin - 30) / (gridSizeMM + cellSpacing)) // 上下留30mm间距
      
      // 计算起始位置（水平居中）
      const startX = margin + (contentWidth - totalGridWidth) / 2
      const startY = margin + 15 // 上方留15mm间距
      
      // 绘制网格
      doc.setDrawColor(gridColorRGB[0], gridColorRGB[1], gridColorRGB[2])
      doc.setLineWidth(0.1)
      
      // 绘制水平线
      for (let r = 0; r <= rows; r++) {
        const y = startY + r * (gridSizeMM + cellSpacing)
        doc.line(startX, y, startX + totalGridWidth, y)
      }
      
      // 绘制垂直线
      for (let c = 0; c <= cols; c++) {
        const x = startX + c * (gridSizeMM + cellSpacing)
        doc.line(x, startY, x, startY + rows * (gridSizeMM + cellSpacing))
      }
      
      // 根据不同格子样式绘制特殊线条
      if (gridStyle === 'tianzige') {
        // 田字格：每个格子内部画十字虚线
        doc.setDrawColor(gridColorRGB[0], gridColorRGB[1], gridColorRGB[2])
        doc.setLineWidth(0.05)
        
        for (let r = 0; r < rows; r++) {
          for (let c = 0; c < cols; c++) {
            const cellX = startX + c * (gridSizeMM + cellSpacing)
            const cellY = startY + r * (gridSizeMM + cellSpacing)
            
            // 画十字虚线
            const midX = cellX + gridSizeMM / 2
            const midY = cellY + gridSizeMM / 2
            
            // 手动绘制虚线
            const dashLen = 1
            const gapLen = 1
            
            // 水平中线
            let dashX = cellX
            while (dashX < cellX + gridSizeMM) {
              doc.line(dashX, midY, Math.min(dashX + dashLen, cellX + gridSizeMM), midY)
              dashX += dashLen + gapLen
            }
            
            // 垂直中线
            let dashY = cellY
            while (dashY < cellY + gridSizeMM) {
              doc.line(midX, dashY, midX, Math.min(dashY + dashLen, cellY + gridSizeMM))
              dashY += dashLen + gapLen
            }
          }
        }
      } else if (gridStyle === 'mizi') {
        // 米字格：每个格子画米字虚线
        doc.setDrawColor(gridColorRGB[0], gridColorRGB[1], gridColorRGB[2])
        doc.setLineWidth(0.05)
        for (let r = 0; r < rows; r++) {
          for (let c = 0; c < cols; c++) {
            const cellX = startX + c * (gridSizeMM + cellSpacing)
            const cellY = startY + r * (gridSizeMM + cellSpacing)
            
            // 手动绘制虚线
            const dashLen = 1
            const gapLen = 1
            
            // 画对角线
            // 左上到右下
            let d = 0
            while (d < gridSizeMM) {
              const x1 = cellX + d
              const y1 = cellY + d
              const x2 = Math.min(cellX + d + dashLen, cellX + gridSizeMM)
              const y2 = Math.min(cellY + d + dashLen, cellY + gridSizeMM)
              doc.line(x1, y1, x2, y2)
              d += dashLen + gapLen
            }
            
            // 右上到左下
            d = 0
            while (d < gridSizeMM) {
              const x1 = cellX + gridSizeMM - d
              const y1 = cellY + d
              const x2 = Math.max(cellX + gridSizeMM - (d + dashLen), cellX)
              const y2 = Math.min(cellY + d + dashLen, cellY + gridSizeMM)
              doc.line(x1, y1, x2, y2)
              d += dashLen + gapLen
            }
            
            // 画十字中线
            const midX = cellX + gridSizeMM / 2
            const midY = cellY + gridSizeMM / 2
            
            // 水平中线
            let dashX = cellX
            while (dashX < cellX + gridSizeMM) {
              doc.line(dashX, midY, Math.min(dashX + dashLen, cellX + gridSizeMM), midY)
              dashX += dashLen + gapLen
            }
            
            // 垂直中线
            let dashY = cellY
            while (dashY < cellY + gridSizeMM) {
              doc.line(midX, dashY, midX, Math.min(dashY + dashLen, cellY + gridSizeMM))
              dashY += dashLen + gapLen
            }
          }
        }
      } else if (gridStyle === 'pinyin') {
        // 拼音格：四线三格
        doc.setDrawColor(gridColorRGB[0], gridColorRGB[1], gridColorRGB[2])
        doc.setLineWidth(0.1)
        for (let r = 0; r < rows; r++) {
          for (let c = 0; c < cols; c++) {
            const cellX = startX + c * (gridSizeMM + cellSpacing)
            const cellY = startY + r * (gridSizeMM + cellSpacing)
            
            // 四线三格：中间区域占主要部分，上下留白较大
            const paddingY = gridSizeMM * 0.25 // 上下各留25%
            const contentHeight = gridSizeMM * 0.5 // 中间内容占50%
            const oneThird = contentHeight / 3
            
            const line1Y = cellY + paddingY
            const line2Y = cellY + paddingY + oneThird
            const line3Y = cellY + paddingY + 2 * oneThird
            const line4Y = cellY + paddingY + 3 * oneThird
            
            const paddingX = 1 // 左右间距1mm
            
            // 画4条线
            doc.line(cellX + paddingX, line1Y, cellX + gridSizeMM - paddingX, line1Y)
            doc.line(cellX + paddingX, line2Y, cellX + gridSizeMM - paddingX, line2Y)
            doc.line(cellX + paddingX, line3Y, cellX + gridSizeMM - paddingX, line3Y)
            doc.line(cellX + paddingX, line4Y, cellX + gridSizeMM - paddingX, line4Y)
          }
        }
      }
    }
    // square 样式只需要基础网格线，上面已经绘制

  } else {
    // 将文本分割成单词
    const words = config.text.split(' ')
    let currentY = margin + lineHeightMM

    // 绘制字帖
    for (let i = 0; i < config.linesPerPage; i++) {
      if (currentY + lineHeightMM > pageHeight - margin) {
        doc.addPage()
        currentY = margin + lineHeightMM
      }

      // 绘制辅助线(基线)
      if (config.showGuideLines) {
        doc.setDrawColor(200, 200, 200)
        doc.setLineWidth(0.1)
        doc.line(margin, currentY, pageWidth - margin, currentY)
      }

      // 绘制练习线
      doc.setDrawColor(100, 100, 100)
      doc.setLineWidth(0.3)

      if (config.lineType === 'dashed') {
        // 手动绘制虚线
        const dashLength = 3
        const gapLength = 3
        let x = margin
        while (x < pageWidth - margin) {
          const endX = Math.min(x + dashLength, pageWidth - margin)
          doc.line(x, currentY + lineHeightMM * 0.6, endX, currentY + lineHeightMM * 0.6)
          x += dashLength + gapLength
        }
      } else if (config.lineType === 'dotted') {
        // 手动绘制点线
        const dotSpacing = 2
        let x = margin
        while (x < pageWidth - margin) {
          doc.line(x, currentY + lineHeightMM * 0.6, x + 0.5, currentY + lineHeightMM * 0.6)
          x += dotSpacing
        }
      } else if (config.lineType === 'alternating') {
        // 一行实线一行虚线交替
        if (i % 2 === 0) {
          // 实线
          doc.line(margin, currentY + lineHeightMM * 0.6, pageWidth - margin, currentY + lineHeightMM * 0.6)
        } else {
          // 虚线
          const dashLength = 3
          const gapLength = 3
          let x = margin
          while (x < pageWidth - margin) {
            const endX = Math.min(x + dashLength, pageWidth - margin)
            doc.line(x, currentY + lineHeightMM * 0.6, endX, currentY + lineHeightMM * 0.6)
            x += dashLength + gapLength
          }
        }
      } else if (config.lineType === 'four-lines') {
        // 四线三格
        // 四线三格总高度固定为 9mm
        const fourLinesHeight = 9
        const startY = currentY - fourLinesHeight * 0.6 // 调整起始位置，使其垂直居中于行高
        
        doc.setLineWidth(0.1)
        // 第一线
        doc.setDrawColor(100, 100, 100)
        doc.line(margin, startY, pageWidth - margin, startY)
        // 第二线 (虚线)
        // 手动绘制虚线
        const dashLen = 1
        const gapLen = 1
        let dashX = margin
        while (dashX < pageWidth - margin) {
          doc.line(dashX, startY + fourLinesHeight * 0.33, Math.min(dashX + dashLen, pageWidth - margin), startY + fourLinesHeight * 0.33)
          dashX += dashLen + gapLen
        }
        // 第三线 (基线 - 绿色)
        doc.setDrawColor(82, 196, 26) // #52c41a
        doc.line(margin, startY + fourLinesHeight * 0.66, pageWidth - margin, startY + fourLinesHeight * 0.66)
        // 第四线
        doc.setDrawColor(100, 100, 100)
        doc.line(margin, startY + fourLinesHeight, pageWidth - margin, startY + fourLinesHeight)
      } else {
        // 实线
        doc.line(margin, currentY + lineHeightMM * 0.6, pageWidth - margin, currentY + lineHeightMM * 0.6)
      }

      // 第一行显示示例文本(淡灰色)
      if (i === 0 || i % 2 === 0) {
        doc.setTextColor(180, 180, 180)
        if (config.lineType === 'four-lines') {
           // 四线三格文字位置调整
           const fourLinesHeight = 9
           const startY = currentY - fourLinesHeight * 0.6
           doc.text(config.text, margin, startY + fourLinesHeight * 0.66, {
             maxWidth: contentWidth,
           })
        } else {
          doc.text(config.text, margin, currentY - fontSizeMM * 0.3, {
            maxWidth: contentWidth,
          })
        }
      }

      currentY += lineHeightMM
    }
  }

  // 保存PDF
  doc.save('handwriting-practice.pdf')
}
