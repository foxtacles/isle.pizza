import { Hono } from "hono";
import type { Env, Variables } from "./auth";

interface SaveRow {
	filename: string;
	data: ArrayBuffer;
}

interface ConfigRow {
	ini_text: string;
}

const VALID_SAVE_FILES = new Set([
	"G0.GS", "G1.GS", "G2.GS", "G3.GS", "G4.GS",
	"G5.GS", "G6.GS", "G7.GS", "G8.GS",
	"Players.gsi", "History.gsi",
]);

const MAX_SAVE_SIZE = 100 * 1024; // 100 KB per file

function base64ToArrayBuffer(base64: string): ArrayBuffer {
	const binary = atob(base64);
	const bytes = new Uint8Array(binary.length);
	for (let i = 0; i < binary.length; i++) {
		bytes[i] = binary.charCodeAt(i);
	}
	return bytes.buffer;
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
	const bytes = new Uint8Array(buffer);
	let binary = "";
	for (let i = 0; i < bytes.length; i++) {
		binary += String.fromCharCode(bytes[i]);
	}
	return btoa(binary);
}

function buildSaveBatch(
	db: D1Database,
	userId: string,
	saves: Array<{ filename: string; data: string }>
): D1PreparedStatement[] {
	const batch: D1PreparedStatement[] = [];
	const stmt = db.prepare(
		"INSERT OR REPLACE INTO user_saves (user_id, filename, data) VALUES (?, ?, ?)"
	);

	for (const save of saves) {
		if (!VALID_SAVE_FILES.has(save.filename)) continue;
		if (typeof save.data !== "string") continue;
		try {
			const buffer = base64ToArrayBuffer(save.data);
			if (buffer.byteLength > MAX_SAVE_SIZE) continue;
			batch.push(stmt.bind(userId, save.filename, buffer));
		} catch {
			continue;
		}
	}

	return batch;
}

const cloud = new Hono<{ Bindings: Env; Variables: Variables }>();

// Sync saves on login
cloud.post("/saves/sync", async (c) => {
	const session = c.get("session");

	// Check if server has existing saves
	const existing = await c.env.DB.prepare(
		"SELECT filename, data FROM user_saves WHERE user_id = ?"
	)
		.bind(session.user.id)
		.all<SaveRow>();

	if (existing.results.length > 0) {
		// Server has data — return it (sign-in: cloud overrides local)
		return c.json({
			saves: existing.results.map((r) => ({
				filename: r.filename,
				data: arrayBufferToBase64(r.data),
			})),
		});
	}

	// Server has no data — store what client sends (sign-up: local uploads)
	const body = await c.req.json<{
		saves: Array<{ filename: string; data: string }>;
	}>();

	if (!Array.isArray(body.saves)) {
		return c.json({ error: "Invalid saves array" }, 400);
	}

	const batch = buildSaveBatch(c.env.DB, session.user.id, body.saves);
	if (batch.length > 0) {
		await c.env.DB.batch(batch);
	}

	return c.json({ saves: [] });
});

// Upload save files (incremental, supports single or batch)
cloud.post("/saves", async (c) => {
	const session = c.get("session");

	const body = await c.req.json<{
		filename?: string;
		data?: string;
		saves?: Array<{ filename: string; data: string }>;
	}>();

	// Support both single file and batch format
	const files = body.saves || (body.filename ? [{ filename: body.filename, data: body.data! }] : []);

	if (files.length === 0) {
		return c.json({ error: "No files provided" }, 400);
	}

	const batch = buildSaveBatch(c.env.DB, session.user.id, files);
	if (batch.length > 0) {
		await c.env.DB.batch(batch);
	}

	return c.json({ ok: true });
});

// Sync config on login
cloud.post("/config/sync", async (c) => {
	const session = c.get("session");

	// Check if server has existing config
	const existing = await c.env.DB.prepare(
		"SELECT ini_text FROM user_config WHERE user_id = ?"
	)
		.bind(session.user.id)
		.first<ConfigRow>();

	if (existing) {
		// Server has data — return it
		return c.json({ config: existing.ini_text });
	}

	// Server has no data — store what client sends
	const body = await c.req.json<{ config: string }>();

	if (typeof body.config !== "string") {
		return c.json({ error: "Invalid config" }, 400);
	}

	await c.env.DB.prepare(
		"INSERT OR REPLACE INTO user_config (user_id, ini_text) VALUES (?, ?)"
	)
		.bind(session.user.id, body.config.slice(0, 65536))
		.run();

	return c.json({ config: null });
});

// Upload config (incremental)
cloud.post("/config", async (c) => {
	const session = c.get("session");

	const body = await c.req.json<{ config: string }>();

	if (typeof body.config !== "string") {
		return c.json({ error: "Invalid config" }, 400);
	}

	await c.env.DB.prepare(
		"INSERT OR REPLACE INTO user_config (user_id, ini_text) VALUES (?, ?)"
	)
		.bind(session.user.id, body.config.slice(0, 65536))
		.run();

	return c.json({ ok: true });
});

export { cloud };
