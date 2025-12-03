'use client'

import { generatePDF } from '@/lib/pdfGenerator'
import { DEFAULT_CONFIG, HandwritingConfig } from '@/lib/types'
import {
    BookOutlined,
    EditOutlined
} from '@ant-design/icons'
import {
    Button,
    Card,
    Col,
    ConfigProvider,
    Form,
    Input,
    InputNumber,
    Layout,
    Menu,
    Radio,
    Row,
    Slider,
    Switch,
    Typography,
    message
} from 'antd'
import { useEffect, useState } from 'react'
import PreviewCanvas from './PreviewCanvas'

const { Sider, Content } = Layout
const { Title } = Typography
const { TextArea } = Input

interface WordItem {
  word: string
  meaning: string
}

export default function HandwritingGenerator() {
  const [config, setConfig] = useState<HandwritingConfig>(DEFAULT_CONFIG)
  const [isGenerating, setIsGenerating] = useState(false)
  const [cet4Words, setCet4Words] = useState<WordItem[]>([])
  
  // 词库相关状态
  const [dictSource, setDictSource] = useState<'none' | 'cet4'>('none')
  const [generationMode, setGenerationMode] = useState<'random' | 'sequential'>('random')
  const [pageCount, setPageCount] = useState(1)
  const [startPage, setStartPage] = useState(1)
  
  // 练习册相关状态
  const [practiceType, setPracticeType] = useState<'vocabulary' | 'workbook'>('vocabulary')
  
  const WORDS_PER_PAGE = 56

  useEffect(() => {
    const loadDict = (url: string, setter: (words: WordItem[]) => void) => {
      fetch(url)
        .then(res => res.text())
        .then(text => {
          const lines = text.split('\n')
          const words: WordItem[] = []
          lines.forEach(line => {
            const trimmed = line.trim()
            if (!trimmed) return
            if (!/^[a-zA-Z]/.test(trimmed)) return

            const parts = trimmed.split(/\s+/)
            if (parts.length < 2) return

            const word = parts[0]
            let meaningStartIndex = 1
            
            if (parts[1].startsWith('[')) {
              meaningStartIndex = 2
            }

            let meaning = parts.slice(meaningStartIndex).join(' ')
            if (word && meaning) {
              words.push({ word, meaning })
            }
          })
          setter(words)
        })
        .catch(err => console.error(`Failed to load ${url}:`, err))
    }

    loadDict('/CET_4.txt', setCet4Words)
  }, [])

  const generateFromDict = () => {
    if (dictSource === 'none') return
    
    const words = cet4Words
    if (words.length === 0) {
      message.warning('词库加载中，请稍候...')
      return
    }

    const totalWords = pageCount * WORDS_PER_PAGE
    let selected: WordItem[] = []

    if (generationMode === 'random') {
      // 随机选择
      const shuffled = [...words].sort(() => 0.5 - Math.random())
      selected = shuffled.slice(0, totalWords)
    } else {
      // 按序选择
      const startIndex = (startPage - 1) * WORDS_PER_PAGE
      selected = words.slice(startIndex, startIndex + totalWords)
    }
    
    const text = selected.map(w => `${w.word} ${w.meaning}`).join('\n')
    updateConfig('text', text)
    message.success(`已生成 ${selected.length} 个单词`)
  }

  const updateConfig = (key: keyof HandwritingConfig, value: any) => {
    setConfig(prev => ({ ...prev, [key]: value }))
  }

  const handleGeneratePDF = async () => {
    // 练习册模式不需要检查文本内容
    if (practiceType !== 'workbook' && !config.text) {
      message.warning('请先生成或输入内容')
      return
    }
    setIsGenerating(true)
    try {
      await generatePDF(config)
      message.success('PDF 生成成功')
    } catch (error) {
      console.error('Failed to generate PDF:', error)
      message.error('生成 PDF 失败，请重试')
    } finally {
      setIsGenerating(false)
    }
  }

  const maxPages = Math.ceil(cet4Words.length / WORDS_PER_PAGE)

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#52c41a', // Ant Design Green
        },
      }}
    >
      <Layout style={{ minHeight: '100vh' }}>
        <Sider width={280} theme="light" style={{ borderRight: '1px solid #f0f0f0' }}>
          <div className="p-4 border-b border-gray-100">
            <Title level={4} style={{ margin: 0, color: '#52c41a' }}>
              <BookOutlined /> 英语字帖生成
            </Title>
          </div>
          <Menu
            mode="inline"
            selectedKeys={[practiceType === 'vocabulary' ? dictSource : practiceType]}
            style={{ borderRight: 0 }}
            items={[
              {
                key: 'vocabulary',
                icon: <BookOutlined />,
                label: '英语字帖',
                children: [
                  {
                    key: 'cet4',
                    label: 'CET-4 词汇练习',
                    onClick: () => {
                      setPracticeType('vocabulary')
                      setDictSource('cet4')
                      updateConfig('practiceType', 'vocabulary')
                    }
                  },
                  {
                    key: 'none',
                    label: '自定义文本',
                    onClick: () => {
                      setPracticeType('vocabulary')
                      setDictSource('none')
                      updateConfig('practiceType', 'vocabulary')
                    }
                  }
                ]
              },
              {
                key: 'workbook',
                icon: <EditOutlined />,
                label: '练习册',
                onClick: () => {
                  setPracticeType('workbook')
                  updateConfig('practiceType', 'workbook')
                }
              }
            ]}
          />
          
          <div className="p-4 mt-auto">
             <Card size="small" title="全局设置" bordered={false} className="bg-gray-50">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">描红模式 (字体变灰)</span>
                  <Switch 
                    checked={config.traceMode} 
                    onChange={(checked) => updateConfig('traceMode', checked)} 
                  />
                </div>
             </Card>
          </div>
        </Sider>
        
        <Layout>
          <Content className="p-6 bg-gray-50" style={{ height: '100vh', overflow: 'hidden' }}>
            <Row gutter={24} style={{ height: '100%' }}>
              {/* 左侧功能区 */}
              <Col span={10} style={{ height: '100%', overflowY: 'auto', paddingRight: '8px' }}>
                <Card title="生成配置" className="mb-4 shadow-sm">
                  {practiceType === 'vocabulary' ? (
                    dictSource === 'cet4' ? (
                      <Form layout="vertical">
                        <Form.Item label="生成模式">
                          <Radio.Group 
                            value={generationMode} 
                            onChange={e => setGenerationMode(e.target.value)}
                            buttonStyle="solid"
                          >
                            <Radio.Button value="random">随机抽取</Radio.Button>
                            <Radio.Button value="sequential">顺序生成</Radio.Button>
                          </Radio.Group>
                        </Form.Item>

                        {generationMode === 'sequential' && (
                          <Form.Item label={`起始页码 (共 ${maxPages} 页)`}>
                            <InputNumber 
                              min={1} 
                              max={maxPages} 
                              value={startPage} 
                              onChange={val => setStartPage(val || 1)} 
                              style={{ width: '100%' }}
                            />
                          </Form.Item>
                        )}

                        <Form.Item label="生成页数">
                          <Row gutter={16}>
                            <Col span={16}>
                              <Slider
                                min={1}
                                max={generationMode === 'random' ? 20 : (maxPages - startPage + 1)}
                                value={pageCount}
                                onChange={setPageCount}
                              />
                            </Col>
                            <Col span={8}>
                              <InputNumber
                                min={1}
                                max={generationMode === 'random' ? 20 : (maxPages - startPage + 1)}
                                value={pageCount}
                                onChange={val => setPageCount(val || 1)}
                                style={{ width: '100%' }}
                              />
                            </Col>
                          </Row>
                          <div className="text-gray-400 text-xs mt-1">
                            每页 {WORDS_PER_PAGE} 词，共 {pageCount * WORDS_PER_PAGE} 词
                          </div>
                        </Form.Item>

                        <Button 
                          type="primary" 
                          onClick={generateFromDict} 
                          block 
                          size="large"
                        >
                          生成单词列表
                        </Button>
                      </Form>
                    ) : (
                      <div className="text-gray-500 mb-4">
                        请在下方直接输入或粘贴想要练习的单词和释义。
                      </div>
                    )
                  ) : (
                    // 练习册配置
                    <Form layout="vertical">
                      <Form.Item label="格子样式">
                        <Radio.Group 
                          value={config.workbookStyle} 
                          onChange={e => updateConfig('workbookStyle', e.target.value)}
                          buttonStyle="solid"
                        >
                          <Radio.Button value="tianzige">田字格</Radio.Button>
                          <Radio.Button value="mizi">米字格</Radio.Button>
                          <Radio.Button value="pinyin">拼音格</Radio.Button>
                          <Radio.Button value="square">方块格</Radio.Button>
                          <Radio.Button value="staff">五线谱</Radio.Button>
                        </Radio.Group>
                      </Form.Item>

                      <Form.Item label="格子大小">
                        <Radio.Group 
                          value={config.gridSize} 
                          onChange={e => updateConfig('gridSize', e.target.value)}
                          buttonStyle="solid"
                        >
                          <Radio.Button value="small">小格 (1cm)</Radio.Button>
                          <Radio.Button value="medium">中格 (1.5cm)</Radio.Button>
                          <Radio.Button value="large">大格 (2cm)</Radio.Button>
                        </Radio.Group>
                      </Form.Item>

                      <Form.Item label="格子颜色">
                        <Radio.Group 
                          value={config.gridColor} 
                          onChange={e => updateConfig('gridColor', e.target.value)}
                          buttonStyle="solid"
                        >
                          <Radio.Button value="black">黑色</Radio.Button>
                          <Radio.Button value="gray">灰色</Radio.Button>
                          <Radio.Button value="blue">蓝色</Radio.Button>
                          <Radio.Button value="red">红色</Radio.Button>
                        </Radio.Group>
                      </Form.Item>
                    </Form>
                  )}
                </Card>

                {dictSource !== 'cet4' && practiceType !== 'workbook' && (
                  <Card title="内容预览 / 编辑" className="shadow-sm" bodyStyle={{ padding: 0 }}>
                    <TextArea
                      value={config.text}
                      onChange={(e) => updateConfig('text', e.target.value)}
                      placeholder={"apple 苹果\nbanana 香蕉"}
                      autoSize={{ minRows: 15, maxRows: 20 }}
                      style={{ border: 'none', padding: '16px', resize: 'none' }}
                    />
                  </Card>
                )}
              </Col>

              {/* 右侧预览区 */}
              <Col span={14} style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <Card 
                  title="实时预览" 
                  className="shadow-sm h-full" 
                  bodyStyle={{ height: 'calc(100% - 58px)', overflow: 'hidden', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}
                  extra={
                    <Button 
                      type="primary" 
                      onClick={handleGeneratePDF}
                      loading={isGenerating}
                    >
                      {isGenerating ? '生成中...' : '下载 PDF 字帖'}
                    </Button>
                  }
                >
                  <div className="flex justify-center bg-gray-100 rounded p-4 overflow-hidden h-full items-center">
                    <PreviewCanvas config={config} />
                  </div>
                  <div className="mt-4 text-center text-gray-400 text-xs">
                    * 预览仅供参考，实际打印效果更佳
                  </div>
                </Card>
              </Col>
            </Row>
          </Content>
        </Layout>
      </Layout>
    </ConfigProvider>
  )
}
