---
name: GitHub preview workflow
description: Durable rules for keeping a GitHub-backed preview isolated from the default branch.
---

Use a separate preview branch for local inspection and keep `main` unchanged until a change is intentionally approved. GitHub credentials stored as Replit Secrets are not exposed to the built-in `gitPush` callback, so direct Git operations must use a temporary askpass helper without printing the token. When an Expo web client calls an external API without CORS, route web `/api` requests through a same-origin preview proxy while keeping native API calls direct.

**Why:** The built-in GitHub integration may report missing source-control credentials even when a project secret is present; direct authenticated Git access still works without exposing the secret. Browser CORS can block auth before the API receives the request, while a same-origin proxy preserves the existing API without changing production.

**How to apply:** Verify the remote and target branch with `git ls-remote`, push only the dedicated preview or feature branch, and compare its commit with `origin/main` before reporting completion. Proxy `Set-Cookie` safely for preview sessions and verify a protected request after login.