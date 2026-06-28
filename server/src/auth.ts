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
     * Better Auth defaults to SameSite=Lax, which works perfectly for localhost
     * development even across different ports (e.g. 3000 to 3001), because cookies
     * do not isolate by port.
     */
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
