# 技术文章写作 Skill 设计

## 目标与边界

将用户的观点、问题、链接或既有草稿，与明确指定的 Markdown 知识库连接，形成有来源链、符合作者风格的中文技术文章。它承担 Open Context Forge 链路中的 `vault knowledge → writing project → reviewed article`；资料摄入、长期知识编译和渠道发布由其他能力负责。参考 LLM Wiki 的 purpose、结构化 Wiki、来源追溯和检索思路，不复制其桌面应用、图谱、向量检索和摄入队列。

## 入口与兼容

- 每次运行明确选定 vault 路径或由用户给出的配置名称；遇到多个候选时询问，不猜测。
- 支持新版 `.ocf/vault.json` 声明的 wiki/sources 路径，以及旧版 `00-system/`、`20-wiki/`、`10-raw/` 布局。读取 vault 自身的 purpose、schema、index 与 style 约束；不把旧目录当成通用规则。
- 接收选题、观点、资料、已批准大纲或已有草稿。可从任何阶段恢复；保留已有文件，局部更新。
- 用户指令优先于 style note；style note 优先于本 Skill 的通用写作建议。只模仿结构和语气特征，不复制历史段落。

## 工作流

1. 建立 writing project：保存用户原始输入、vault 路径、模式和运行状态。知识库默认只读，过程稿存放在用户指定的工作区；若未指定，使用当前项目的 `workspace/writing-projects/<slug>/`。
2. 理解输入并检索：先检索 Wiki 判断、概念、框架、来源摘要和反例，再回溯 raw；读取少量相关历史文章和 style note。候选检索只是召回，需阅读原文核对。
3. 建立证据表：每项关键事实或判断记录来源定位、支持关系、冲突、时效和核对状态；分开标记用户立场、历史判断、资料事实和模型推断。
4. 澄清立场：若用户已有清楚观点，直接成卡；缺少会改变文章方向的信息时，集中追问。完成 stance card、brief 和论证型 outline。
5. 大纲门：默认等用户确认后写完整正文。用户明确要求直接成稿时可越过该门，记录跳过原因及未确认风险。
6. 写初稿、选用必要图表、按 style notes 润色并审稿。视觉内容由论证需要决定，不强制特定绘图软件或头图。
7. 审稿清除阻断项后输出 `article.md`。只在用户明确要求时交给知识库维护或发布流程，不自动改写 vault、提交 Git 或推送。

## 产物契约

写作项目保留 `project.md`、`input/`、`notes/evidence-ledger.md`、`artifacts/stance-card.md`、`brief.md`、`outline.md`、`draft.md`、`review/editorial-review.md`、`article.md` 与可选 `assets/`。短任务可合并 stance 与 brief，但证据表、大纲、审稿记录在完整文章中保留。现有旧项目的 `published.md` 可作为成稿输入或兼容输出，不强行迁移。

## 可执行辅助

- `scripts/vault-query.js`：无第三方依赖，只读识别两种 vault 布局并召回 Markdown 候选；输出相对路径、标题、分数和命中信号，不自动生成事实。
- `scripts/check-article.js`：对成稿做机械检查，发现 TODO/TBD、本机绝对路径和不存在的相对图片。人工仍需审查证据、论证、风格和真实授权。

## 验证场景

- 新版及旧版 vault 中同一中文主题都能召回 Wiki，默认不把 raw 当作已编译知识。
- 已有明确立场时不会反复追问；缺失立场时不会虚构作者观点。
- 来源冲突和未核实数字不会直接进入确定性正文。
- 未批准大纲时停止在 outline；明确直写时记录例外。
- 审稿清楚报告 P0/P1/P2，成稿没有过程占位符与本地路径。
