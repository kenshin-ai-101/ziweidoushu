# 紫微样本 RAG 检索源方案

`data/ziwei-samples-toolkit/samples-out` 当前包含 720 个 `.jsonl.gz` 分片，共 518,400 条命盘样本，压缩后约 5.5GB。它适合做 AI 对话的“命盘案例与断语片段检索源”，但不适合在请求时实时扫描，也不适合整条样本直接塞进 prompt。

## 推荐架构

离线阶段：

1. 流式读取 `samples-out/year-*/YYYY-MM.jsonl.gz`。
2. 每条样本拆成多个 topic chunk，例如 `overview`、`love`、`career`、`wealth`、`health`。
3. 给每个 chunk 附上结构化 metadata：出生年月、性别、命宫/身宫、五行局、当前大限、十二宫主星、四化星、topic。
4. 对 chunk 正文做 hash 去重，避免 51 万条生成样本里的重复断语无限放大。
5. 将产物写成 JSONL，再导入检索库。

线上阶段：

1. 用户生成命盘后，从当前 `chart` 提取同样的 metadata/fingerprint。
2. 根据用户问题判断 topic，例如感情、事业、财运、健康、迁移、大限。
3. 先用 metadata 做强过滤：topic、性别、命宫主星、相关宫位主星、四化、五行局。
4. 再做向量召回或 BM25 召回。
5. 将 Top K chunk 作为“参考案例/断语库”拼进 `systemPrompt`，要求模型只能把它作为参考，不得冒充倪师原话。

## 不建议的做法

- 不要把 518,400 条样本全部作为 prompt 上下文。
- 不要把完整样本作为最小索引单位；单条样本通常过长，检索会召回大量无关主题。
- 不要只做向量检索。紫微问题里“武曲化忌在命宫”“天府在迁移”“女命疾厄”这类结构化条件比语义相似更可靠。
- 不要信旧 README 示例字段。v3 manifest 和样本显示部分字段如 `daXians[].siHua`、`palace.selfSihua` 可能缺失，索引脚本应以真实 JSON 字段为准。

## Chunk 格式

离线脚本输出每行一个 JSON：

```json
{
  "id": "sha256...",
  "source": {
    "path": "data/ziwei-samples-toolkit/samples-out/year-1962/1962-04.jsonl.gz",
    "line": 1
  },
  "topic": "career",
  "text": "用于向量化和拼 prompt 的正文",
  "metadata": {
    "system": "倪海厦紫微斗数",
    "gender": "male",
    "birthYear": 1962,
    "wuxingJuName": "金四局",
    "mingGongBranch": 3,
    "shenGongBranch": 3,
    "currentDaXian": "64-73:迁移",
    "palaces": {
      "命宫": ["武曲:忌:normal", "七杀::bright"],
      "夫妻": ["天相::bright"]
    },
    "sihua": ["武曲:忌", "紫微:权", "天梁:禄", "左辅:科"],
    "fingerprint": ["topic:career", "gender:male", "wuxing:金四局", "命宫:武曲:忌", "命宫:七杀"]
  }
}
```

## 检索库选择

首选：Postgres + pgvector。

理由：项目已经依赖 `pg`，metadata 过滤、JSONB、全文检索和向量召回能放在同一个系统里，线上部署复杂度最低。

表结构建议：

```sql
create extension if not exists vector;

create table ziwei_rag_chunks (
  id text primary key,
  topic text not null,
  text text not null,
  metadata jsonb not null,
  embedding vector(1536),
  source_path text not null,
  source_line integer not null,
  created_at timestamptz not null default now()
);

create index ziwei_rag_chunks_topic_idx on ziwei_rag_chunks (topic);
create index ziwei_rag_chunks_metadata_gin on ziwei_rag_chunks using gin (metadata);
create index ziwei_rag_chunks_embedding_idx
  on ziwei_rag_chunks using hnsw (embedding vector_cosine_ops);
```

如果部署环境不方便装 pgvector，可以先用 `metadata + BM25` 跑起来；命理场景里结构化过滤本身已经能显著提升回答稳定性。

## 与现有接口的接入点

当前 AI 对话入口是 `app/api/interpret/route.ts`：

1. 在 `buildSystemPrompt(chart)` 前，取最后一条用户消息。
2. 调 `retrieveZiweiRag({ chart, query })`。
3. 把召回结果加入 system prompt 的 `【参考断语库】` 段落。
4. 保留现有 `chart` 结构化命盘作为第一事实来源，RAG 只补充相似案例和表达素材。

Prompt 约束建议：

```text
【参考断语库】
以下内容来自离线生成样本与已核对语料，只能作为相似命盘参考。
若内容与当前命盘结构冲突，以当前命盘为准。
不得把未标注 verified 的内容说成倪师原话。
```

## 构建命令

先跑小样本验证：

```bash
node scripts/build-ziwei-rag-corpus.mjs \
  --input data/ziwei-samples-toolkit/samples-out \
  --output data/ziwei-rag-corpus/chunks.preview.jsonl \
  --max-records 100 \
  --topics overview,career,wealth,health,love
```

全量构建：

```bash
node scripts/build-ziwei-rag-corpus.mjs \
  --input data/ziwei-samples-toolkit/samples-out \
  --output data/ziwei-rag-corpus/chunks.jsonl \
  --topics overview,personality,love,career,wealth,health,family,children,move,friends,home,spirit,parents
```

默认会按 `topic + text` hash 去重。同一段断语出现在大量命盘里时，只保留第一条来源，metadata 保留该来源样本的命盘指纹。
