import { betterAuth } from "better-auth";
import { anonymous } from "better-auth/plugins";

export type Env = {
	DB: D1Database;
	API_URL: string;
	BETTER_AUTH_SECRET: string;
	DISCORD_CLIENT_ID?: string;
	DISCORD_CLIENT_SECRET?: string;
	GOOGLE_CLIENT_ID?: string;
	GOOGLE_CLIENT_SECRET?: string;
};

export function createAuth(env: Env) {
	return betterAuth({
		database: env.DB,
		baseURL: env.API_URL,
		secret: env.BETTER_AUTH_SECRET,
		plugins: [
			anonymous({
				onLinkAccount: async ({ anonymousUser, newUser }) => {
					// Transfer memory completions from anonymous to linked account
					await env.DB.prepare(
						"UPDATE memory_completions SET user_id = ? WHERE user_id = ?"
					)
						.bind(newUser.user.id, anonymousUser.id)
						.run();
				},
			}),
		],
		socialProviders: {
			...(env.DISCORD_CLIENT_ID && env.DISCORD_CLIENT_SECRET
				? {
						discord: {
							clientId: env.DISCORD_CLIENT_ID,
							clientSecret: env.DISCORD_CLIENT_SECRET,
						},
					}
				: {}),
			...(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET
				? {
						google: {
							clientId: env.GOOGLE_CLIENT_ID,
							clientSecret: env.GOOGLE_CLIENT_SECRET,
						},
					}
				: {}),
		},
		trustedOrigins: ["http://localhost:5173", "http://localhost:3000"],
	});
}
