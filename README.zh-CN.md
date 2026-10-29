# Open Context Forge Tech Article Writer

语言：[English](README.md) · **简体中文**

一个面向中文技术写作的 Agent Skill：从指定 Markdown 知识库读取已有判断、资料来源和风格线索，按文章模式经过证据整理、大纲、写作、视觉验证与审稿，形成可审阅文章。分析稿不要求作者先表态。

它承接 Open Context Forge 的 `vault knowledge → writing project → reviewed article` 阶段。知识库摄入与编译由 Open Context Forge Vault Maintainer 负责；渠道发布由独立发布流程处理。设计参考 [LLM Wiki](https://github.com/nashsu/llm_wiki/blob/main/README_CN.md) 对 purpose、结构化 Wiki、检索和来源追溯的做法，当前仓库只实现知识库到文章的链路。

## 使用条件

- Agent 能读取本 Skill、访问选定的 vault，并写入文章工作区。
- 运行辅助脚本需要 Node.js 20 或更新版本；脚本没有第三方运行时依赖。
- 每次任务都要明确指定 vault。若提供网页链接，Agent 还需要具备读取网页正文的能力；脚本本身不会抓取网页。

普通写作默认只读知识库。草稿、证据表和审稿记录保存在独立 writing project 中，不写入 vault。

## 使用

让支持 Agent Skills 的智能体读取仓库根目录的 [SKILL.md](SKILL.md)，并在请求中指定 vault。若希望以后通过 Skill 名称调用，可将**整个仓库**链接到个人 Skill 目录，保留同目录的 `scripts/` 与 `references/`：

```bash
mkdir -p "$HOME/.agents/skills"
ln -s "/absolute/path/to/open-context-forge-tech-article-writer" "$HOME/.agents/skills/open-context-forge-tech-article-writer"
```

例如：

> 使用 `$open-context-forge-tech-article-writer`，基于 `/absolute/path/to/my-vault` 中的知识与风格资料，写一篇关于 Agent 记忆的中文技术文章。我的判断是：可靠性更依赖可追溯的上下文组织，而不是更长的对话历史。写作项目放在 `/absolute/path/to/writing-projects`。

中立分析也可以直接要求：

> 使用 `$open-context-forge-tech-article-writer`，基于 `/absolute/path/to/my-vault` 陈述和分析 Thin Orchestrator 的机制与边界，不做观点倾向。

`article_mode` 支持 `analysis`、`opinion`、`tutorial`、`review`、`case-study`。明确要求“陈述和分析，不做观点倾向”时使用 `analysis`；来源主张和大纲候选推论不会自动变成作者观点。“思路 ok，但文章内容不 ok”通常触发全文重写并保存旧稿；若同时明确限制“小幅修改”，则遵守该范围。`output_intent` 区分内部笔记、可审阅稿、公开稿与渠道交接；`edit_scope` 区分只读、校对、局部、结构调整和全文重写。

请求方向明确时，Skill 会直接组织来源和大纲；缺失的信息会改变文章方向时，才会集中追问。完整文章默认在大纲确认后写正文。若明确说“直接成稿”，会记录跳过确认的原因并继续。只要大纲、改写或审稿也可从对应阶段开始。

完整写作链路是：

```text
指定知识库 + 用户输入
→ 检索与证据表
→ 关键判断清单与有限验证记录
→ 与模式对应的写作框架卡与 brief
→ 供用户确认的大纲
→ 草稿与风格修订
→ 公开来源映射、编辑与渲染审查
→ article.md
```

默认输出目录是当前项目的 `workspace/writing-projects/<slug>/`；用户可以指定其他目录。完整项目通常包含 `notes/evidence-ledger.md`、`notes/claim-register.md`、必要时的验证日志与公开来源映射、写作框架、大纲、草稿、渲染和审稿记录及 `article.md`。新制作图示时增加 `artifacts/diagram-spec.md`、可编辑源文件和目标渲染器支持的成稿图；交给 Publisher 时增加 `artifacts/publisher-handoff.md`。知识库默认只读。

项目分别记录正文、证据、公开来源、视觉、渲染和审稿状态。只有正文、证据、必要图示与嵌入、目标渲染器预览、审稿全部完成，才报告“完整文章完成”；公开来源也完成才称“公开就绪”。渠道构建和上线仍由 Publisher 独立验证。

## 知识库兼容

| Vault | 识别方式 | 检索位置 |
| --- | --- | --- |
| 新版 OCF | `.ocf/vault.json` | profile 的 `paths.wiki` 与 `paths.sources` |
| 旧版 OCF | `20-wiki/` | `20-wiki/`，必要时回溯 `10-raw/` |

写作时还会读取目标 vault 的 purpose、schema、索引和风格资料。使用多个 vault 时，应在每次写作请求中指明目标；路径不会被写死在 Skill 中。旧版写作项目里的 `project.yaml` 或 `published.md` 可以续写，不要求一次性迁移。

## 辅助命令

需要 Node.js 20+，无第三方运行时依赖。在本仓库根目录运行：

```bash
node scripts/vault-query.js --vault /absolute/path/to/vault --query "Agent 记忆" --json
node scripts/vault-query.js --vault /absolute/path/to/vault --query "Agent 记忆" --include-sources --json
node scripts/check-article.js --file /absolute/path/to/project/article.md --intent public_article --project /absolute/path/to/project --json
node scripts/project-state.js --project /absolute/path/to/project --change body
npm test
```

检索脚本只给候选路径，不判断笔记是否真的支持文章判断。成稿检查覆盖常见单行 Markdown 图片和 HTML `<img>`，可发现未完成标记、内部路径、未解析 wikilink、裸尖括号 URL、异常图片引用、基础 PNG 损坏和旧版审稿/渲染 hash；P0 阻断项返回非零退出码。状态脚本在产物改变后回退受影响的检查状态。两者不能判断事实真假或代替目标渠道的实际渲染，仍需打开成稿检查并记录。

## 范围

本 Skill 不自动把网页导入知识库、不回填 Wiki、不执行 Git 提交、不发布文章。需要这些动作时，明确提出并交给对应能力处理。历史文章用于观察写作风格，不作为可直接复制的文本素材。详细操作指令目前以中文写在 [SKILL.md](SKILL.md) 及 `references/` 中。

## 项目文件

- [SKILL.md](SKILL.md)：写作入口、工作流和交付边界。
- [references/knowledge-and-evidence.md](references/knowledge-and-evidence.md)：知识库检索与证据整理。
- [references/article-artifacts.md](references/article-artifacts.md)：写作项目的产物契约。
- [references/article-modes.md](references/article-modes.md)：文章模式、判断归属与全文重写。
- [references/task-and-state.md](references/task-and-state.md)：任务意图、修改权限与状态回退。
- [references/claims-and-public-sources.md](references/claims-and-public-sources.md)：关键判断、验证与公开来源。
- [docs/graphify-scope.md](docs/graphify-scope.md)：Graphify 反馈的本轮采纳范围。
- [docs/design.md](docs/design.md)：功能设计。
- [docs/thin-orchestrator-feedback.md](docs/thin-orchestrator-feedback.md)：本次反馈的采纳与待积累项。
- [docs/public-release-readiness.md](docs/public-release-readiness.md)：公开前检查记录。

## 许可证

[MIT](LICENSE)。
