# TaskFlow

个人任务管理系统，通过日历、清单、四象限三种视图管理待办事项。

## 技术栈

- **框架**: Next.js 16 (App Router) + React 19 + TypeScript
- **样式**: Tailwind CSS v4 + glassmorphism 毛玻璃效果
- **数据库**: Neon PostgreSQL (serverless) + Drizzle ORM
- **离线存储**: Dexie (IndexedDB) + 同步队列
- **状态管理**: Zustand (persist 中间件)
- **认证**: NextAuth v5 (Credentials + GitHub OAuth)
- **拖拽**: @dnd-kit/core + @dnd-kit/sortable

## 快速开始

```bash
# 安装依赖
npm install

# 配置环境变量
cp .env.example .env.local
# 编辑 .env.local 填入数据库连接字符串等

# 启动开发服务器
npm run dev
```

访问 http://localhost:3000，根据 UA 自动重定向至桌面端 (`/d`) 或移动端 (`/m`)。

## 项目结构

```
src/
  app/
    d/          # 桌面端页面 (日历/清单/四象限/归档/设置/登录)
    m/          # 移动端页面
    api/        # API 路由 (tasks/categories/auth/sync/export/settings)
  components/
    desktop/    # 桌面端组件 (sidebar/topbar/task-item/add-task-modal/stat-cards/month-picker)
    mobile/     # 移动端组件 (add-task-sheet)
  lib/
    db/         # Drizzle Schema + 数据库连接
    stores/     # Zustand stores (task-store/settings-store)
    hooks/      # 自定义 hooks (use-calendar/use-categories)
    utils/      # 工具函数 (cn/cross-month/schemas)
    constants.ts # 分类/优先级/四象限颜色常量
    types.ts    # TypeScript 类型定义
```

## 功能

- 三种视图：日历视图、清单视图、四象限拖拽视图
- 跨月处理：逾期结转、长期常驻、跨期进行中
- 分类系统：4 个一级分类 + 琐事下 5 个二级分类
- 离线支持：IndexedDB 本地存储 + 网络恢复自动同步
- 三套皮肤：默认（浅色蓝紫）、霓虹（深色）、华为（红色主题）
- 数据导出：JSON / CSV / ICS
- BARK 推送提醒
