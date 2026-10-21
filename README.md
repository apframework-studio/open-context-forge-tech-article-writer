# Open Context Forge Tech Article Writer

Language: **English** · [简体中文](README.zh-CN.md)

**Turn knowledge from a selected vault and your own viewpoint into an evidence-backed Chinese technical article.**

Open Context Forge Tech Article Writer is a file-based Agent Skill for the **knowledge-to-article** stage of Open Context Forge. It guides an agent through source retrieval, viewpoint clarification, an argument-driven outline, drafting, style revision, and editorial review. Its output is an article you can inspect and revise, alongside the evidence and decisions used to write it.

The workflow builds on an existing Markdown knowledge vault. The broader Open Context Forge project covers source collection, knowledge compilation, writing, and publishing. This Skill handles writing only. Its emphasis on a structured Wiki, vault purpose, retrieval, and traceable sources is informed by [LLM Wiki](https://github.com/nashsu/llm_wiki/blob/main/README_CN.md).

The operational [SKILL.md](SKILL.md) and its detailed references are currently written in Chinese. This README explains setup and use in English.

## What you need

- An agent that can read this Skill, access the selected vault, and write to a chosen article workspace.
- Node.js 20 or newer for the two optional helper scripts. They have no third-party runtime dependencies.
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

Installation makes the Skill discoverable; it does not select a vault. You can also link it from one repository's `.agents/skills/` directory to limit where it appears.

## Writing workflow

For a full article, the agent follows this chain:

```text
selected vault + your input
→ retrieval and evidence ledger
→ stance card and writing brief
→ outline for your confirmation
→ draft and style revision
→ editorial review
→ article.md
```

If your viewpoint is clear, the agent moves to retrieval and outlining without repeating questions. If a missing decision would change the article's direction, it asks a focused question. The default flow waits for your outline confirmation before writing the full draft. You can explicitly request a direct draft; the writing project records that the outline gate was skipped. Existing approved outlines and drafts can be resumed without restarting the process.

By default, each article goes under the current project's `workspace/writing-projects/<slug>/`. You may choose another project directory or a parent directory for several articles. A full project normally contains:

```text
<slug>/
  project.md
  input/
  notes/evidence-ledger.md
  notes/retrieval.md
  artifacts/stance-card.md
  artifacts/brief.md
  artifacts/outline.md
  artifacts/draft.md
  review/editorial-review.md
  article.md
```

Optional images go in `assets/`. The evidence ledger distinguishes your stated viewpoint, earlier vault claims, source facts, inference, conflicting evidence, and unverified gaps. An existing project with `project.yaml` or `published.md` can be continued without forced migration.

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
  --file /absolute/path/to/writing-project/article.md --json
npm test
```

`vault-query.js` returns matching Markdown candidates, not a generated answer or proof of a claim. `check-article.js` flags unfinished markers, potential local paths, and missing local images, returning a nonzero exit code when it finds an issue. Neither script replaces the agent's review of evidence, argument, and style.

## Scope and project files

This Skill does not import web pages into a vault, compile long-term Wiki notes, commit or push Git changes, or publish to a channel. Those actions require a separate request and workflow. Historical articles are style examples, not text to copy.

- [SKILL.md](SKILL.md) — operational workflow and boundaries.
- [Knowledge and evidence guide](references/knowledge-and-evidence.md) — vault retrieval and source attribution.
- [Article artifacts](references/article-artifacts.md) — writing project contents.
- [Design](docs/design.md) — current feature design.
- [Public release readiness](docs/public-release-readiness.md) — decisions and checks to complete before changing repository visibility.
