---
name: open-context-forge-tech-article-writer
description: Use when drafting or revising a Chinese technical article from a selected Open Context Forge or Markdown knowledge vault, including a topic, viewpoint, source material, outline, or existing draft. Not for importing sources into a vault or publishing to a channel.
---

# Open Context Forge Tech Article Writer

把用户的写作目标与知识库中的可追溯知识编成文章。vault 是输入，writing project 是产物；默认不改写 vault。

## 入口

1. 从用户请求取得目标 vault 的路径或已解析的配置名称。若只有多个可能的 vault，先确认目标。不得把本 Skill 所在目录或某个旧作者的本机路径当成默认 vault。
2. 优先使用用户指定的写作位置：指定某篇文章项目目录时直接使用；指定项目集合目录时在其下建立 `<slug>/`。未指定时在当前项目的 `workspace/writing-projects/<slug>/` 建项目。若已有同一主题项目，先检查并续写，不覆盖已有确认和稿件。
3. 按 [文章模式与判断归属](references/article-modes.md) 确定 `article_mode`：`analysis`、`opinion`、`tutorial`、`review` 或 `case-study`。用户要求“陈述和分析，不做观点倾向”时直接选 `analysis`；历史风格不能把它改成观点文。
4. 判定起点：`topic-to-outline`、`approved-outline-to-draft`、`draft-to-article`、`review-only` 或 `full-rewrite`。用户只要审稿或改写时，不强迫重走全部流程；“思路 ok，但文章内容不 ok”触发全文重写并保留旧稿，不当作局部润色。

读取 [知识检索与证据](references/knowledge-and-evidence.md)，先识别 vault 布局与目的，再检索。在本 Skill 根目录运行 `node scripts/vault-query.js --vault <绝对路径> --query <主题> --json`，或从其他目录使用脚本绝对路径。它是只读候选召回，不能代替阅读和核对。需要查原文时加 `--include-sources`，或直接跟随 Wiki 的来源链接。

## 写作链路

1. 保存原始任务与来源，读取相关知识和 style notes，建立 `notes/evidence-ledger.md`。明确标记 `source-claim`、`analysis-hypothesis`、`author-position`，以及核实状态与反例；大纲候选不自动变成作者观点。
2. 按模式确定写作问题、证据、边界和读者预期变化。`opinion` 才要求作者立场与反对对象；`analysis` 不追问或编造立场。只有会改变方向的信息缺失时，按 [追问规则](references/socratic-questions.md) 集中提问。
3. 用 [产物契约](references/article-artifacts.md) 写 `stance-card.md`、`brief.md` 和符合当前模式的 `outline.md`。大纲每节交代解释目标、证据及推进关系。默认向用户确认大纲后写完整正文；若用户明确要求直接成稿，记录跳过确认的原因并继续。
4. 按已确认大纲或用户明确直写指令写 `draft.md`。事实性陈述核对来源定位；有冲突则写出分歧或收窄判断。缺乏证据的内容写成待验证问题或标明推论，不伪装成事实或作者观点。`full-rewrite` 按模式参考文件归档旧稿后重新写正文。
5. 依知识库风格资料与 [风格应用规则](references/style-application-rules.md) 修订。用户对体裁、受众和语气的本次要求优先；历史文章只用于观察结构与语气，不复制段落。按解释需要制作表格或图；不预设必须有头图。新制作的图示按 `artifacts/diagram-spec.md` 逐图说明章节、目标和证据，同时交付 SVG 源文件与 PNG，正文默认引用 PNG。
6. 按 [编辑审查](references/editorial-review-rubric.md) 留下 `review/editorial-review.md`，修复 P0 后输出 `article.md`。运行 `node scripts/check-article.js --file <文章绝对路径> --json` 做引用、路径与基础文件检查；在目标 Markdown 渲染器实际预览正文与每张图片，把结果记入 `review/render-check.md`。脚本通过不等于视觉渲染通过。

## 交付边界

- 每篇完整文章保留输入、证据表、立场卡、brief、大纲、草稿、渲染与审稿记录和 `article.md`；需要图示时增加图示规格及 SVG/PNG。若任务止于大纲或审稿，只产出对应阶段。已有旧项目的 `published.md` 可直接作为输入，不强行迁移。
- `opinion` 缺少关键立场，或任一模式的关键来源无法取得、资料明显冲突时，给出已有产物和具体待决问题，暂停依赖这些判断的后续写作。一般资料缺口可继续写可证实的部分。
- 本 Skill 完成于可审阅文章。若用户要求知识回填，交给 vault maintainer；若要求渠道发布，先按其流程准备发布输入。未经请求不修改 vault、不执行 Git commit 或 push、不发布到外部渠道。
- `project.md` 分别维护 `content_status`、`visual_status`、`render_status`、`editorial_status`。只有正文就绪、必要图示就绪或无需图示、实际渲染通过、编辑审查通过，才能称“完整文章完成”；阶段产物按实际状态报告。
- 完成报告写明文章路径、文章模式、主要分析问题或已确认作者判断、大纲确认状态、四种状态、主要 Wiki/raw/style 来源、未核实项与审稿结论。
