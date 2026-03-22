import { Hono } from "hono";
import { cors } from "hono/cors";
import { createAuth, type Env } from "./auth";
import { memories, publicMemories } from "./memories";

type Variables = {
	session: { user: { id: string } };
};

const app = new Hono<{ Bindings: Env; Variables: Variables }>();

// CORS for frontend
app.use(
	"*",
	cors({
		origin: ["http://localhost:5173", "http://localhost:3000"],
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

// Public memory routes (no auth required) — registered before the auth middleware
app.route("/api/memories", publicMemories);

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
