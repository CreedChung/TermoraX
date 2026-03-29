# TermoraX 工作台 UI/UX 重设计 - 需求分析报告

## 项目概述
**项目名称**: TermoraX  
**类型**: 桌面 SSH/SFTP 工作空间应用  
**技术栈**: React 19 + TypeScript + Vite + TailwindCSS v4 + shadcn/ui + Tauri 2  
**设计目标**: 现代化工作台UI，统一设计token系统，提升视觉体验

## 当前问题分析

### 1. 颜色系统问题
- **47+ 硬编码 rgba() 透明度值** 分散在 global.css 中
- 表面背景透明度不一致 (0.92, 0.7, 0.94, 0.72)
- 边框透明度过低 (0.08)，几乎不可见
- 缺少语义化的颜色命名

### 2. 边框样式问题
- 混合使用 `rgba(243, 229, 207, 0.08)` 和硬编码颜色
- 无边框hover/focus状态定义
- 圆角值不统一 (10px, 12px, 14px, 16px, 18px, 20px)

### 3. 间距系统问题
- 混合使用 6px, 8px, 10px, 12px 间距
- 缺少统一的 8px 网格系统
- 组件内边距不一致

### 4. 阴影系统问题
- 仅有一个全局阴影 `--shadow: 0 20px 40px rgba(0, 0, 0, 0.28)`
- 缺少分层级的 elevation 系统
- 没有定义 glow/focus ring 效果

### 5. 视觉层级问题
- 面板背景对比度不足
- 交互元素缺少hover/active状态
- 焦点指示器不明显

## 设计目标

### 核心目标
1. **统一设计token系统** - 语义化CSS变量，消除硬编码值
2. **现代化暗色主题** - 提升对比度，专业开发者工具美学
3. **WCAG AA 可访问性** - 4.5:1 文本对比度，可见焦点指示器
4. **一致的8px网格** - 统一的间距系统
5. **分层级阴影系统** - 5级 elevation shadows

### 设计原则
- **暗色优先** - SSH终端美学，深色背景 + 高对比度文字
- **玻璃拟态** - 轻微透明效果用于 elevated 表面
- **强调色驱动** - 橙色强调色 (#f2a05c) 用于视觉层级
- **最小边框** - 依赖背景对比而非边框
- **开发者专注** - 信息密集UI，紧凑布局

## 技术实现策略

### 1. CSS 架构
```css
/* 基础层 - 颜色定义 */
--bg-primary: #101316;
--bg-secondary: #12171d;
--surface-default: rgba(18, 23, 29, 0.95);
--surface-elevated: rgba(33, 42, 52, 0.98);

/* 语义层 - 用途定义 */
--text-primary: #f5f1e8;
--text-secondary: #b5b0a5;
--border-default: rgba(243, 229, 207, 0.12);
--accent-primary: #f2a05c;

/* 组件层 - 状态定义 */
--surface-hover: rgba(40, 49, 59, 0.85);
--surface-active: rgba(242, 160, 92, 0.12);
```

### 2. Tailwind v4 配置
- 使用 `@theme` 指令扩展自定义属性
- 对齐 shadcn/ui 的 `--ui-*` 变量命名
- 支持 `.dark` 类选择器

### 3. 组件更新策略
按照依赖顺序更新：
1. 全局样式 (global.css) - 设计token
2. shadcn 组件主题 - 对齐token系统
3. WorkspaceShell - 外壳布局
4. ConnectionSidebar - 侧边栏
5. TerminalWorkspace - 终端区域
6. FilePanel - 文件面板
7. 其他面板组件

## 设计Token规范

### 颜色Token (语义化)
```
--bg-*         背景层
--surface-*    表面层 (卡片、面板)
--text-*       文字颜色
--border-*     边框颜色
--accent-*     强调色
--state-*      状态颜色 (hover, active, disabled)
```

### 间距Token (8px网格)
```
--space-1: 4px
--space-2: 8px  (基础单位)
--space-3: 12px
--space-4: 16px
--space-5: 20px
--space-6: 24px
```

### 阴影Token (5级Elevation)
```
--shadow-sm:  0 1px 2px rgba(0, 0, 0, 0.20)
--shadow-md:  0 4px 8px rgba(0, 0, 0, 0.24)
--shadow-lg:  0 8px 16px rgba(0, 0, 0, 0.28)
--shadow-xl:  0 12px 24px rgba(0, 0, 0, 0.32)
--shadow-2xl: 0 20px 40px rgba(0, 0, 0, 0.36)
```

### 圆角Token
```
--radius-sm: 6px
--radius-md: 8px
--radius-lg: 12px
--radius-xl: 16px
--radius-full: 9999px
```

## 文件清单

### 需要更新的文件
1. `src/styles/global.css` - 主要token定义
2. `src/features/workspace/components/WorkspaceShell.tsx`
3. `src/features/connections/components/ConnectionSidebar.tsx`
4. `src/features/terminal/components/TerminalWorkspace.tsx`
5. `src/features/sftp/components/FilePanel.tsx`
6. `src/features/transfers/components/TransferPanel.tsx`
7. `src/features/snippets/components/SnippetPanel.tsx`
8. `src/features/workspace/components/HistoryPanel.tsx`
9. `src/features/workspace/components/LogPanel.tsx`
10. `src/features/settings/components/SettingsDialog.tsx`

### shadcn组件可能需更新
- 检查并调整 Button, Card, Dialog, Tabs, Input 等组件的主题变量

## 质量目标

- [ ] 消除所有硬编码 rgba() 值 (除 token 定义外)
- [ ] 统一边框样式为语义化 token
- [ ] 实现 8px 网格间距
- [ ] 通过 WCAG AA 对比度检查
- [ ] 所有交互元素有明确的 hover/focus 状态
- [ ] 统一的阴影 elevation 系统

## 后续步骤

1. 等待 architect 创建详细的设计token规范
2. 等待 qa 审查架构设计
3. 进入并行开发和QA阶段

---

**生成时间**: 2026-03-29  
**分析师**: team-frontend analyst  
**会话**: FE-termorax-workspace-ui-2026-03-29
