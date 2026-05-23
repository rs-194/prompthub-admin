# FastAPI 后端项目骨架 v1

## 0. 文档状态

- 阶段：Phase 2.1 backend skeleton
- 状态：已实现
- 适用范围：FastAPI 后端最小启动骨架

## 1. 本阶段目标

建立后端最小可运行结构，为后续 TestRecord 持久化和 ChatTest mock stream 接口预留基础入口。

## 2. 本阶段已完成

- 新增 `backend/` 目录
- 创建 FastAPI app 入口
- 配置 CORS
- 配置基础 settings
- 配置 SQLite / SQLAlchemy 基础连接
- 提供 `/api/v1` 路由入口
- 提供 `GET /api/v1/health` 健康检查接口
- 新增后端启动说明

## 3. 本阶段不做

- 不实现 TestRecord 数据模型
- 不实现 TestRecord CRUD
- 不实现 ChatTest mock stream 接口
- 不使用 `StreamingResponse`
- 不接前端
- 不迁移前端 mock service
- 不调用真实 LLM
- 不做真实 RAG、embedding 或向量数据库
- 不实现真实登录、JWT、RBAC 或 API Key 管理
- 不引入 Docker、Redis、Celery 或任务队列

## 4. 后端目录结构

```text
backend/
├─ app/
│  ├─ main.py
│  ├─ core/
│  │  └─ config.py
│  ├─ db/
│  │  └─ session.py
│  └─ api/
│     └─ v1/
│        ├─ router.py
│        └─ health.py
├─ requirements.txt
└─ README.md
```

## 5. 验收方式

```bash
cd backend
python -m pip install -r requirements.txt
python -m compileall app
python -m uvicorn app.main:app --reload
```

启动后访问：

```text
http://localhost:8000/api/v1/health
```

预期返回 `status: ok`。

## 6. 后续阶段入口

- Phase 2.2：TestRecord 持久化，新增数据模型、CRUD 和对应 API。
- Phase 2.3：后端 mock stream 接口，提供 ChatTest 流式调试基础能力。
