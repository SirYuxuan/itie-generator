# 字帖生成器 (Handwriting Practice Generator)

一个基于 Next.js 的在线英文字帖生成器,可以自定义字体、行高、线条样式等,并导出为 PDF 文件。

## 功能特性

- ✨ 自定义练习文本
- 📏 可调节字体大小和行高
- 📝 多种线条样式(实线、虚线、点线、一行实线一行虚线交替)
- 🎯 支持衡水体英文字体
- 📐 可选辅助线
- 📄 支持 A4 和 Letter 纸张大小
- 🎨 实时预览
- 📥 一键导出 PDF

## 技术栈

- **Next.js 14** - React 框架
- **TypeScript** - 类型安全
- **Tailwind CSS** - 样式设计
- **jsPDF** - PDF 生成

## 开始使用

### 1. 安装依赖

```bash
npm install
```

### 2. 运行开发服务器

```bash
npm run dev
```

打开浏览器访问 [http://localhost:3000](http://localhost:3000)

### 3. 构建生产版本

```bash
npm run build
npm start
```

## 使用说明

1. 在左侧配置面板输入要练习的英文文本
2. 调整字体大小、行高、每页行数等参数
3. 选择线条类型和是否显示辅助线
4. 右侧实时预览字帖效果
5. 点击"生成 PDF"按钮下载字帖

## 配置选项

- **练习文本**: 输入要练习的英文单词或句子
- **字体大小**: 16-48px,适合不同年龄段
- **行高**: 40-100px,控制行间距
- **每页行数**: 5-20 行,自定义密度
- **线条类型**: 实线/虚线/点线/一行实线一行虚线交替
- **辅助线**: 帮助对齐文字
- **字体**: 衡水体英文、Arial、Times New Roman、Courier、Helvetica
- **纸张大小**: A4 或 Letter

## 项目结构

```
itie-generator/
├── app/                    # Next.js App Router
│   ├── globals.css        # 全局样式
│   ├── layout.tsx         # 根布局
│   └── page.tsx           # 首页
├── components/            # React 组件
│   ├── HandwritingGenerator.tsx  # 主组件
│   └── PreviewCanvas.tsx         # 预览画布
├── lib/                   # 工具库
│   ├── types.ts          # TypeScript 类型定义
│   └── pdfGenerator.ts   # PDF 生成逻辑
└── package.json          # 项目配置
```

## 许可证

MIT
