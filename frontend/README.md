# MAGI 前端项目结构

## 📁 目录说明

### `/src` - 源代码
- **main.js** - 应用入口
- **App.vue** - 根组件

#### `/src/components` - Vue组件
- **MAGIInterface.vue** - 主界面容器
- **AIWindow.vue** - AI分析窗口（展示Phase 1/2）
- **AnimatedMarkdownText.vue** - 动画Markdown文本渲染（带打字机效果）
- **MarkdownRenderer.vue** - 静态Markdown文本渲染
- **ConsensusDisplay.vue** - 共识显示组件
- **VotingPanel.vue** - 投票面板
- **QuestionInput.vue** - 问题输入框
- **HistoryPanel.vue** - 历史记录面板
- **SystemStatus.vue** - 系统状态显示
- **AnimatedText.vue** - 普通动画文本（无Markdown）

#### `/src/assets` - 静态资源
- CSS样式
- 图片等资源

#### `/src/utils` - 工具函数
- **markdown.js** - Markdown渲染工具函数库
  - `escapeHtml()` - HTML转义
  - `markdownToHtml()` - Markdown转HTML
  - `markdownToHtmlWithLineBreaks()` - 带换行处理的转换

### `/config` - 配置文件
- **package.json** - NPM项目配置
- **package-lock.json** - 依赖版本锁定

### `/tools` - 工具和文档

#### `/tools/tests` - 测试工具
_用于组件和功能测试_

#### `/tools/scripts` - 辅助脚本
_构建、部署等脚本_

#### `/tools/docs` - 文档
_前端相关文档_

### 根目录文件
- **index.html** - HTML入口
- **vite.config.js** - Vite构建配置

## 🎨 核心功能组件

### Markdown渲染系统
支持的Markdown语法：
- ✅ 标题 (`#`, `##`, `###` 等)
- ✅ 粗体 (`**text**`, `__text__`)
- ✅ 斜体 (`*text*`, `_text_`)
- ✅ 删除线 (`~~text~~`)
- ✅ 链接 (`[text](url)`)
- ✅ 图片 (`![alt](url)`)
- ✅ 代码 (行内 和 代码块)
- ✅ 列表 (有序和无序)
- ✅ 引用块 (`> quote`)
- ✅ 分割线 (`---`)

### 组件使用示例

**MarkdownRenderer** - 静态渲染
```vue
<MarkdownRenderer :content="markdownText" />
```

**AnimatedMarkdownText** - 动画渲染
```vue
<AnimatedMarkdownText 
  :text="streamingText" 
  :speed="15"
  :enableMarkdown="true"
/>
```

## 🚀 快速开始

### 安装依赖
```bash
cd frontend
npm install
```

### 开发模式
```bash
npm run dev
# 启动Vite开发服务器，通常在 http://localhost:5173
```

### 生产构建
```bash
npm run build
# 生成optimized build到 dist/ 目录
```

### 预览生产构建
```bash
npm run preview
# 预览生产构建
```

## 🎯 主要功能

### 1. MAGI Interface 主界面
- 三角形AI代理布局（BALTHASAR、CASPER、MELCHIOR）
- WebSocket实时通信
- 系统状态显示

### 2. AI Windows 分析窗口
- 显示AI分析结果（Phase 1: 独立分析）
- 显示AI相互评价（Phase 2: 相互评价）
- 实时流式更新
- 投票结果展示

### 3. 共识显示
- 实时共识内容展示
- 投票百分比计算
- 动画效果

### 4. 历史记录
- 查看过往问题和共识
- Markdown渲染支持
- 投票统计

## 🔌 WebSocket事件

### 从服务器接收
- `phase_start` - 分析阶段开始
- `ai_stream` - 流式内容更新
- `phase_complete` - 阶段完成
- `consensus_reached` - 共识形成
- `conversation_complete` - 对话完成
- `error` - 错误信息

### 发送到服务器
- `query` - 发送问题

## 🎨 样式系统

主要颜色变量：
```css
--neon-cyan: #00e5ff    /* 青色 */
--neon-green: #00ff88   /* 绿色 */
--neon-gold: #ffaa00    /* 金色 */
--neon-red: #ff0055     /* 红色 */
--neon-pink: #ff00ff    /* 粉色 */
```

## 📱 响应式设计
- 支持桌面端（1920x1080及以上）
- 支持平板端（1024px及以上）
- 支持移动端（768px及以上）

---

**最后更新**: 2026-04-16
**版本**: 1.0
**构建工具**: Vite
**框架**: Vue 3
