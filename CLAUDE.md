# Topograph Lite

## Tech Stack
- SvelteKit (Svelte 5) with svelte-adapter-bun
- Bun runtime, SQLite (bun:sqlite via Drizzle ORM)
- WebSocket collaboration via Bun's native WS support
- TailwindCSS for styling

## Deployment

Server: `root@veemonula.ee:/sites/topograph-lite.torva.ee/`

**CRITICAL: `app/data/` contains the SQLite database. NEVER delete it.**

The remote shell is **fish** — no heredocs, no rsync available.

### Deploy steps

```bash
# 1. Build locally
bun run build

# 2. Upload build artifacts (do NOT delete app/data/ or app/start.sh)
scp -r build/* root@veemonula.ee:/sites/topograph-lite.torva.ee/app/

# 3. Restart
ssh root@veemonula.ee "cd /sites/topograph-lite.torva.ee && pm2 restart ecosystem.config.js"

# 4. Verify
ssh root@veemonula.ee "curl -s -o /dev/null -w '%{http_code}' http://localhost:3002/"
```

### Important details
- App runs via PM2 (`ecosystem.config.js`), using `start.sh` (bash wrapper: `exec bun index.js`)
- `start.sh` is NOT part of the build output — it must exist on the server already
- No auto-migration: if the DB is new, tables must be created manually from the schema in `src/lib/server/db/schema.ts`
- Logs: `/sites/topograph-lite.torva.ee/logs/pm2-error-0.log`, `pm2-out-0.log`
- Port: 3002, behind nginx

## Git notes
- SvelteKit route files with `[id]` in path need quoting in git commands (e.g., `'src/routes/api/interfaces/[id]/+server.ts'`)
