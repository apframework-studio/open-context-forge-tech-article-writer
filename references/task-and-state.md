# 任务意图、修改权限与状态

每次开始先读取现有 `project.md`、用户本轮指令和已确认的标题、大纲、模式、验证范围。旧项目缺少字段时补齐实际状态；不能把旧的 `article.md` 直接认定为公开可用。用户本轮明确要求优先于历史设置。只在缺失决定会改变文章方向时提问，已经确认过的决定不重复询问。

## 任务契约

| 字段 | 值 | 含义 |
| --- | --- | --- |
| `output_intent` | `internal_note` | 内部分析笔记，可写 vault 路径，输出到 `notes/`，不写公开 `article.md`。 |
| | `reviewable_article` | 可交用户审阅的 `article.md`，无内部路径，公开来源可以继续补齐。 |
| | `public_article` | 公开来源映射完成、公开引用完整，可交给 Publisher 的 `article.md`。 |
| | `channel_publish` | Writer 产出公开文章和交接单；Publisher 才处理渠道转换、构建、上线。 |
| `edit_scope` | `read-only` | 只审查并在对话中报告；不改正文、附件或 `project.md`。用户说“不修改”或“只看看”时选它。 |
| | `copyedit` | 只改错字、标点与不改变含义的短句；不得更换结构或证据。 |
| | `local` | 在指定段落小幅修改、去模板句或补具体例子；其他章节保持不动。用户说“适当修改、不要大幅修复”时选它。 |
| | `structural` | 可改标题、章节顺序、论证安排；保留未被否定的内容与确认。 |
| | `full-rewrite` | 归档旧稿，重写正文并重新走证据、视觉、审稿、渲染检查。 |

用户的明确修改范围优先于自动触发器。“思路 ok，但内容不 ok”通常触发 `full-rewrite`；若同一反馈附带“仅小幅修改”，则使用 `local` 并指出不能靠局部修改解决的具体问题，不擅自重写。`review-only` 是流程起点，`read-only` 是写权限；两者独立。保存用户原话和已确认决策，后续续写直接沿用。

## `project.md` 可解析状态块

新项目用文件开头的简单 `key: value` frontmatter，值保持单行；正文记录理由、日期、用户确认原话与未决事项。旧项目有其他格式时先读取再迁移，保留原文件副本。

```markdown
---
article_mode: analysis
output_intent: reviewable_article
edit_scope: local
current_stage: drafting
content_status: drafting
evidence_status: in-progress
public_source_status: not-run
visual_status: planned
editorial_status: not-run
render_status: not-run
public_readiness_status: in-progress
rendered_article_sha256:
reviewed_article_sha256:
---

# Project

- 已确认：标题、大纲、文章模式、验证范围及用户原话。
- 未决事项：仅列会影响下一步的事实或选择。
```

| 状态 | 值 | 通过依据 |
| --- | --- | --- |
| `content_status` | `planned` / `outline-ready` / `drafting` / `rewrite-needed` / `ready` | 正文与当前模式目标一致。 |
| `evidence_status` | `not-run` / `in-progress` / `needs-review` / `ready` / `blocked` | 关键判断已核对并标明验证范围。 |
| `public_source_status` | `not-run` / `in-progress` / `needs-review` / `ready` / `blocked` / `not-required` | 公开来源已映射或明确说明首手实测的方法与范围。 |
| `visual_status` | `not-needed` / `planned` / `in-progress` / `ready` / `blocked` | 素材、图说、引用路径、清晰度和目标渲染器检查完成。 |
| `editorial_status` | `not-run` / `needs-revision` / `passed` | 编辑审查对当前成稿完成。 |
| `render_status` | `not-run` / `failed` / `passed` | 当前成稿在目标渲染器实际预览通过。 |
| `public_readiness_status` | `in-progress` / `article-ready` / `public-source-ready` / `public-ready` / `internal-note` | 由脚本根据上述状态推导，不手填。Writer 最多到 `public-ready`。 |
| `publication_status` | Publisher 提供的 `prepared` / `written-to-repository` / `build-running` / `build-failed` / `built` / `live` | 只抄录 Publisher 的目标文件、构建记录或线上 URL 核对结果。Writer 不凭写入仓库推断上线。 |

`article-ready` 表示正文、证据、视觉、编辑和实际渲染都通过；`public-source-ready` 表示公开来源已完成但文章检查尚未全过；二者都满足才是 `public-ready`。`channel-ready` 或 `published` 是 Publisher 阶段的语义，Writer 不自行填入。`publication_status` 若无 Publisher 回执保持空白。

## 状态同步与回退

每次产物变化后**立即**运行状态脚本，再进入下一阶段；阶段检查通过时写相应 `--set`。脚本只维护状态与正文 hash，不能替代实际审稿或预览。先完成真实检查，再设置 `passed`。如果用户禁止文件写入，不运行它。

```bash
node scripts/project-state.js --project /path/to/article-project --change body
node scripts/project-state.js --project /path/to/article-project --change sources
node scripts/project-state.js --project /path/to/article-project --change images
node scripts/project-state.js --project /path/to/article-project --change mode
node scripts/project-state.js --project /path/to/article-project --change title
node scripts/project-state.js --project /path/to/article-project --change summary
node scripts/project-state.js --project /path/to/article-project --set content_status=ready --set evidence_status=ready
node scripts/project-state.js --project /path/to/article-project --set render_status=passed --set editorial_status=passed
```

- 正文改动：正文回 `drafting`，编辑回 `needs-revision`，渲染回 `not-run`；旧 hash 清除。
- 来源或引用关系改动：证据与公开来源回 `needs-review`，编辑回 `needs-revision`。若同时改了正文，再执行 `--change body`。
- 图或嵌入路径改动：视觉回 `in-progress`，编辑回 `needs-revision`，渲染回 `not-run`。
- 模式、标题或摘要改动：重新执行完整检查；模式还要复核证据、公开来源和已有图示。
- `render_status=passed` 和 `editorial_status=passed` 时脚本记录当前 `article.md` SHA-256。检查器发现 hash 过期会报 P0。

脚本不允许在同一条命令里声明“产物刚变化”和“检查已通过”。先改动并回退状态，随后实际完成审稿与预览，再单独写入通过状态。

状态脚本拒绝 `read-only` 项目写入，也拒绝 Writer 设置 `publication_status`。若用户在只读审查后明确允许修改，先根据用户原话把 `edit_scope` 改为授权值，再运行脚本。不要通过手改状态绕过实际检查。
