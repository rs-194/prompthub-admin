# PromptHub Backend

## 当前阶段

当前为 Phase 2.1 FastAPI 后端项目骨架。

## 当前已完成

- FastAPI app 入口
- CORS 基础配置
- SQLite / SQLAlchemy 基础连接
- `/api/v1` 路由入口
- health check 接口

## 当前未完成

- TestRecord 数据模型与 CRUD
- ChatTest stream 接口
- 真实 LLM 调用
- 真实 RAG / embedding / 向量数据库
- 真实认证 / JWT / RBAC

## 本地启动

```bash
cd backend
python -m pip install -r requirements.txt
python -m uvicorn app.main:app --reload
```

默认 SQLite 地址为：

```text
sqlite:///./prompthub.db
```

按上述命令从 `backend` 目录启动时，数据库文件会位于 `backend/prompthub.db`。Phase 2.1 只配置连接，不创建业务表。

## 健康检查

启动后访问：

```text
http://localhost:8000/api/v1/health
```

预期返回：

```json
{
  "status": "ok",
  "service": "prompthub-backend"
}
```
