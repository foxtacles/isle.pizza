import { Hono } from "hono";
import type { Env } from "./auth";

type AuthSession = {
	user: { id: string };
};

type Variables = {
	session: AuthSession;
};

/** Row shape returned by queries on memory_completions */
interface CompletionRow {
	user_id: string;
	object_id: number;
	event_id: string;
	completed_at: number;
	char_index: number;
	display_name: string;
	participants: string;
}

function getUserCompletions(db: D1Database, userId: string) {
	return db
		.prepare(
			"SELECT object_id, event_id, completed_at, char_index, display_name, participants FROM memory_completions WHERE user_id = ? ORDER BY completed_at DESC"
		)
		.bind(userId)
		.all<CompletionRow>();
}

function isValidCompletion(c: {
	objectId: unknown;
	eventId: unknown;
	charIndex?: unknown;
	displayName?: unknown;
}): boolean {
	if (
		typeof c.objectId !== "number" ||
		!Number.isInteger(c.objectId) ||
		c.objectId < 0
	)
		return false;
	if (typeof c.eventId !== "string" || c.eventId.length > 16) return false;
	if (c.charIndex !== undefined && typeof c.charIndex !== "number")
		return false;
	if (
		c.displayName !== undefined &&
		(typeof c.displayName !== "string" || c.displayName.length > 7)
	)
		return false;
	return true;
}

/** Auth-protected memory routes (mounted behind auth middleware) */
const memories = new Hono<{ Bindings: Env; Variables: Variables }>();

// Record a single completion
memories.post("/", async (c) => {
	const session = c.get("session");
	const body = await c.req.json<{
		objectId: number;
		eventId: string;
		charIndex: number;
		displayName: string;
		participants?: Array<{ charIndex: number; displayName: string }>;
	}>();

	if (
		!isValidCompletion(body) ||
		typeof body.charIndex !== "number" ||
		typeof body.displayName !== "string"
	) {
		return c.json({ error: "Invalid completion data" }, 400);
	}

	const participantsJson = Array.isArray(body.participants)
		? JSON.stringify(body.participants)
		: "[]";

	await c.env.DB.prepare(
		"INSERT OR IGNORE INTO memory_completions (user_id, object_id, event_id, completed_at, char_index, display_name, participants) VALUES (?, ?, ?, ?, ?, ?, ?)"
	)
		.bind(
			session.user.id,
			body.objectId,
			body.eventId,
			Math.floor(Date.now() / 1000),
			body.charIndex,
			body.displayName,
			participantsJson
		)
		.run();

	return c.json({ ok: true });
});

// Bulk import from IndexedDB (sync on login)
memories.post("/sync", async (c) => {
	const session = c.get("session");
	const body = await c.req.json<{
		completions: Array<{
			objectId: number;
			eventId: string;
			t: number;
			participants?: Array<{ charIndex: number; displayName: string }>;
		}>;
	}>();

	if (!Array.isArray(body.completions)) {
		return c.json({ error: "Invalid completions array" }, 400);
	}

	const stmt = c.env.DB.prepare(
		"INSERT OR IGNORE INTO memory_completions (user_id, object_id, event_id, completed_at, char_index, display_name, participants) VALUES (?, ?, ?, ?, ?, ?, ?)"
	);

	// Find existing event_ids for this user to avoid duplicates
	const existingEvents = await c.env.DB.prepare(
		"SELECT event_id FROM memory_completions WHERE user_id = ?"
	)
		.bind(session.user.id)
		.all<Pick<CompletionRow, "event_id">>();
	const existingSet = new Set(
		existingEvents.results.map((r) => r.event_id)
	);

	// Insert new completions (deduplicate by event_id)
	const batch: D1PreparedStatement[] = [];
	for (const completion of body.completions) {
		if (!isValidCompletion(completion)) continue;
		if (existingSet.has(completion.eventId)) continue;
		if (
			!Array.isArray(completion.participants) ||
			completion.participants.length === 0
		)
			continue;

		const self = completion.participants[0];
		const participantsJson = JSON.stringify(completion.participants);

		batch.push(
			stmt.bind(
				session.user.id,
				completion.objectId,
				completion.eventId,
				completion.t || Math.floor(Date.now() / 1000),
				self.charIndex ?? -1,
				self.displayName ?? "",
				participantsJson
			)
		);
		existingSet.add(completion.eventId);
	}

	if (batch.length > 0) {
		await c.env.DB.batch(batch);
	}

	// Return full merged set
	const merged = await getUserCompletions(c.env.DB, session.user.id);
	return c.json({ completions: merged.results });
});

export { memories };
