import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';

const sql = fs.readFileSync(
  path.join(process.cwd(), 'database/schema.sql'), 
  'utf8'
);

const conn = await mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'yourpassword' // Replace with your password
});

await conn.query(sql);
console.log('Schema executed successfully!');
await conn.end();