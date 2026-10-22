CREATE TABLE IF NOT EXISTS byok_keys (owner TEXT NOT NULL, provider TEXT NOT NULL, encrypted_key TEXT NOT NULL, last4 TEXT NOT NULL, model TEXT NOT NULL, updated_at TEXT NOT NULL, PRIMARY KEY(owner,provider));
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS byok_rate (owner TEXT PRIMARY KEY NOT NULL, window INTEGER NOT NULL, count INTEGER NOT NULL);
