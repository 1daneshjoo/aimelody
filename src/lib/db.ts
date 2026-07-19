import mysql, {
  type Pool,
  type PoolConnection,
  type RowDataPacket,
  type ResultSetHeader,
} from "mysql2/promise";

let pool: Pool | null = null;

function mysqlConfig() {
  return {
    host: process.env.MYSQL_HOST || "127.0.0.1",
    port: Number(process.env.MYSQL_PORT || 3306),
    // پیش‌فرض Laragon: root بدون پسورد
    user: process.env.MYSQL_USER || "root",
    password: process.env.MYSQL_PASSWORD ?? "",
    database: process.env.MYSQL_DATABASE || "melody",
    waitForConnections: true,
    connectionLimit: 10,
    namedPlaceholders: true,
    charset: "utf8mb4",
  };
}

export function getPool() {
  if (pool) return pool;
  const config = mysqlConfig();
  console.info(
    `[db] connecting ${config.user}@${config.host}:${config.port}/${config.database}`,
  );
  pool = mysql.createPool(config);
  return pool;
}

/** برای وقتی env عوض شده یا اتصال مرده است */
export function resetPool() {
  if (pool) {
    void pool.end().catch(() => undefined);
    pool = null;
  }
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

export function formatDbError(e: unknown) {
  const msg = e instanceof Error ? e.message : String(e);
  const code =
    typeof e === "object" && e && "code" in e ? String((e as { code?: string }).code || "") : "";

  if (code === "ECONNREFUSED" || /ECONNREFUSED|Can't connect|connect ETIMEDOUT/i.test(msg)) {
    return {
      error:
        "اتصال به MySQL برقرار نشد. در Laragon دکمه Start All را بزنید و مطمئن شوید MySQL سبز است.",
      detail: msg,
    };
  }

  if (code === "ER_BAD_DB_ERROR" || /Unknown database/i.test(msg)) {
    return {
      error: `دیتابیس «${process.env.MYSQL_DATABASE || "melody"}» پیدا نشد. در Laragon آن را بسازید یا MYSQL_DATABASE را در .env.local اصلاح کنید.`,
      detail: msg,
    };
  }

  if (code === "ER_ACCESS_DENIED_ERROR" || /Access denied/i.test(msg)) {
    return {
      error:
        "یوزر/پسورد MySQL اشتباه است. برای Laragon معمولاً user=root و password خالی است (.env.local).",
      detail: msg,
    };
  }

  if (/doesn't exist|ER_NO_SUCH_TABLE/i.test(msg)) {
    return {
      error: "جداول دیتابیس پیدا نشد. فایل database/schema.sql را ایمپورت کنید.",
      detail: msg,
    };
  }

  return { error: msg, detail: msg };
}
