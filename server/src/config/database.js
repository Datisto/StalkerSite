import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'stalker_rp',
  waitForConnections: true,
  connectionLimit: 30,
  queueLimit: 0,
  timezone: '+00:00',
  connectTimeout: 10000,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0
});

export async function query(sql, params) {
  const [results] = await pool.execute(sql, params);
  return results;
}

export async function getConnection() {
  return await pool.getConnection();
}

export { pool };
export default pool;
