---
name: GitHub preview workflow
description: Durable rules for keeping a GitHub-backed preview isolated from the default branch.
---

Use a separate preview branch for local inspection and keep `main` unchanged until a change is intentionally approved. GitHub credentials stored as Replit Secrets are not exposed to the built-in `gitPush` callback, so direct Git operations must use a temporary askpass helper without printing the token.

**Why:** The built-in GitHub integration may report missing source-control credentials even when a project secret is present; direct authenticated Git access still works without exposing the secret.

**How to apply:** Verify the remote and target branch with `git ls-remote`, push only the dedicated preview or feature branch, and compare its commit with `origin/main` before reporting completion.