import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { config } from "../config/config";

const pool = new Pool({
  connectionString: config.DATABASE_URL,
});

export const db = drizzle({ client: pool });

export async function connectDB() {
  await db.$client.connect();
}
