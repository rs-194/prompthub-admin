# PromptHub Backend

## 当前阶段

当前后端处于 Phase 2.2：在 Phase 2.1 FastAPI 最小骨架基础上，新增 TestRecord 测试记录持久化接口。

## 当前已完成
- FastAPI app 入口
- CORS 基础配置
- SQLite / SQLAlchemy 基础连接
- `/api/v1` 路由入口
- health check 接口
- TestRecord SQLAlchemy model
- TestRecord 创建、分页列表、详情、删除接口
- 列表接口只返回 `outputPreview`，详情接口返回完整 `output`

## 当前未完成
- 前端 ChatTest service 尚未替换为后端接口
- ChatTest stream 接口
- 真实 LLM 调用
- 真实 RAG / embedding / 向量数据库
- 真实认证 / JWT / RBAC
- Prompt / Model / Knowledge 后端表
- Alembic 数据库迁移

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

按上述命令从 `backend` 目录启动时，数据库文件会位于 `backend/prompthub.db`。当前 `Base.metadata.create_all(bind=engine)` 是 Phase 2.2 开发期建表方案，不是生产最终迁移方案；后续正式阶段可引入 Alembic。

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

## TestRecord 接口

```text
GET /api/v1/test-records
GET /api/v1/test-records/{id}
POST /api/v1/test-records
DELETE /api/v1/test-records/{id}
```

说明：
- `GET /api/v1/test-records` 支持 `page`、`pageSize`、`keyword`。
- `pageSize` 最大为 100。
- `keyword` 为空或全空白时不筛选。
- `POST /api/v1/test-records` 由后端生成 `outputPreview` 和 `createdAt`。
- `knowledgeTitles` 当前以 JSON 字符串存储，对外仍返回数组。
- `status: stopped` 只是记录状态预留，不代表已经接入真实取消能力。
