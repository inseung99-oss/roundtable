# BYOK deployment and rollback

## Recovery points (before BYOK)

- GitHub branch: `backup/pre-byok-2026-10-22`
- GitHub commit: `f70212a6fc7eab03bd80ccf31ba0ea01ca2f1d03`
- Sites source commit: `82760007dd3184be3b9a58c2e6fd519eb8b375cf`
- Sites saved version: `appgprj_6ad6cb5aa1188191b27e8ca49cf92eb1~appgver_a0a3813384148191ab942ca70807e918` (version 10)
- Site: `appgprj_6ad6cb5aa1188191b27e8ca49cf92eb1`

Republish the exact saved version 10 to roll back the live application. To recover source, start from the backup branch. Do not reset the current working branch or delete user data. The new migration adds only `byok_keys` and `byok_rate`; old code ignores them. Keep the encryption secret unchanged if BYOK may be restored. Application rollback does not undo provider charges or rewind users' conversations. Export personal conversations through the UI before manual data restoration. Never commit private conversation backups or API keys to GitHub.

## BYOK behavior

- Website login remains Sites-managed and workspaces remain owner-scoped.
- New questions call the user's OpenAI, Anthropic, Google or xAI API directly from the server. Legacy MCP routes remain for backward compatibility but cannot claim BYOK jobs.
- Each provider has a user-owned API key and configurable model ID. Model lookup validates before saving; this does not guarantee inference balance or quota.
- Keys use AES-256-GCM with random IV and authenticated owner/provider binding. `BYOK_ENCRYPTION_KEY` is a runtime secret, never a source file. Browser responses expose only the last four key characters and model. Keys are absent from conversation state and exports.
- Requests send project context, up to 40 prior non-demo messages and selected quotes to the selected provider. Maximum prompt size is 160,000 characters and output limit is 4,096 tokens. Normal provider charges apply, separately from chat subscriptions.
- At most four provider requests run concurrently per user, with 20 configuration/generation operations per minute. Atomic job transitions prevent duplicate execution. No automatic retry after timeouts or failures; a provider may have billed an interrupted request.
- Existing completed messages and legacy requests remain. Refreshing can recover saved answers. Expired in-flight BYOK jobs are marked cancelled with an error instead of silently charged again.
- Browser previews use a development-only key. Production has no fake identity or test provider.

## Verification

Run `node --test tests/core.test.mjs tests/server.test.mjs tests/byok.test.mjs`, then `node build-server.mjs` and `node --check dist/server/index.js`.
Provider adapter tests use mocked responses; live paid inference requires the user to register their own API key. Never use another user's keys or fund a shared key automatically.

Failed BYOK jobs reuse the legacy cancelled status and carry a user-facing error; rollback does not introduce unsupported conversation status values.
