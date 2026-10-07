// Désigne le super admin (il ne peut y en avoir qu'un).
// Usage : npm run set-superadmin -- <email> [--transfer]
// --transfer : si un super admin existe déjà, il redevient admin et
//              l'utilisateur indiqué prend sa place.
import mysql from "mysql2/promise";

const args = process.argv.slice(2);
const email = args.find((arg) => !arg.startsWith("--"));
const transfer = args.includes("--transfer");

if (!email) {
  console.error("Usage : npm run set-superadmin -- <email> [--transfer]");
  process.exit(1);
}

const connection = await mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
});

try {
  const [[user]] = await connection.query("SELECT id, name, role FROM users WHERE email = ?", [email]);
  if (!user) throw new Error(`Aucun utilisateur avec l'email ${email}`);

  const [[current]] = await connection.query("SELECT id, name FROM users WHERE role = 'superadmin'");
  if (current?.id === user.id) {
    console.log(`${user.name} est déjà super admin`);
  } else {
    if (current && !transfer) {
      throw new Error(`${current.name} est déjà super admin : ajoutez --transfer pour lui retirer ce rôle`);
    }
    await connection.beginTransaction();
    if (current) {
      await connection.query("UPDATE users SET role = 'admin' WHERE id = ?", [current.id]);
    }
    await connection.query("UPDATE users SET role = 'superadmin' WHERE id = ?", [user.id]);
    await connection.commit();
    console.log(`${user.name} est maintenant super admin${current ? ` (${current.name} redevient admin)` : ""}`);
  }
} catch (error) {
  await connection.rollback().catch(() => {});
  console.error("Échec :", error.message);
  process.exitCode = 1;
} finally {
  await connection.end();
}
