/**
 * Environment Configuration
 * Loads and validates environment variables
 */

import { config as dotenvConfig } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

// Load .env file
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenvConfig({ path: resolve(__dirname, '../../.env') });

type NodeEnv = 'development' | 'production' | 'test';

export interface EnvConfig {
    /** Server port */
    PORT: number;
    /** Allowed client origin for CORS */
    CLIENT_ORIGIN: string;
    /** Node environment */
    NODE_ENV: NodeEnv;
    /** Log level */
    LOG_LEVEL: string;
}

function getEnvVar(key: string, defaultValue?: string): string {
    const value = process.env[key] ?? defaultValue;
    if (value === undefined) {
        throw new Error(`Missing required environment variable: ${key}`);
    }
    return value;
}

function getEnvNumber(key: string, defaultValue: number): number {
    const value = process.env[key];
    if (value === undefined) {
        return defaultValue;
    }
    const parsed = parseInt(value, 10);
    if (isNaN(parsed)) {
        throw new Error(`Environment variable ${key} must be a valid number`);
    }
    return parsed;
}

export const config: EnvConfig = {
    PORT: getEnvNumber('PORT', 3001),
    CLIENT_ORIGIN: getEnvVar('CLIENT_ORIGIN', 'http://localhost:5173'),
    NODE_ENV: getEnvVar('NODE_ENV', 'development') as NodeEnv,
    LOG_LEVEL: getEnvVar('LOG_LEVEL', 'info'),
};

export default config;
