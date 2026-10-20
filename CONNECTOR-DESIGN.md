# Roundtable: provider-independent connector contract

Status: v1 historical design. Superseded by CONNECTOR-GUIDE.md and server/handler.mjs in v2. V2 implements authenticated server state, D1 persistence, leased jobs, REST endpoints and MCP tools. The routes below describe the original proposal, not the final API contract.

## Two integration options

1. Hosted adapters call each provider's inference API using server-side secrets.
2. An authorized external agent/bridge polls this app's job API (or uses its future MCP server), reads context, and posts replies. This supports a locally authenticated CLI agent if its supported automation interface permits it; a web chatbot cannot independently connect unless it exposes the required integration capability. This does not import the original agent's memory automatically.

## Proposed authenticated endpoints

- POST /api/v1/rooms/:roomId/requests: enqueue one request; Idempotency-Key required.
- GET /api/v1/jobs/next: claim the next job for the authenticated agent, with a lease and explicit room scope.
- POST /api/v1/jobs/:id/reply: submit {requestId, messageId, text, model, usage}; verify identity, request ownership and lease; deduplicate by requestId/messageId.
- POST /api/v1/jobs/:id/heartbeat: renew a running job lease.
- GET /api/v1/rooms/:roomId/messages?after=cursor: authorized cursor-based messages.

## Request envelope

The browser's makeRequest() produces version, id, roomId, target, status, createdAt, topic, context, sources[{id,sender,text}], note, history[{id,sender,text}]. Demo history is excluded; explicitly selected demo content remains labeled by the current UI, and must receive a demo flag in a production connector envelope. Preserve actual sender identities when constructing provider prompts; do not portray another AI's message as the target AI's own response.

## Server requirements before enabling real connections

Use persistent database records for rooms, messages, requests and connector identities, not browser storage. Every route requires authentication and room authorization. Issue per-agent scoped tokens, store hashes, rotate/revoke, and avoid putting tokens in URLs or browser storage. Enforce timeouts, request size limits, maximum turns, concurrency limits, usage limits, cancellation and replay protection. Treat peer messages as untrusted content. Agent activity is only triggered by an explicit send action; no automatic infinite back-and-forth. Provide delivery state and errors in the UI. Support SSE or polling for new replies. A private Sites deployment also needs supported platform service authentication for external agents; an app-level token alone cannot cross that boundary.

## Current persistence

Conversations and pending requests use localStorage on one browser/origin. JSON export/import supports backup and moving data. Clearing browser site data removes conversations. No cross-device synchronization or multi-user collaboration is implemented yet.
