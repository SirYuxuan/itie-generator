export interface HandwritingConfig {
  text: string
  fontSize: number
  lineHeight: number
  lineType: 'solid' | 'dashed' | 'dotted' | 'alternating' | 'four-lines'
  showGuideLines: boolean
  linesPerPage: number
  fontFamily: string
  pageSize: 'A4' | 'Letter'
  practiceType: 'sentence' | 'vocabulary' | 'workbook'
  gridCols: number
  gridRows: number
  traceMode: boolean
  // 练习册相关配置
  workbookStyle?: 'tianzige' | 'mizi' | 'pinyin' | 'square' | 'staff'
  gridSize?: 'small' | 'medium' | 'large'
  gridColor?: 'black' | 'gray' | 'blue' | 'red'
  textColor?: 'black' | 'gray' | 'blue' | 'red'
  pageCount?: number
}

export const DEFAULT_CONFIG: HandwritingConfig = {
  text: '',
  fontSize: 18,
  lineHeight: 40,
  lineType: 'four-lines',
  showGuideLines: true,
  linesPerPage: 10,
  fontFamily: 'Hengshui',
  pageSize: 'A4',
  practiceType: 'vocabulary',
  gridCols: 4,
  gridRows: 14,
  traceMode: false,
  workbookStyle: 'tianzige',
  gridSize: 'medium',
  gridColor: 'red',
  textColor: 'black',
  pageCount: 1,
}
