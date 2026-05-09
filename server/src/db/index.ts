import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema.js';
import * as relations from './relations.js';
import { config } from '../config/env.js';

// Connection logic for Drizzle ORM
const queryClient = postgres(config.DATABASE_URL);
export const db = drizzle(queryClient, { schema: { ...schema, ...relations } });
