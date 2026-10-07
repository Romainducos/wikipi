// Applique les migrations SQL de db/migrations/ dans l'ordre alphabétique.
// - Base vide : crée d'abord les tables de db/schema.sql.
// - Chaque migration appliquée est notée dans la table schema_migrations,
//   elle n'est donc jamais rejouée.
// Usage : npm run migrate
import { readFile, readdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import mysql from "mysql2/promise";

const dbDir = path.dirname(fileURLToPath(import.meta.url));
const migrationsDir = path.join(dbDir, "migrations");

const connection = await mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  multipleStatements: true,
});

try {
  const [usersTable] = await connection.query("SHOW TABLES LIKE 'users'");
  if (usersTable.length === 0) {
    console.log("Base vide : création des tables de schema.sql");
    await connection.query(await readFile(path.join(dbDir, "schema.sql"), "utf8"));
  }

  await connection.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      name varchar(255) NOT NULL PRIMARY KEY,
      applied_at timestamp NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  const [appliedRows] = await connection.query("SELECT name FROM schema_migrations");
  const applied = new Set(appliedRows.map((row) => row.name));

  const files = (await readdir(migrationsDir)).filter((f) => f.endsWith(".sql")).sort();
  const pending = files.filter((f) => !applied.has(f));

  if (pending.length === 0) {
    console.log("Base à jour, aucune migration à appliquer");
  }

  for (const file of pending) {
    console.log(`Migration ${file}...`);
    await connection.query(await readFile(path.join(migrationsDir, file), "utf8"));
    await connection.query("INSERT INTO schema_migrations (name) VALUES (?)", [file]);
  }
} catch (error) {
  console.error("Échec de la migration:", error.message);
  process.exitCode = 1;
} finally {
  await connection.end();
}
