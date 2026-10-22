# Open Context Forge Tech Article Writer

语言：[English](README.md) · **简体中文**

一个面向中文技术写作的 Agent Skill：从指定 Markdown 知识库读取已有判断、资料来源和风格线索，经过立场澄清、证据整理、大纲、写作与审稿，形成可审阅文章。

它承接 Open Context Forge 的 `vault knowledge → writing project → reviewed article` 阶段。知识库摄入与编译由 Open Context Forge Vault Maintainer 负责；渠道发布由独立发布流程处理。设计参考 [LLM Wiki](https://github.com/nashsu/llm_wiki/blob/main/README_CN.md) 对 purpose、结构化 Wiki、检索和来源追溯的做法，当前仓库只实现知识库到文章的链路。

## 使用条件

- Agent 能读取本 Skill、访问选定的 vault，并写入文章工作区。
- 运行两个可选辅助脚本需要 Node.js 20 或更新版本；脚本没有第三方运行时依赖。
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

用户给出明确立场时，Skill 会直接组织来源和大纲；立场会影响文章方向但仍缺失时，才会集中追问。完整文章默认在大纲确认后写正文。若明确说“直接成稿”，会记录跳过确认的原因并继续。只要大纲、改写或审稿也可从对应阶段开始。

完整写作链路是：

```text
指定知识库 + 用户输入
→ 检索与证据表
→ 立场卡与写作 brief
→ 供用户确认的大纲
→ 草稿与风格修订
→ 编辑审查
→ article.md
```

默认输出目录是当前项目的 `workspace/writing-projects/<slug>/`；用户可以指定其他目录。完整项目通常包含 `notes/evidence-ledger.md`、`artifacts/stance-card.md`、`brief.md`、`outline.md`、`draft.md`、`review/editorial-review.md` 和 `article.md`。原始输入、检索记录与必要图片也保留在项目内。知识库默认只读。

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
node scripts/check-article.js --file /absolute/path/to/project/article.md --json
npm test
```

检索脚本只给候选路径，不判断笔记是否真的支持文章观点。成稿检查可发现未完成标记、常见本机路径和缺失的本地图片；证据、论证、风格仍需按 Skill 审查。`check-article.js` 有阻断项时返回非零退出码。

## 范围

本 Skill 不自动把网页导入知识库、不回填 Wiki、不执行 Git 提交、不发布文章。需要这些动作时，明确提出并交给对应能力处理。历史文章用于观察写作风格，不作为可直接复制的文本素材。详细操作指令目前以中文写在 [SKILL.md](SKILL.md) 及 `references/` 中。

## 项目文件

- [SKILL.md](SKILL.md)：写作入口、工作流和交付边界。
- [references/knowledge-and-evidence.md](references/knowledge-and-evidence.md)：知识库检索与证据整理。
- [references/article-artifacts.md](references/article-artifacts.md)：写作项目的产物契约。
- [docs/design.md](docs/design.md)：功能设计。
- [docs/public-release-readiness.md](docs/public-release-readiness.md)：公开前待办；仓库目前不进行公开发布。

## 许可证

[MIT](LICENSE)。
