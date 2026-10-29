# Editorial Review Rubric

进入 `article.md` 前做编辑审查。目标是判断文章是否可供用户审阅，而不是证明已经完美。按 `article_mode` 使用不同标准，并与视觉、渲染状态分开记录。

## P0 阻塞问题

出现任一项，不将文章标记为完成：

- 文章偏离本次模式目标；`opinion` 没有已确认的核心立场，或 `analysis` 被写成用户未要求的观点文。
- 大纲和正文不一致。
- 关键事实没有来源，且被写成确定性判断。
- 图片路径错误、图片缺失或不可实际渲染；本机绝对路径、未解析 wikilink、vault 内部过程文本或 source fingerprint 泄露到正式稿。
- 将局部源码验证、独立 extract、单次 token 结果写成全项目 benchmark、真实增量性能或普遍 Agent 效果。
- 公开稿的关键来源未完成公开映射，或直接引用没有原文措辞、引号和来源。
- 将过程草稿、临时 brief 或 review note 写入 vault，污染知识库空间。
- 存在 `TODO`、`TBD`、未完成段落。
- 文章只是功能清单，没有与模式相符的解释、操作、评估或论证主线。
- 引用资料和结论之间没有可解释关系。

## P1 需要修复

- 开头太慢，没有尽早交代问题或目标；`opinion` 的已确认观点出现太晚。
- 章节标题不能帮助读者理解解释、操作、评估或论证的推进。
- 某些段落过长或同时表达多个意思。
- 过度依赖英文术语，但没有解释其意义。
- 缺少边界和局限，读起来像宣传稿。
- 图表存在，但没有帮助解释对应章节的问题。
- 结尾只是重复正文，没有回答开头的问题或交代适用边界；不强迫上升到趋势判断。
- 风格重写用力过猛，改掉了原本自然、准确的句子。
- 出现明显解释腔、总结腔、口头禅或面向读者的训人语气。
- 同一类模板化过渡反复出现，抽象名词压过具体机制，关键解释缺少适当案例或反例。

## P2 可后续优化

- 可以让标题更准确地呈现当前模式的主题或判断。
- 可以补一个对比表或流程图。
- 可以补一段实践验证。
- 可以强化和已有知识库中某个 claim / framework 的连接。
- 可以拆出一篇后续文章。

## 审查清单

| 维度 | 问题 |
|---|---|
| 模式 | 文章是否完成 `analysis` / `opinion` / `tutorial` / `review` / `case-study` 的实际目标？ |
| 判断归属 | `source-claim`、`analysis-hypothesis`、`author-position` 是否被正确区分？ |
| 来源链 | 事实是否可追溯到 source / wiki / raw？ |
| 结构 | 每一节是否推进当前模式的解释、操作、评估或论证？ |
| 风格 | 是否符合本次模式、受众与用户要求，并有结构化的深度解释？ |
| 边界 | 是否说明适用和不适用场景？ |
| 视觉 | 必要图示是否对应 `diagram-spec.md`、交付目标格式及可编辑源文件，并服务章节解释？图注是否说明示意或实测？ |
| 渲染 | Markdown、图片、图说是否在目标渲染器实际显示，结果是否记入 `render-check.md`？ |
| AI 味 | 是否有无依据的观点、套话过渡、抽象词堆叠或缺乏具体支撑？指出句段，不用固定分数。 |
| 公开交接 | 是否无 TODO、本地路径、裸尖括号 URL 和内部 metadata？公开来源、图片署名、Publisher 交接是否齐全？ |

## Review Report

```markdown
## Editorial Review

### Verdict

article-ready | needs-revision | blocked

### P0

- None

### P1

- <issue>

### P2

- <suggestion>

### Final Fixes Applied

- <fix>

### Delivery Status

- content_status: ready | other
- evidence_status: ready | other
- public_source_status: ready | other
- visual_status: ready | not-needed | other
- render_status: passed | other
- editorial_status: passed | other
- public_readiness_status: public-ready | other
```
