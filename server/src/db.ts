import { Pool } from "pg";
import dotenv from "dotenv";

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

pool.on("error", (err) => {
  console.error("Unexpected database error", err);
  process.exit(-1);
});

export const query = (text: string, params?: unknown[]) =>
  pool.query(text, params);

export default pool;