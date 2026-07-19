import mysql, { type Pool, type PoolConnection, type RowDataPacket, type ResultSetHeader } from "mysql2/promise";

let pool: Pool | null = null;

export function getPool() {
  if (pool) return pool;
  pool = mysql.createPool({
    host: process.env.MYSQL_HOST || "127.0.0.1",
    port: Number(process.env.MYSQL_PORT || 3306),
    user: process.env.MYSQL_USER || "aimelody",
    password: process.env.MYSQL_PASSWORD || "",
    database: process.env.MYSQL_DATABASE || "aimelody",
    waitForConnections: true,
    connectionLimit: 10,
    namedPlaceholders: true,
    charset: "utf8mb4",
  });
  return pool;
}

// mysql2 namedPlaceholders accepts plain objects; typings are overly strict.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SqlParams = Record<string, any>;

export async function query<T extends RowDataPacket[]>(sql: string, params?: SqlParams) {
  const [rows] = await getPool().query<T>(sql, params);
  return rows;
}

export async function execute(sql: string, params?: SqlParams) {
  const [result] = await getPool().execute<ResultSetHeader>(sql, params);
  return result;
}

export async function withConnection<T>(fn: (conn: PoolConnection) => Promise<T>) {
  const conn = await getPool().getConnection();
  try {
    return await fn(conn);
  } finally {
    conn.release();
  }
}

export async function dbPing() {
  await query<RowDataPacket[]>("SELECT 1 AS ok");
}
