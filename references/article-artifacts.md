# 写作项目与产物契约

完整文章保存在用户指定的单篇项目目录，或用户指定的项目集合目录下的 `<slug>/`；未指定时使用当前项目的 `workspace/writing-projects/<slug>/`：

```text
<slug>/
  project.md
  input/user-prompt.md
  input/sources.md
  notes/evidence-ledger.md
  notes/retrieval.md
  artifacts/stance-card.md
  artifacts/brief.md
  artifacts/outline.md
  artifacts/draft.md
  artifacts/diagram-spec.md # 只在制作图示时建立
  artifacts/revisions/       # 只在全文重写时保存旧稿
  assets/                 # 只在实际需要图片时建立
  review/render-check.md
  review/editorial-review.md
  article.md
```

`project.md` 记录主题、目标读者、`article_mode`、选定 vault 的绝对路径、写作目录、当前阶段、大纲确认事实、运行中发现的缺口，以及四种独立状态。保存用户原始输入，避免对其观点二次转述后失真。若旧项目已有 `project.yaml`、`published.md`，读取原状态并续写，不机械替换。

| 状态 | 可用值 | 变为完成的依据 |
| --- | --- | --- |
| `content_status` | `planned` / `outline-ready` / `drafting` / `rewrite-needed` / `ready` | `article.md` 的正文、事实与模式目标完成。 |
| `visual_status` | `not-needed` / `planned` / `in-progress` / `ready` / `blocked` | 所需图示及其 SVG/PNG、图说和嵌入完成；无图时为 `not-needed`。 |
| `render_status` | `not-run` / `failed` / `passed` | 在目标 Markdown 渲染器实际预览文章及图片，并记录结果。 |
| `editorial_status` | `not-run` / `needs-revision` / `passed` | 审稿 P0 清零，P1 处理或明示余项。 |

完整文章只能在 `content_status=ready`、`visual_status=ready|not-needed`、`render_status=passed`、`editorial_status=passed` 时报告完成。没有图示仍需预览正文。阶段任务如大纲、审稿只报告已完成阶段，不伪称文章完成。

正文、图片或嵌入方式在预览后改变时，将 `render_status` 退回 `not-run`；影响内容判断的修改将 `editorial_status` 退回 `needs-revision`。状态表示当前版本，不沿用旧稿的通过记录。若正文已有任何图片，`visual_status` 不能写 `not-needed`。

## 产物内容

`notes/retrieval.md`：检索词、候选笔记、实际采用与排除的理由、来源回溯和风格样本。`notes/evidence-ledger.md` 的字段见 [知识检索与证据](knowledge-and-evidence.md)。

`artifacts/stance-card.md`：保留旧文件名作为兼容的写作框架卡。`opinion` 记录已确认核心判断、反对看法、证据与反例；`analysis` 记录分析问题、解释假设、证据与边界；`tutorial`、`review`、`case-study` 分别记录任务目标、评估标准或案例问题。作者没有表达过的判断标记为候选，不能归给作者。

`artifacts/brief.md`：写作目标、模式、读者、分析问题或已确认立场、资料范围、历史知识连接、证据强弱、知识空白、篇幅/风格约束和大纲策略。后续写作者只读 brief 与证据表也能理解任务。

`artifacts/outline.md`：每节的目的、关键问题或判断、使用的证据 ID、与主线的关系，以及有实际解释价值的图表。候选判断显式标记 `analysis-hypothesis`，不自动变成 `author-position`。记录用户确认的时间或原话；如果用户明确直写，记录直写指令。确认大纲后再根据它写完整长文。

`artifacts/draft.md`：正文与局部待验证标记，保留编辑空间；遇到不可靠材料，先改写为有限判断或留在证据表，不在公开正文制造确定性事实。

`artifacts/diagram-spec.md`：只在制作图示时建立，每张图单独记录图 ID、对应章节、要解释的问题、读者看图后应理解什么、关联证据 ID 或“概念示意”、内容边界、SVG 与 PNG 路径、正文嵌入位置、渲染检查结果。新生成的图示交付同名 SVG/PNG；正文默认引用相对 PNG 路径，SVG 作为可编辑源文件。截图、照片和外部图片按来源许可与实际格式交付，不强制转成 SVG。

一张图的最小记录示例：

```markdown
## D1：请求流转
- 章节：第二节“协调流程”
- 解释目标：读者能区分编排器与执行器的职责。
- 证据：E03、E07；没有事实依据的抽象关系标记为“概念示意”。
- 边界：不暗示所有实现都采用相同消息协议。
- 源文件：assets/d1.svg
- 成稿图片：assets/d1.png
- 正文嵌入：![请求流转示意](assets/d1.png)
- 渲染检查：记录在 review/render-check.md 的 D1 条目。
```

`artifacts/revisions/`：全文重写前保存旧 `draft.md`、已有 `article.md` 和反馈摘要，使用不覆盖旧文件的版本名。新稿重新走证据、图示、渲染与编辑检查。

`review/render-check.md`：记录目标 Markdown 渲染器及验证时间、正文预览、每张图的实际可见性、图说与章节对应、失败与修复。`review/editorial-review.md`：审稿结论、P0/P1/P2、已修复项、剩余限制及最终检查结果。`article.md` 是审稿后的可审阅文章，不含内部过程说明、本机绝对路径和未完成占位符。引用使用读者可访问的 URL、完整书目信息或可随文章交付的来源说明；内部 vault 相对路径保留在证据表。

渲染记录至少写明：渲染器及其版本或平台、检查的 `article.md` 版本或时间、正文是否完整显示、每张图片是否可见且图说对应、修复后是否重新预览。只运行 `check-article.js` 不能填写 `render_status=passed`。
用户未指定发布渠道时，使用当前可用的 Markdown 预览器并写明其名称；若无法实际预览，保持 `render_status=not-run`，报告尚未完成，不推测渲染结果。

短任务允许合并立场卡与 brief；`review-only` 可只留下审稿记录。若用户需要下游旧版 publisher 的 `published.md`，从审稿后的 `article.md` 生成兼容文件并交由 publisher 转换渠道格式。
