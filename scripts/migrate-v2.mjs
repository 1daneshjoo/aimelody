/**
 * مهاجرت ایمن برای دیتابیس‌های موجود (بدون DROP).
 * اجرا: node scripts/migrate-v2.mjs
 */
import fs from "fs";
import path from "path";
import mysql from "mysql2/promise";

function loadEnv(filePath) {
  if (!fs.existsSync(filePath)) return;
  for (const line of fs.readFileSync(filePath, "utf8").split(/\r?\n/)) {
    const m = line.match(/^([^#=]+)=(.*)$/);
    if (!m) continue;
    let v = m[2].trim();
    if (
      (v.startsWith('"') && v.endsWith('"')) ||
      (v.startsWith("'") && v.endsWith("'"))
    ) {
      v = v.slice(1, -1);
    }
    if (!process.env[m[1].trim()]) process.env[m[1].trim()] = v;
  }
}

loadEnv(path.join(process.cwd(), ".env.local"));

const config = {
  host: process.env.MYSQL_HOST || "127.0.0.1",
  port: Number(process.env.MYSQL_PORT || 3306),
  user: process.env.MYSQL_USER || "root",
  password: process.env.MYSQL_PASSWORD ?? "",
  database: process.env.MYSQL_DATABASE || "melody",
  multipleStatements: true,
};

async function columnExists(conn, table, column) {
  const [rows] = await conn.query(
    `SELECT COUNT(*) AS c FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
    [table, column],
  );
  return Number(rows[0].c) > 0;
}

async function tableExists(conn, table) {
  const [rows] = await conn.query(
    `SELECT COUNT(*) AS c FROM information_schema.TABLES
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?`,
    [table],
  );
  return Number(rows[0].c) > 0;
}

async function constraintExists(conn, name) {
  const [rows] = await conn.query(
    `SELECT COUNT(*) AS c FROM information_schema.TABLE_CONSTRAINTS
     WHERE TABLE_SCHEMA = DATABASE() AND CONSTRAINT_NAME = ?`,
    [name],
  );
  return Number(rows[0].c) > 0;
}

async function main() {
  const conn = await mysql.createConnection(config);
  console.log(`connected ${config.database}`);

  if (!(await columnExists(conn, "users", "public_id"))) {
    await conn.query(
      `ALTER TABLE users ADD COLUMN public_id VARCHAR(32) NULL AFTER id`,
    );
    console.log("+ users.public_id");
  }
  try {
    await conn.query(
      `CREATE UNIQUE INDEX uq_users_public_id ON users (public_id)`,
    );
    console.log("+ uq_users_public_id");
  } catch {
    // already exists
  }

  await conn.query(
    `UPDATE users SET public_id = CONCAT('a', id) WHERE public_id IS NULL OR public_id = ''`,
  );

  if (!(await tableExists(conn, "genres"))) {
    await conn.query(`
      CREATE TABLE genres (
        id SMALLINT UNSIGNED NOT NULL AUTO_INCREMENT,
        name VARCHAR(64) NOT NULL,
        sort_order SMALLINT NOT NULL DEFAULT 0,
        PRIMARY KEY (id),
        UNIQUE KEY uq_genres_name (name)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log("+ genres");
  }

  await conn.query(`
    INSERT IGNORE INTO genres (name, sort_order) VALUES
      ('پاپ', 1), ('رپ', 2), ('سنتی', 3), ('راک', 4),
      ('الکترونیک', 5), ('هیپ‌هاپ', 6), ('امبینت', 7), ('فیوژن', 8)
  `);

  if (!(await tableExists(conn, "ads"))) {
    await conn.query(`
      CREATE TABLE ads (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
        public_id VARCHAR(32) NOT NULL,
        title VARCHAR(200) NOT NULL,
        image_url VARCHAR(500) NOT NULL,
        href VARCHAR(500) NOT NULL DEFAULT '#',
        placement ENUM('sidebar', 'inline', 'preroll') NOT NULL DEFAULT 'sidebar',
        active TINYINT(1) NOT NULL DEFAULT 1,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        UNIQUE KEY uq_ads_public_id (public_id),
        KEY idx_ads_placement (placement, active)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log("+ ads");
  }

  await conn.query(`
    INSERT IGNORE INTO ads (public_id, title, image_url, href, placement, active) VALUES
      ('ad1', 'استودیو تولید صدای AI', '/images/ads/ad1.jpg', '#', 'sidebar', 1),
      ('ad2', 'دوره پرامپت‌نویسی موسیقی AI', '/images/ads/ad2.jpg', '#', 'inline', 1)
  `);

  if (
    (await tableExists(conn, "competitions")) &&
    (await tableExists(conn, "tracks")) &&
    !(await constraintExists(conn, "fk_tracks_competition"))
  ) {
    try {
      await conn.query(`
        ALTER TABLE tracks
          ADD CONSTRAINT fk_tracks_competition
          FOREIGN KEY (competition_id) REFERENCES competitions (id)
          ON DELETE SET NULL
      `);
      console.log("+ fk_tracks_competition");
    } catch (e) {
      console.warn("fk_tracks_competition skipped:", e.message);
    }
  }

  await conn.end();
  console.log("migrate-v2 done");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
