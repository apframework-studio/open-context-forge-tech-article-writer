# Open Context Forge Tech Article Writer

Language: **English** · [简体中文](README.zh-CN.md)

**Turn knowledge from a selected vault into an evidence-backed Chinese technical article, with or without an author viewpoint.**

Open Context Forge Tech Article Writer is a file-based Agent Skill for the **knowledge-to-article** stage of Open Context Forge. It guides an agent through source retrieval, mode selection, an outline, drafting, style revision, visual checks, and editorial review. Its output is an article you can inspect and revise, alongside the evidence and decisions used to write it.

The workflow builds on an existing Markdown knowledge vault. The broader Open Context Forge project covers source collection, knowledge compilation, writing, and publishing. This Skill handles writing only. Its emphasis on a structured Wiki, vault purpose, retrieval, and traceable sources is informed by [LLM Wiki](https://github.com/nashsu/llm_wiki/blob/main/README_CN.md).

The operational [SKILL.md](SKILL.md) and its detailed references are currently written in Chinese. This README explains setup and use in English.

## What you need

- An agent that can read this Skill, access the selected vault, and write to a chosen article workspace.
- Node.js 20 or newer for the helper scripts. They have no third-party runtime dependencies.
- A **specific vault path** for each task. If you provide source URLs, the agent also needs a way to read those pages; the scripts do not fetch web content.

The vault is read-only during ordinary writing. Article drafts and review notes belong in a separate writing project. The Skill does not choose a vault from recent history or from the location where it was installed.

## Use it in a conversation

You can ask an agent to read this repository's `SKILL.md` by path without installing the Skill. Replace the example paths with your own:

> Read `/absolute/path/to/open-context-forge-tech-article-writer/SKILL.md`. Use the knowledge and style notes in `/absolute/path/to/my-vault` to write a Chinese technical article about agent memory. My viewpoint is that reliability depends more on traceable context than on a longer chat history. Put the writing project under `/absolute/path/to/writing-projects`.

To invoke it by name in Codex, link the **whole repository** into your Skill directory so `SKILL.md`, `references/`, and `scripts/` stay together:

```bash
mkdir -p "$HOME/.agents/skills"
ln -s "/absolute/path/to/open-context-forge-tech-article-writer" \
  "$HOME/.agents/skills/open-context-forge-tech-article-writer"
```

Then ask:

> Use `$open-context-forge-tech-article-writer` with `/absolute/path/to/my-vault` to prepare an outline for a Chinese technical article about agent memory. My main argument is that traceable context matters more than conversation length.

For a neutral article, say so directly:

> Use `$open-context-forge-tech-article-writer` with `/absolute/path/to/my-vault` to analyze Thin Orchestrator. Describe its mechanism and limits without taking an opinionated position.

The Skill records `article_mode` as `analysis`, `opinion`, `tutorial`, `review`, or `case-study`. An explicit request to describe and analyze without a viewpoint selects `analysis`; source claims and outline hypotheses are not treated as your position. Feedback such as “the direction is right, but the article content is not” normally starts a full rewrite while preserving the earlier draft. An explicit limit such as “only make small edits” takes precedence.

It also records `output_intent` (`internal_note`, `reviewable_article`, `public_article`, or `channel_publish`) and `edit_scope` (`read-only`, `copyedit`, `local`, `structural`, or `full-rewrite`). “Do not edit” locks all project writes. Confirmed choices are reused instead of requested again.

Installation makes the Skill discoverable; it does not select a vault. You can also link it from one repository's `.agents/skills/` directory to limit where it appears.

## Writing workflow

For a full article, the agent follows this chain:

```text
selected vault + your input
→ retrieval and evidence ledger
→ critical claim register and scoped verification log
→ mode-aware writing frame and brief
→ outline for your confirmation
→ draft and style revision
→ public source mapping, editorial and renderer review
→ article.md
```

If your request is clear, the agent moves to retrieval and outlining without repeating questions. It asks about a missing decision only when that would change the article's direction. The default flow waits for your outline confirmation before writing the full draft. You can explicitly request a direct draft; the writing project records that the outline gate was skipped. Existing approved outlines and drafts can be resumed without restarting the process.

By default, each article goes under the current project's `workspace/writing-projects/<slug>/`. You may choose another project directory or a parent directory for several articles. A full project normally contains:

```text
<slug>/
  project.md
  input/
  notes/evidence-ledger.md
  notes/claim-register.md
  notes/verification-log.md # when running checks
  notes/public-source-map.md # for reviewable or public articles
  notes/retrieval.md
  artifacts/stance-card.md
  artifacts/brief.md
  artifacts/outline.md
  artifacts/draft.md
  artifacts/diagram-spec.md  # when creating diagrams
  artifacts/publisher-handoff.md # when handing off to Publisher
  assets/                   # when using images
  review/render-check.md
  review/editorial-review.md
  article.md
```

New diagrams are specified in `diagram-spec.md`, retain an editable source, and use a final format supported by the target renderer. The diagram record distinguishes conceptual diagrams, implementation diagrams, runtime screenshots, and measurement charts. The evidence ledger separates source claims, observed results, analysis hypotheses, and confirmed author positions. An existing project with `project.yaml` or `published.md` can be continued without forced migration.

The project tracks content, evidence, public sources, visual, render, and editorial status separately. “Article complete” means the text, evidence, and required visuals are ready, the Markdown and images have been opened in the target renderer, and editorial review has passed. “Public ready” also requires a public reference map. A writing project does not claim that the destination blog has built or gone live; Publisher reports those stages separately.

## Vault compatibility

| Vault layout | How it is identified | Where knowledge is read |
| --- | --- | --- |
| Current OCF vault | `.ocf/vault.json` | `paths.wiki` and, when needed, `paths.sources` from the profile |
| Legacy OCF vault | `20-wiki/` | `20-wiki/`, with `10-raw/` for source checks |

The agent also reads the selected vault's purpose, schema, index, and relevant style notes when available. Search results are only candidates: the agent must open the notes and check whether the cited material supports each article claim. Vault-specific conventions take precedence over assumptions about folder names.

## Run the helper scripts

Run these commands from this repository's root, or use absolute paths to the scripts:

```bash
node scripts/vault-query.js --vault /absolute/path/to/vault \
  --query "agent memory" --json
node scripts/vault-query.js --vault /absolute/path/to/vault \
  --query "agent memory" --include-sources --json
node scripts/check-article.js \
  --file /absolute/path/to/writing-project/article.md \
  --intent public_article --project /absolute/path/to/writing-project --json
node scripts/project-state.js --project /absolute/path/to/writing-project --change body
npm test
```

`vault-query.js` returns matching Markdown candidates, not a generated answer or proof of a claim. `check-article.js` flags unfinished markers, internal paths, unresolved wikilinks, MDX-sensitive angle URLs, image references, basic PNG damage, and stale review/render hashes. It reports P0/P1/P2/INFO counts and exits nonzero on P0. `project-state.js` updates state after a change and invalidates affected approvals; setting a review or render pass records the current article hash. These checks do not parse all Markdown, assess claim truth, or prove visual rendering. The agent must preview the article in its target renderer and review evidence and style.

## Scope and project files

This Skill does not import web pages into a vault, compile long-term Wiki notes, commit or push Git changes, or publish to a channel. Those actions require a separate request and workflow. Historical articles are style examples, not text to copy.

- [SKILL.md](SKILL.md) — operational workflow and boundaries.
- [Knowledge and evidence guide](references/knowledge-and-evidence.md) — vault retrieval and source attribution.
- [Article artifacts](references/article-artifacts.md) — writing project contents.
- [Article modes](references/article-modes.md) — genre, claim ownership, and full rewrite behavior.
- [Task and state contract](references/task-and-state.md) — output intent, edit scope, state transitions, and publication boundary.
- [Claims and public sources](references/claims-and-public-sources.md) — claim register, verification log, and public source map.
- [Design](docs/design.md) — current feature design.
- [Graphify feedback scope](docs/graphify-scope.md) — adopted changes and deferred responsibilities.
- [Thin Orchestrator feedback](docs/thin-orchestrator-feedback.md) — adopted refinements and ideas being accumulated.
- [Public release readiness](docs/public-release-readiness.md) — decisions and checks to complete before changing repository visibility.

## License

[MIT](LICENSE).
