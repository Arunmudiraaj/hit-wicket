import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "./db/index.js";
import { config } from "./config/env.js";

export const auth = betterAuth({
    database: drizzleAdapter(db, {
        provider: "pg",
    }),
    secret: config.BETTER_AUTH_SECRET,
    baseURL: config.BETTER_AUTH_URL,
    trustedOrigins: [config.CLIENT_ORIGIN],
    account: {
        accountLinking: {
            enabled: true,
            trustedProviders: ["google", "github"],
        }
    },
    /**
     * Cookie configuration for cross-origin dev setup.
     *
     * Client runs on :3000, server on :3001. The Browser won't send SameSite=Lax
     * cookies cross-origin (which blocks the Socket.IO upgrade request).
     *
     * In dev: SameSite=None; Secure=false so the session cookie is sent with:
     *   - Regular HTTP requests from authClient (/api/auth/*) ✅
     *   - WebSocket upgrade requests from Socket.IO ✅
     *
     * In production (same domain/reverse-proxied): remove this block and let
     * Better Auth default to SameSite=Lax with Secure=true.
     */
    advanced: {
        defaultCookieAttributes: config.NODE_ENV === "production"
            ? {}
            : {
                sameSite: "none",
                secure: false,
            },
    },
    socialProviders: {
        github: {
            clientId: config.GITHUB_CLIENT_ID || "",
            clientSecret: config.GITHUB_CLIENT_SECRET || "",
            mapProfileToUser: (profile) => {
                return {
                    name: profile.name || profile.login,
                };
            }
        },
        google: {
            clientId: config.GOOGLE_CLIENT_ID || "",
            clientSecret: config.GOOGLE_CLIENT_SECRET || "",
        }
    }
});
