import pool from '../config/database.js';

class UserCredentials {
  static async create(userId, credentials) {
    const { user_name, email, password } = credentials;
    
    const [result] = await pool.execute(
      `INSERT INTO user_credentials (user_id, user_name, email, password) 
       VALUES (?, ?, ?, ?)`,
      [userId, user_name, email, password]
    );
    
    return { credentialId: result.insertId };
  }

  static async updatePassword(userId, hashedPassword) {
    const [result] = await pool.execute(
      `UPDATE user_credentials SET password = ?, updated_at = CURRENT_TIMESTAMP 
       WHERE user_id = ?`,
      [hashedPassword, userId]
    );
    
    return result.affectedRows > 0;
  }

  static async resetPassword(email, hashedPassword) {
    const [result] = await pool.execute(
      `UPDATE user_credentials SET password = ?, updated_at = CURRENT_TIMESTAMP 
       WHERE email = ?`,
      [hashedPassword, email]
    );
    
    return result.affectedRows > 0;
  }

  static async findByUserId(userId) {
    const [rows] = await pool.execute(
      `SELECT * FROM user_credentials WHERE user_id = ?`,
      [userId]
    );
    return rows[0];
  }
}

export default UserCredentials;