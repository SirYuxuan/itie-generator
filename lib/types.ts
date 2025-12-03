export interface HandwritingConfig {
  text: string
  fontSize: number
  lineHeight: number
  lineType: 'solid' | 'dashed' | 'dotted' | 'alternating' | 'four-lines'
  showGuideLines: boolean
  linesPerPage: number
  fontFamily: string
  pageSize: 'A4' | 'Letter'
  practiceType: 'sentence' | 'vocabulary'
  gridCols: number
  gridRows: number
  traceMode: boolean
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
}
