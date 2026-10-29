# 关键判断、验证与公开来源

证据表存储检索与原文定位；观点清单只收录会影响标题、核心解释、数字或结论的关键判断。两者用证据 ID 关联，避免在两个文件复制整段材料。作者确认与证据支持是不同维度：用户认可大纲方向，既不证明某事实，也不自动确认大纲内每一句判断。

## `notes/claim-register.md`

每条至少写：

| 字段 | 记录内容 |
| --- | --- |
| Claim ID、拟用句段 | 对应正文标题或段落，尽量可定位。 |
| 归属 | `source-claim` / `observed-result` / `analysis-hypothesis` / `author-position`。 |
| 证据 ID 与说话者 | 关联 `evidence-ledger.md`；作者立场附本次用户确认原话。 |
| 证据强度 | `confirmed`（按指定方法复核）/ `supported`（有可靠来源支持）/ `plausible`（有解释力但证据不足）/ `unverified` / `not-supported`。强度不等于用户是否认可观点。 |
| 验证范围 | 仓库 commit、package version、命令、输入样本、平台、日期；未验证项写明范围。 |
| 正文处理 | `state-as-fact` / `attribute-to-source` / `mark-as-hypothesis` / `narrow` / `omit`，并写限定语。 |

`observed-result` 只写实际运行结果。局部源码检查、独立 extract、单次 token 结果不能概括为整个项目 benchmark、增量性能或普遍 Agent 效果。来自 README 的版本、接口和平台能力，要记录检查日期、来源 commit 和 package version；缺一个就说明缺口。`not-supported` 的判断应删去或写为尚待验证的问题。

引用另记录 `direct_quote`、`paraphrase`、`analysis`、`external_verification`。直接引用保留原文措辞、引号和公开来源；转述注明来源主张，不能冒充独立证实；分析说明这是本文解释，不归给原作者。

## `notes/verification-log.md`

记录实际执行的时间、环境、仓库 commit、package version、输入、完整命令、退出码、输出内部保存位置或 hash、观察结果、不能推出什么。输出过大或含敏感信息时保存在内部路径，正文只写脱敏的方法与边界。未执行的命令不能列为验证。

先按问题选择最小但足够的验证范围，不要求无条件全量扫描。若计划中的全量扫描未完成，记录失败原因、耗时或资源限制；随后可以缩小输入做受控验证，写明它覆盖什么、没有覆盖什么。只有在**同一个缓存目录**上执行真实 update 并保存前后结果，才称为增量验证。否则只称独立运行或局部验证。

## `notes/public-source-map.md`

公开稿写作前，从 source summary/raw frontmatter 读取 `original_url`、`public_url`、标题、作者、平台；必要时打开原文核对。若用户要求关联旧博客，检索并阅读候选，标记其是前置文章、同主题案例、反向观点还是实践补充。正文只使用其公开 URL。

| 字段 | 记录内容 |
| --- | --- |
| 内部证据 ID | 对应 evidence ledger，不把内部路径复制到 `article.md`。 |
| `internal_evidence` | vault 相对路径、快照、运行日志或源码定位，仅本文件可见。 |
| `public_reference` / `public_status` | 可访问 URL 或完整可发布书目信息；`resolved` / `unresolved` / `first-hand`。 |
| `public_title` / `public_author` / `public_platform` | 原文标题、作者、平台；缺失时写 `unknown`，不猜。 |
| checked date、commit、package version | 对时效敏感的事实记录检查环境和日期。 |
| `related_public_posts` | 已有博客公开 URL 与关系；无则写 `none`。 |
| 正文使用方式 | 直接引用、转述、本文分析或外部核验。 |

来源尚未映射时，不能把 vault 路径放进 `article.md` 顶替引用。首手测量可标 `first-hand`，在文章中写可公开的环境、命令或方法、样本与边界；无需虚构公开 URL。无法安全描述方法或无法复核关键数字时，降低判断强度或移出公开稿。`public_source_status=ready` 要求正文使用的关键来源均有公开映射或合理的首手方法说明。

“别提知识库”“找对应原文或之前博客”“改成可发布文章”“标明原文来源”是结构性修改：重查证据表、公开来源映射、正文引用和编辑/渲染状态，不能只替换几个路径字符串。不要把内部 Wiki、vault 根目录、`00-system`、`10-raw`、`20-wiki`、`.ocf`、`workspace`、`notes`、`artifacts` 或 source fingerprint 暴露到可审阅的 `article.md`。代码示例如果必须描述内部目录，也应在审稿时判断是否适合公开。
