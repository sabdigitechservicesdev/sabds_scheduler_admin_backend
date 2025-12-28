import pool from '../config/database.js';

class User {
  // Find user by email or username
  static async findByLoginIdentifier(identifier) {
    const [rows] = await pool.execute(
      `SELECT ud.user_id, ud.user_name, ud.first_name, ud.middle_name, ud.last_name,
              ud.email, ud.role_code, ud.status_code, 
              uc.password, uc.is_deleted, uc.is_deactivated,
              r.role_name, s.status_name
       FROM user_details ud
       LEFT JOIN user_credentials uc ON ud.user_id = uc.user_id
       LEFT JOIN roles r ON ud.role_code = r.role_code
       LEFT JOIN status s ON ud.status_code = s.status_code
       WHERE ud.email = ? OR ud.user_name = ?`,
      [identifier, identifier]
    );
    return rows[0];
  }

  // Find user by ID
  static async findById(userId) {
    const [rows] = await pool.execute(
      `SELECT ud.*, r.role_name, s.status_name, ua.area, ua.city, ua.state, ua.pincode,
              uc.is_deleted, uc.is_deactivated
       FROM user_details ud
       LEFT JOIN roles r ON ud.role_code = r.role_code
       LEFT JOIN status s ON ud.status_code = s.status_code
       LEFT JOIN user_address ua ON ud.user_id = ua.user_id
       LEFT JOIN user_credentials uc ON ud.user_id = uc.user_id
       WHERE ud.user_id = ?`,
      [userId]
    );
    return rows[0];
  }

  // Create new user
  static async create(userData) {
    const {
      user_name, first_name, middle_name, last_name, email,
      role_code = 'SE', status_code = 'ACT'
    } = userData;

    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      const [result] = await connection.execute(
        `INSERT INTO user_details 
         (user_name, first_name, middle_name, last_name, email, role_code, status_code) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [user_name, first_name, middle_name, last_name, email, role_code, status_code]
      );

      await connection.commit();
      return { userId: result.insertId };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  // Update user
  static async update(userId, userData) {
    const { first_name, middle_name, last_name, role_code, status_code } = userData;
    
    const [result] = await pool.execute(
      `UPDATE user_details 
       SET first_name = ?, middle_name = ?, last_name = ?, 
           role_code = ?, status_code = ?, updated_at = CURRENT_TIMESTAMP
       WHERE user_id = ?`,
      [first_name, middle_name, last_name, role_code, status_code, userId]
    );
    
    return result.affectedRows > 0;
  }

  // Soft delete user
  static async softDelete(userId) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      // Update user_details status
      await connection.execute(
        `UPDATE user_details SET status_code = 'DEA' WHERE user_id = ?`,
        [userId]
      );

      // Update user_credentials
      await connection.execute(
        `UPDATE user_credentials SET is_deleted = 1 WHERE user_id = ?`,
        [userId]
      );

      await connection.commit();
      return true;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  // Deactivate user
  static async deactivate(userId) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      await connection.execute(
        `UPDATE user_details SET status_code = 'DEA' WHERE user_id = ?`,
        [userId]
      );

      await connection.execute(
        `UPDATE user_credentials SET is_deactivated = 1 WHERE user_id = ?`,
        [userId]
      );

      await connection.commit();
      return true;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  // Activate user
  static async activate(userId) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      await connection.execute(
        `UPDATE user_details SET status_code = 'ACT' WHERE user_id = ?`,
        [userId]
      );

      await connection.execute(
        `UPDATE user_credentials SET is_deactivated = 0 WHERE user_id = ?`,
        [userId]
      );

      await connection.commit();
      return true;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

// Alternative fix - Use template literals
static async findAll(filters = {}) {
  console.log('🔍 User.findAll() - Alternative fix');
  
  // Build query without parameterized LIMIT
  let query = `
    SELECT ud.*, r.role_name, s.status_name, 
           uc.is_deleted, uc.is_deactivated,
           ua.area, ua.city, ua.state, ua.pincode
    FROM user_details ud
    LEFT JOIN roles r ON ud.role_code = r.role_code
    LEFT JOIN status s ON ud.status_code = s.status_code
    LEFT JOIN user_credentials uc ON ud.user_id = uc.user_id
    LEFT JOIN user_address ua ON ud.user_id = ua.user_id
    WHERE 1=1
  `;
  
  const params = [];
  
  if (filters.role && filters.role !== 'ALL') {
    query += ` AND ud.role_code = ?`;
    params.push(filters.role);
  }
  
  if (filters.status && filters.status !== 'ALL') {
    query += ` AND ud.status_code = ?`;
    params.push(filters.status);
  }
  
  if (filters.search) {
    query += ` AND (
      ud.user_name LIKE ? OR 
      ud.first_name LIKE ? OR 
      ud.last_name LIKE ? OR 
      ud.email LIKE ?
    )`;
    const searchTerm = `%${filters.search}%`;
    params.push(searchTerm, searchTerm, searchTerm, searchTerm);
  }
  
  // ✅ FIX: Use template literals for LIMIT/OFFSET
  const page = parseInt(filters.page, 10) || 1;
  const limit = parseInt(filters.limit, 10) || 10;
  const offset = (page - 1) * limit;
  
  // Direct numbers in query, not parameters
  query += ` ORDER BY ud.created_at DESC LIMIT ${limit} OFFSET ${offset}`;
  
  console.log('📝 Query with direct LIMIT:', query);
  console.log('🔢 Parameters:', params);
  
  try {
    const [rows] = await pool.execute(query, params);
    console.log(`✅ Success! Found ${rows.length} users`);
    
    // Count query (without LIMIT)
    let countQuery = `SELECT COUNT(*) as total FROM user_details ud WHERE 1=1`;
    const countParams = [];
    
    if (filters.role && filters.role !== 'ALL') {
      countQuery += ` AND ud.role_code = ?`;
      countParams.push(filters.role);
    }
    
    if (filters.status && filters.status !== 'ALL') {
      countQuery += ` AND ud.status_code = ?`;
      countParams.push(filters.status);
    }
    
    const [countResult] = await pool.execute(countQuery, countParams);
    const total = parseInt(countResult[0].total, 10);
    
    return {
      users: rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
    
  } catch (error) {
    console.error('❌ Query failed:', error.message);
    throw error;
  }
}
}

export default User;