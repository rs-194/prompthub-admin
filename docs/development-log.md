# 开发记录（Development Log）

## 1. 开发记录说明
本文件用于持续记录项目开发过程中的关键变更，便于回溯与协作。

记录原则：
- 每次代码改动后追加一条记录。
- 记录应包含：变更内容、影响范围、验证方式。
- 不夸大完成度，未完成内容必须明确标注。

## 2. 开发记录模板
```md
### YYYY-MM-DD：本次变更标题

内容：
- 变更点 1
- 变更点 2

影响范围：
- 目录/模块 A
- 目录/模块 B

验证方式：
- npm run build 通过
- npm run dev 页面可正常访问
```

## 3. 当前开发记录

### 2026-04-27：项目骨架整理

内容：
- 整理后台项目目录结构
- 新增 AdminLayout
- 将布局组件整理到 src/layout
- 新增 config/menu.ts
- 重构基础路由
- 新增 dashboard、prompts、knowledge、models、chat-test、settings 页面骨架
- 新增 stores/app.ts 管理侧边栏折叠状态

影响范围：
- 前端目录结构
- 路由
- 布局
- 菜单配置
- 页面骨架

验证方式：
- npm run build 通过
- npm run dev 可正常启动

### 2026-04-27：基础布局修复

内容：
- 修复页面没有铺满浏览器的问题
- 修复右侧大面积黑色空白问题
- 调整后台左右布局
- 统一 Header、Aside、Content、Footer 区域
- 新增 page-card 通用页面壳样式
- 统一页面标题可读性

影响范围：
- 全局样式
- 后台布局组件
- 页面骨架样式

验证方式：
- npm run build 通过
- npm run dev 页面显示正常

### 2026-05-08：Dashboard 首页 mock 数据看板

内容：
- 新增 Dashboard 相关类型 `types/dashboard.ts`
- 新增 Dashboard 数据服务 `services/dashboard.ts`，当前为 mock 数据，后端待接入
- 新增 Dashboard 统计卡片组件 `StatCard.vue`
- 完善 Dashboard 首页，展示统计卡片和最近操作记录表格

影响范围：
- frontend/src/views/dashboard
- frontend/src/services
- frontend/src/types
- docs/roadmap.md

验证方式：
- npm run build
- 启动项目后访问 `/dashboard`，检查统计卡片和最近操作记录表格是否正常显示
