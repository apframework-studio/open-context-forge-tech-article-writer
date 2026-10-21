---
name: open-context-forge-tech-article-writer
description: Use when drafting or revising a Chinese technical article from a selected Open Context Forge or Markdown knowledge vault, including a topic, viewpoint, source material, outline, or existing draft. Not for importing sources into a vault or publishing to a channel.
---

# Open Context Forge Tech Article Writer

把用户的判断与知识库中的可追溯知识编成文章。vault 是输入，writing project 是产物；默认不改写 vault。

## 入口

1. 从用户请求取得目标 vault 的路径或已解析的配置名称。若只有多个可能的 vault，先确认目标。不得把本 Skill 所在目录或某个旧作者的本机路径当成默认 vault。
2. 优先使用用户指定的写作位置：指定某篇文章项目目录时直接使用；指定项目集合目录时在其下建立 `<slug>/`。未指定时在当前项目的 `workspace/writing-projects/<slug>/` 建项目。若已有同一主题项目，先检查并续写，不覆盖已有确认和稿件。
3. 判定起点：`topic-to-outline`、`approved-outline-to-draft`、`draft-to-article` 或 `review-only`。用户只要审稿或改写时，不强迫重走全部流程。

读取 [知识检索与证据](references/knowledge-and-evidence.md)，先识别 vault 布局与目的，再检索。在本 Skill 根目录运行 `node scripts/vault-query.js --vault <绝对路径> --query <主题> --json`，或从其他目录使用脚本绝对路径。它是只读候选召回，不能代替阅读和核对。需要查原文时加 `--include-sources`，或直接跟随 Wiki 的来源链接。

## 写作链路

1. 保存原始任务与来源，读取相关知识和 style notes，建立 `notes/evidence-ledger.md`。区分用户立场、历史观点、来源事实、推断与未解决分歧。
2. 提炼核心判断、反对对象、证据、边界和读者预期变化。只有会改变文章方向的信息缺失时，按 [追问规则](references/socratic-questions.md) 集中提问；用户观点已经清楚时直接推进。
3. 用 [产物契约](references/article-artifacts.md) 写 `stance-card.md`、`brief.md` 和论证型 `outline.md`。大纲每节交代论点、证据及推进关系。默认向用户确认大纲后写完整正文；若用户明确要求直接成稿，记录跳过确认的原因并继续。
4. 按已确认大纲或用户明确直写指令写 `draft.md`。事实性陈述核对来源定位；有冲突则写出分歧或收窄判断。缺乏证据的内容写成待验证问题或作者观点，不伪装成事实。
5. 依知识库风格资料与 [风格应用规则](references/style-application-rules.md) 修订。用户对体裁、受众和语气的本次要求优先；历史文章只用于观察结构与语气，不复制段落。按论证需要制作表格或图；不预设必须有头图或某种绘图软件。
6. 按 [编辑审查](references/editorial-review-rubric.md) 留下 `review/editorial-review.md`，修复 P0 后输出 `article.md`。在本 Skill 根目录运行 `node scripts/check-article.js --file <文章绝对路径> --json`，或使用脚本绝对路径做机械检查；人工复核证据是否支持结论。

## 交付边界

- 每篇完整文章保留输入、证据表、立场卡、brief、大纲、草稿、审稿记录和 `article.md`；若任务止于大纲或审稿，只产出对应阶段。已有旧项目的 `published.md` 可直接作为输入，不强行迁移。
- 缺少关键立场、关键来源无法取得或资料明显冲突时，给出已有产物和具体待决问题，暂停依赖这些判断的后续写作。一般资料缺口可继续写可证实的部分。
- 本 Skill 完成于可审阅文章。若用户要求知识回填，交给 vault maintainer；若要求渠道发布，先按其流程准备发布输入。未经请求不修改 vault、不执行 Git commit 或 push、不发布到外部渠道。
- 完成报告写明文章路径、核心判断、大纲确认状态、主要 Wiki/raw/style 来源、未核实项与审稿结论。
