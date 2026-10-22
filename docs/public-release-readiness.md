# Public release readiness

This is a preparation checklist. Do not change repository visibility or publish a release as part of this documentation work.

## Prepared in the working tree

- English main README and linked Simplified Chinese README.
- Generic setup and usage examples without a machine-specific vault path.
- Clear knowledge-to-article scope, vault selection rule, article artifacts, and script limitations.
- Automated tests for the helper scripts and a Skill metadata validator are available.
- The GitHub repository has an English description and relevant topics; visibility is still private (checked on 2026-10-22).
- The copyright holder approved MIT; `LICENSE` and README links are present.
- Chinese is the intended language for the operational Skill and generated articles; the English README describes this clearly.
- `.gitignore` excludes the default writing-project directory, local environment files, and dependencies.
- A CI workflow is present for Node.js 20 and 22. Its remote result still needs verification after the changes are pushed to the private repository.
- The three existing commits contain only the listed Skill, reference, documentation, script, and test files. A pattern scan found no obvious credentials or author-specific machine paths; historical URLs point only to GitHub and the example.org test fixture. This is not a complete disclosure review.

## Before making the repository public

1. **Run checks from a fresh clone.** Verify installation through a Skill search path, query a new `.ocf/vault.json` vault and a legacy OCF vault, produce a writing project, and run `npm test` and Skill metadata validation.
2. **Verify private CI.** Push the workflow to the private repository and confirm both Node.js jobs pass before changing visibility.
3. **Complete the disclosure review.** Manually inspect the full Git history and release contents for credentials, private URLs, machine-specific paths, unpublished article text, and third-party material that needs attribution. Existing commits expose the author's personal email address; decide whether that is acceptable before making the repository public. Recheck immediately before changing visibility.
4. **Review public-facing maintenance expectations.** Confirm the issue/support policy, compatibility claims, and any first release tag or changelog.
5. **Confirm related project links.** Add direct links to the broader Open Context Forge and companion Skills only when their target pages are publicly accessible.

Keep the visibility decision separate from implementation and documentation commits.
