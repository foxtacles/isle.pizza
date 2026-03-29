import { Hono } from "hono";
import { cors } from "hono/cors";
import { createAuth, type Env } from "./auth";
import { memories } from "./memories";

type Variables = {
	session: { user: { id: string } };
};

const app = new Hono<{ Bindings: Env; Variables: Variables }>();

// CORS for frontend
app.use(
	"*",
	cors({
		origin: ["http://localhost:5173", "http://localhost:3000", "https://isle.pizza", "https://dev.isle.pizza"],
		credentials: true,
	})
);

// Health check
app.get("/health", (c) => c.json({ status: "ok" }));

// better-auth handles all /api/auth/* routes
app.all("/api/auth/*", async (c) => {
	const auth = createAuth(c.env);
	return auth.handler(c.req.raw);
});

// Public endpoint: look up a memory completion by eventId (no auth needed)
app.get("/api/memory/:eventId", async (c) => {
	const eventId = c.req.param("eventId");
	if (!eventId || eventId.length > 16) {
		return c.json({ error: "Invalid eventId" }, 400);
	}

	const result = await c.env.DB.prepare(
		"SELECT anim_index, event_id, completed_at, participants FROM memory_completions WHERE event_id = ? LIMIT 1"
	)
		.bind(eventId)
		.first<{
			anim_index: number;
			event_id: string;
			completed_at: number;
			participants: string;
		}>();

	if (!result) {
		return c.json({ error: "Not found" }, 404);
	}

	return c.json({
		animIndex: result.anim_index,
		eventId: result.event_id,
		completedAt: result.completed_at,
		participants: JSON.parse(result.participants || "[]"),
	});
});

// Auth middleware for protected /api/memories routes
const memoriesAuth = async (c: any, next: any) => {
	const auth = createAuth(c.env);
	const session = await auth.api.getSession({
		headers: c.req.raw.headers,
	});

	if (!session) {
		return c.json({ error: "Unauthorized" }, 401);
	}

	c.set("session", session);
	await next();
};
app.use("/api/memories", memoriesAuth);
app.use("/api/memories/*", memoriesAuth);

// Auth-protected memory routes
app.route("/api/memories", memories);

export default app;
