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
  assets/                 # 只在实际需要图片时建立
  review/editorial-review.md
  article.md
```

`project.md` 记录主题、目标读者、体裁、选定 vault 的绝对路径、写作目录、当前阶段、大纲确认事实、运行中发现的缺口。保存用户原始输入，避免对其观点二次转述后失真。若旧项目已有 `project.yaml`、`published.md`，读取原状态并续写，不机械替换。

## 产物内容

`notes/retrieval.md`：检索词、候选笔记、实际采用与排除的理由、来源回溯和风格样本。`notes/evidence-ledger.md` 的字段见 [知识检索与证据](knowledge-and-evidence.md)。

`artifacts/stance-card.md`：一句核心判断、反对的常见看法、为何值得写、证据与反例、适用边界、读者变化。作者没有表达过的判断标记为候选，不能归给作者。

`artifacts/brief.md`：写作目标、读者、核心立场、资料范围、历史知识连接、证据强弱、知识空白、篇幅/体裁/风格约束和大纲策略。后续写作者只读 brief 与证据表也能理解任务。

`artifacts/outline.md`：每节的目的、关键判断、使用的证据 ID、与主线的关系，以及有实际解释价值的图表。记录用户确认的时间或原话；如果用户明确直写，记录直写指令。确认大纲后再根据它写完整长文。

`artifacts/draft.md`：正文与局部待验证标记，保留编辑空间；遇到不可靠材料，先改写为有限判断或留在证据表，不在公开正文制造确定性事实。

`review/editorial-review.md`：审稿结论、P0/P1/P2、已修复项、剩余限制及最终检查结果。`article.md` 是审稿后的可审阅文章，不含内部过程说明、本机绝对路径和未完成占位符。引用使用读者可访问的 URL、完整书目信息或可随文章交付的来源说明；内部 vault 相对路径保留在证据表。

短任务允许合并立场卡与 brief；`review-only` 可只留下审稿记录。若用户需要下游旧版 publisher 的 `published.md`，从审稿后的 `article.md` 生成兼容文件并交由 publisher 转换渠道格式。
