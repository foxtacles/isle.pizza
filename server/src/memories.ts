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
	}>();

	if (
		typeof body.objectId !== "number" ||
		!Number.isInteger(body.objectId) ||
		body.objectId < 0
	) {
		return c.json({ error: "Invalid objectId" }, 400);
	}
	if (typeof body.eventId !== "string" || body.eventId.length > 16) {
		return c.json({ error: "Invalid eventId" }, 400);
	}
	if (typeof body.charIndex !== "number") {
		return c.json({ error: "Invalid charIndex" }, 400);
	}
	if (typeof body.displayName !== "string" || body.displayName.length > 7) {
		return c.json({ error: "Invalid displayName" }, 400);
	}

	await c.env.DB.prepare(
		"INSERT OR IGNORE INTO memory_completions (user_id, object_id, event_id, completed_at, char_index, display_name) VALUES (?, ?, ?, ?, ?, ?)"
	)
		.bind(
			session.user.id,
			body.objectId,
			body.eventId,
			Math.floor(Date.now() / 1000),
			body.charIndex,
			body.displayName
		)
		.run();

	return c.json({ ok: true });
});

// Get all completions for the current user
memories.get("/", async (c) => {
	const session = c.get("session");
	const result = await c.env.DB.prepare(
		"SELECT object_id, event_id, completed_at, char_index, display_name FROM memory_completions WHERE user_id = ? ORDER BY completed_at DESC"
	)
		.bind(session.user.id)
		.all<CompletionRow>();

	return c.json({ completions: result.results });
});

// Get distinct unlocked object IDs for the current user
memories.get("/unlocked", async (c) => {
	const session = c.get("session");
	const result = await c.env.DB.prepare(
		"SELECT DISTINCT object_id FROM memory_completions WHERE user_id = ?"
	)
		.bind(session.user.id)
		.all<Pick<CompletionRow, "object_id">>();

	return c.json({
		unlocked: result.results.map((r) => r.object_id),
		count: result.results.length,
	});
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
		"INSERT OR IGNORE INTO memory_completions (user_id, object_id, event_id, completed_at, char_index, display_name) VALUES (?, ?, ?, ?, ?, ?)"
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
		if (
			typeof completion.objectId !== "number" ||
			!Number.isInteger(completion.objectId) ||
			completion.objectId < 0
		) {
			continue;
		}
		if (existingSet.has(completion.eventId)) {
			continue;
		}
		if (
			!Array.isArray(completion.participants) ||
			completion.participants.length === 0
		) {
			continue;
		}

		// Find the local player's data in participants (first entry is typically self)
		const self = completion.participants[0];
		batch.push(
			stmt.bind(
				session.user.id,
				completion.objectId,
				completion.eventId,
				completion.t || Math.floor(Date.now() / 1000),
				self.charIndex ?? -1,
				self.displayName ?? ""
			)
		);
		existingSet.add(completion.eventId);
	}

	if (batch.length > 0) {
		await c.env.DB.batch(batch);
	}

	// Return full merged set
	const merged = await c.env.DB.prepare(
		"SELECT object_id, event_id, completed_at, char_index, display_name FROM memory_completions WHERE user_id = ? ORDER BY completed_at DESC"
	)
		.bind(session.user.id)
		.all<CompletionRow>();

	return c.json({ completions: merged.results });
});

/** Public memory routes (no auth required) */
const publicMemories = new Hono<{ Bindings: Env }>();

// Public: get unlock count for a user (profile display)
publicMemories.get("/:userId/count", async (c) => {
	const userId = c.req.param("userId");
	const result = await c.env.DB.prepare(
		"SELECT COUNT(DISTINCT object_id) as count FROM memory_completions WHERE user_id = ?"
	)
		.bind(userId)
		.first<{ count: number }>();

	return c.json({ count: result?.count ?? 0 });
});

// Public: get all participants for a specific completion event
publicMemories.get("/event/:eventId", async (c) => {
	const eventId = c.req.param("eventId");
	const result = await c.env.DB.prepare(
		"SELECT user_id, object_id, completed_at, char_index, display_name FROM memory_completions WHERE event_id = ?"
	)
		.bind(eventId)
		.all<CompletionRow>();

	return c.json({ participants: result.results });
});

export { memories, publicMemories };
