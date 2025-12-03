import bcrypt from 'bcrypt';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

async function createAdmin() {
  const username = process.argv[2] || 'admin';
  const password = process.argv[3] || 'admin123';

  console.log('Creating admin user...');
  console.log('Username:', username);

  const passwordHash = await bcrypt.hash(password, 10);

  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'stalker_rp',
  });

  try {
    const [existing] = await connection.execute(
      'SELECT id FROM admins WHERE username = ?',
      [username]
    );

    if (existing.length > 0) {
      console.log('❌ Admin already exists!');
      await connection.end();
      return;
    }

    await connection.execute(
      'INSERT INTO admins (id, username, password_hash, role, is_active) VALUES (UUID(), ?, ?, ?, ?)',
      [username, passwordHash, 'super_admin', true]
    );

    console.log('✅ Admin created successfully!');
    console.log('Login credentials:');
    console.log('  Username:', username);
    console.log('  Password:', password);
    console.log('\n⚠️  IMPORTANT: Change password after first login!');

  } catch (error) {
    console.error('❌ Error creating admin:', error.message);
  } finally {
    await connection.end();
  }
}

createAdmin();
