import pg from "pg";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { config } from "./config.js";

const { Pool } = pg;
export const pool = new Pool({ connectionString: config.dbUrl, max: 10 });

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export async function initDb() {
  const sql = fs.readFileSync(path.join(__dirname, "sql", "init.sql"), "utf8");
  await pool.query(sql);
}
