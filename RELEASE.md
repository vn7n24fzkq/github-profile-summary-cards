# Release Process

This repository ships **two artifacts** from a single `release` branch:

-   **Web API** — the SVG service on Vercel (`github-profile-summary-cards.vercel.app`).
-   **GitHub Action** — consumed via `vn7n24fzkq/github-profile-summary-cards@<tag>`.

## Deploy vs. Release — two different events

A **deploy** puts code in front of web users. A **release** is a versioned,
user-facing announcement (a tag + GitHub Release — the notification channel
Action consumers and watchers subscribe to). Coupling them turns every hotfix
into release noise, so there are two dispatches:

| Workflow                                  | What it does                                                                | When to use                                                               |
| ----------------------------------------- | --------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| **Deploy (no release)** (`deploy.yml`)    | main → `release` branch → Vercel production. **No tag, no GitHub Release.** | Hotfixes, internal iterations, anything web users should get now          |
| **Manual Release** (`manual-release.yml`) | Same deploy **plus** tag + GitHub Release with notes                        | A meaningful batch of changes worth announcing — write the notes properly |

Rule of thumb: deploy as often as needed; release when the accumulated changes
tell a story. Quiet deploys don't bump `package.json` — the next real release
picks a version covering everything since the last tag.

Note: every production deploy wipes the CDN cache (a cold-start invocation
surge on the free budget) — batch merges before deploying rather than deploying
per-merge.

## Branch model

```
feature branch ──PR──▶ main ──(Manual Release dispatch)──▶ release ──▶ Vercel production
                        │                                    └──▶ git tag + GitHub Release
                        └── pushes / PRs only create Vercel PREVIEW deployments
```

-   **`main`** is the development / integration branch. It runs CI and produces
    Vercel **preview** deployments only — it never deploys to production.
-   **`release`** is machine-managed. **Never commit to it by hand**; the release
    workflow force-recreates it from `main` on every release.
-   **`dist/`** (the bundled action) is built in CI and lives on `release` and on
    tags — not on `main`.

## One-time setup (already configured)

-   Vercel **Production Branch** = `release`
-   **Fluid Compute** enabled on the Vercel project
-   `.github/workflows/manual-release.yml` present on `main`

## Quiet deploy (no release)

1. Merge into `main` via PRs as usual.
2. On GitHub: **Actions → Deploy (no release) → Run workflow**.
3. Verify the Vercel production deployment is `Ready` and spot-check a card.

## Cutting a release

1. Merge everything you want to ship into `main` (via PRs, as usual).
2. Bump the `version` field in `package.json` to match the tag you plan to cut,
   and merge it.
3. On GitHub: **Actions → Manual Release → Run workflow**, enter the `tag_name`
   (e.g. `v0.8.0`), and run it.
4. Verify (see below).

The workflow then:

-   checks out `main`, runs `npm ci` → `npm run build` → `npm run package`
    (produces `dist/`),
-   recreates the `release` branch with the fresh `dist/` and force-pushes it,
    which **triggers the Vercel production deployment**,
-   creates the git **tag** and a **GitHub Release** with auto-generated notes
    (`generate_release_notes`) covering commits since the previous tag.

## Versioning

Versions are chosen manually, following
[Conventional Commits](https://www.conventionalcommits.org/):

-   a `feat:` since the last tag → **minor** bump (`0.7.x` → `0.8.0`)
-   only `fix:` / `chore:` → **patch** bump (`0.8.0` → `0.8.1`)

Keep `package.json`'s `version` in sync with the tag you dispatch.

## Verifying a release

-   **Vercel** — the new production deployment is `Ready`.
-   **GitHub** — the new tag and Release appear under Releases.
-   **Analytics (optional)** — GA4 → Realtime: request a card and confirm the event
    arrives. Standard reports lag 24–48h, and events fire only on a cache miss, so
    the numbers are a lower bound (good for trends).

## Rollback

-   **Fastest:** Vercel dashboard → project → Deployments → **Instant Rollback** to
    the previous good production deployment.
-   **Code-level:** revert the offending commit(s) on `main`, then cut a new release.

## Action consumers

Pin a tag, not a branch:

```yaml
- uses: vn7n24fzkq/github-profile-summary-cards@v0.8.0
```
