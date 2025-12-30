import pool from '../config/database.js';

class UserAddress {
  static async create(userId, addressData) {
    const { area, city, state, pincode } = addressData;
    
    const [result] = await pool.execute(
      `INSERT INTO user_address (user_id, area, city, state, pincode) 
       VALUES (?, ?, ?, ?, ?)`,
      [userId, area, city, state, pincode]
    );
    
    return { addressId: result.insertId };
  }

  static async update(userId, addressData) {
    const { area, city, state, pincode } = addressData;
    
    // Check if address exists
    const [existing] = await pool.execute(
      `SELECT id FROM user_address WHERE user_id = ?`,
      [userId]
    );
    
    if (existing.length > 0) {
      // Update existing address
      const [result] = await pool.execute(
        `UPDATE user_address 
         SET area = ?, city = ?, state = ?, pincode = ?, updated_at = CURRENT_TIMESTAMP
         WHERE user_id = ?`,
        [area, city, state, pincode, userId]
      );
      return result.affectedRows > 0;
    } else {
      // Create new address
      await this.create(userId, addressData);
      return true;
    }
  }

  static async findByUserId(userId) {
    const [rows] = await pool.execute(
      `SELECT * FROM user_address WHERE user_id = ?`,
      [userId]
    );
    return rows[0];
  }
}

export default UserAddress;