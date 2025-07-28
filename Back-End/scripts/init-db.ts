import { readFileSync } from 'fs';
import { Client } from 'pg';

const sqlFile = process.env.SQL_FILE || __dirname + '/../db/init/initDB.sql';

const client = new Client({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  user: process.env.DB_USER || 'postgres',
  password: process.env.PGPASSWORD || 'postgres',
  database: process.env.DB_NAME || 'industria',
});

async function main() {
  const sql = readFileSync(sqlFile, 'utf8');
  await client.connect();
  try {
    await client.query(sql);
    console.log('Database initialized successfully');
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error('Failed to initialize database:', err);
  process.exit(1);
});
