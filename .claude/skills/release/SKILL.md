---
name: release
disable-model-invocation: true
description: Use this skill when cutting, publishing, or shipping a new release of dataviz-mcp to npm. Use when the user says "cut a release", "release 0.5.0", "ship it", "publish to npm", "create the release", "tag a release", or "do a release". Do not use for opening a pull request (use open-pull-request), editing the publish workflow itself, or plain commits and pushes that are not a release.
---

## Purpose

Take dataviz-mcp from committed-and-pushed `main` to a published GitHub release that auto-publishes to npm. Resolve the next version from commit history, draft the title, confirm both with the user, create the release, then watch the publish run to success and verify the version is live on npm. The publish is irreversible, so never create the release before the user confirms the version and title. Never bump `package.json`: the `publish.yml` workflow derives the version from the tag.

## Workflow

Copy this checklist and track progress:

```text
Release Progress:
- [ ] 1. Pre-flight passed (auth, on main, clean, pushed)
- [ ] 2. Next version resolved from npm + commit history
- [ ] 3. Title drafted
- [ ] 4. Version and title confirmed by the user
- [ ] 5. Release created (bare tag, --target main, --generate-notes)
- [ ] 6. Publish run watched to success; npm version verified
```

### 1. Pre-flight

Stop and report instead of proceeding when any of these fails:

- `gh auth status` succeeds; if not, tell the user to run `! gh auth login` so the interactive flow runs in-session.
- On `main`: `git rev-parse --abbrev-ref HEAD` is `main`. Releases are cut from the default branch only.
- Clean tree: `git status --porcelain` is empty. If dirty, stop and report; a release ships the tagged commit, not your working tree. Do not auto-commit; releasing unreviewed changes is the user's call, not this skill's.
- Local `main` is pushed: run `git push` (a no-op if up to date). This matters because `gh release create --target main` tags `origin/main`'s HEAD on GitHub, so any unpushed local commit is silently excluded from the release.

### 2. Resolve the next version

- Read the last published version from npm, the source of truth: `npm view dataviz-mcp version`. Do not read it off the latest git tag: a GitHub release can exist without a successful publish (0.3.0 failed, so npm jumps 0.2.0 to 0.3.1).
- List the changes since then: `git fetch --tags` then `git log <last-version>..HEAD --oneline`.
- Pick the bump by conventional-commit content. The project is pre-1.0, so:
  - any `feat` (including a breaking `feat!`) raises the minor (`0.4.0` to `0.5.0`); pre-1.0, breaking changes are still minor
  - only `fix` / `ci` / `docs` / `chore` raises the patch (`0.4.0` to `0.4.1`)
  - after the project reaches `1.0.0`, a breaking change raises the major instead
- The version must be strictly greater than the npm version; npm rejects republishing an existing version.
- The tag is bare semver with no `v` prefix (`0.5.0`, never `v0.5.0`), matching every prior tag.

### 3. Draft the title

Format exactly `<version> - <Title Case Summary>`, matching prior releases (`0.4.0 - Histogram, Area, and Bubble Charts`, `0.3.1 - Fix CI Publishing`). Summarize the headline user-facing change since the last release in a few Title Case words. The summary is the headline, not a changelog; the body link covers the full diff.

### 4. Confirm with the user

Show the resolved version and the drafted title and get explicit confirmation before creating. Publishing to npm cannot be undone (a version is permanent and unpublish is restricted after 72 hours), so this is the one mandatory gate.

### 5. Create the release

```shell
gh release create <version> --target main --generate-notes --title "<version> - <Title>"
```

- Bare tag, no `v`. `--generate-notes` produces the "Full Changelog" compare body that every prior release uses; do not hand-write notes.
- This fires `publish.yml`. Do not touch `package.json`; the workflow runs `npm version` from the tag before building.

### 6. Verify the publish

- Find the run: `gh run list --workflow=publish.yml --limit 1 --json databaseId,status -q '.[0]'`.
- Watch it to completion by polling. Do not use `gh run watch`: it polls every few seconds and trips the GitHub API rate limit. Poll a backgrounded until-loop, then report:

```shell
until [ "$(gh run view <id> --json status -q .status)" = "completed" ]; do sleep 15; done
gh run view <id> --json conclusion -q .conclusion
```

- On success, confirm npm shows the new version: `npm view dataviz-mcp version`.
- On failure, read `gh run view <id> --log-failed`. A corrected version needs a new tag and release; re-running the failed run re-checks-out the same tag and npm rejects the duplicate again.

## Guardrails

- Never edit `package.json`'s version or create a `chore(release)` commit; the version is tag-driven.
- Never reuse or go below an existing npm version; npm rejects it and a re-run cannot fix it.
- Never create the release with a dirty tree or unpushed commits on `main`.
- Always use a bare-version tag, never `v`-prefixed.
- Always get the user's confirmation of version and title before creating; the publish is irreversible.

## Gotchas

- **The tag captures `origin/main`, not your local HEAD.** `gh release create --target main` tags the remote's main, so unpushed local commits are excluded from the release silently. Push in pre-flight before creating.
- **npm is the version source of truth, not git tags.** A GitHub release can exist with no successful publish (0.3.0), so the latest tag may overstate what shipped. Resolve the next version from `npm view`, never from the newest tag.
- **A failed publish cannot be retried in place.** Re-running the run re-checks-out the same tag and version; npm still rejects the duplicate. Cut a new patch version instead.
- **`gh run watch` is rate-limited in this environment.** It polls every few seconds and trips the API cap. Poll a backgrounded until-loop or take single `gh run view` snapshots.
- **Hand-written release notes break the pattern.** Every release body is `--generate-notes` output; a custom body diverges from the established compare-link format.

## Example

Cutting `0.5.0` after a batch of feature work merged to `main`:

```shell
gh auth status                                  # pre-flight
git rev-parse --abbrev-ref HEAD                 # main
git status --porcelain                          # empty
git push                                         # sync main

npm view dataviz-mcp version                     # 0.4.0 (last published)
git fetch --tags && git log 0.4.0..HEAD --oneline   # feat: add radar chart -> minor bump

# Propose "0.5.0" + title "0.5.0 - Radar Chart", confirm with the user, then:
gh release create 0.5.0 --target main --generate-notes --title "0.5.0 - Radar Chart"

# Watch publish.yml, then verify:
npm view dataviz-mcp version                     # 0.5.0
```
