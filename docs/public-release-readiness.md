# Public release readiness

This is a preparation checklist. Do not change repository visibility or publish a release as part of this documentation work.

## Prepared in the working tree

- English main README and linked Simplified Chinese README.
- Generic setup and usage examples without a machine-specific vault path.
- Clear knowledge-to-article scope, vault selection rule, article artifacts, and script limitations.
- Automated tests for the helper scripts and a Skill metadata validator are available.

## Before making the repository public

1. **Choose a license.** This repository currently has no `LICENSE` file. Do not assume that a sibling project's MIT license applies here.
2. **Decide on the instruction language.** `SKILL.md` and `references/` are in Chinese. Keep that as an intentional requirement or provide an English operational version; an English README alone does not make the Skill usable in English.
3. **Run checks from a fresh clone.** Verify installation through a Skill search path, query a new `.ocf/vault.json` vault and a legacy OCF vault, produce a writing project, and run `npm test` and Skill metadata validation.
4. **Add and verify CI if desired for release.** Run at least the Node.js tests on the supported Node versions, then check the workflow result in the private repository.
5. **Audit the full Git history and release contents.** Look for credentials, private URLs, machine-specific paths, unpublished article text, and third-party material that needs attribution. Recheck immediately before changing visibility.
6. **Review public-facing maintenance expectations.** Confirm the repository description, issue/support policy, compatibility claims, and any first release tag or changelog.
7. **Confirm related project links.** Add direct links to the broader Open Context Forge and companion Skills only when their target pages are publicly accessible.

Keep the visibility decision separate from implementation and documentation commits.
