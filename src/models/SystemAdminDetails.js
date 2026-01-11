import pool from '../config/database.js';

class SystemAdminDetails {

  static async findByEmail(email) {
    const [rows] = await pool.execute(
      `SELECT ad.admin_id, ad.admin_name, ad.first_name, ad.middle_name, ad.last_name, 
              ad.email, ad.phone_number, ad.role_code, ad.status_code, 
              ac.password, ar.role_name, as2.status_name
       FROM system_admin_details ad
       LEFT JOIN system_admin_credentials ac ON ad.admin_id = ac.admin_id
       LEFT JOIN system_admin_roles ar ON ad.role_code = ar.role_code
       LEFT JOIN status as2 ON ad.status_code = as2.status_code
       WHERE ad.email = ? 
         AND ac.is_deleted = 0`,
      [email]
    );
    return rows[0];
  }

  static async findByAdminName(adminName) {
    const [rows] = await pool.execute(
      `SELECT ad.admin_id, ad.admin_name, ad.email, ad.phone_number, ad.role_code, ad.status_code,
              ac.is_deleted
       FROM system_admin_details ad
       LEFT JOIN system_admin_credentials ac ON ad.admin_id = ac.admin_id
       WHERE ad.admin_name = ? 
         AND ac.is_deleted = 0`,
      [adminName]
    );
    return rows[0];
  }

  static async findById(adminId) {
    const [rows] = await pool.execute(
      `SELECT ad.admin_id, ad.admin_name, ad.first_name, ad.middle_name, ad.last_name,
              ad.email, ad.phone_number, ad.role_code, ad.status_code, 
              ar.role_name, as2.status_name, aa.area, aa.city, aa.state, aa.pincode
       FROM system_admin_details ad
       LEFT JOIN system_admin_roles ar ON ad.role_code = ar.role_code
       LEFT JOIN status as2 ON ad.status_code = as2.status_code
       LEFT JOIN system_admin_address aa ON ad.admin_id = aa.admin_id
       WHERE ad.admin_id = ?`,
      [adminId]
    );
    return rows[0];
  }

  static async create(adminData) {
    const {
      admin_name, first_name, middle_name, last_name, email, phone_number,
      role_code, status_code
    } = adminData;

    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      const [result] = await connection.execute(
        `INSERT INTO system_admin_details 
         (admin_name, first_name, middle_name, last_name, email, phone_number, role_code, status_code) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [admin_name, first_name, middle_name, last_name, email, phone_number, role_code, 'ACT'] // Default to ACT for active
      );

      await connection.commit();
      return { adminId: result.insertId };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  static async findByLoginIdentifier(identifier) {
    const query = `
      SELECT 
        ad.admin_id,
        ad.admin_name,
        ad.first_name,
        ad.middle_name,
        ad.last_name,
        ad.email,
        ad.phone_number,
        ad.role_code,
        ad.status_code,
        ar.role_name,  
        s.status_name,
        ac.password,
        ac.is_deleted,
        ac.is_deactivated
      FROM system_admin_details ad
      JOIN system_admin_credentials ac ON ac.admin_id = ad.admin_id
      JOIN system_admin_roles ar ON ar.role_code = ad.role_code  
      JOIN status s ON s.status_code = ad.status_code
      WHERE (ad.email = ? OR ad.admin_name = ? OR ad.phone_number = ?)
        AND ac.is_deleted = 0
      LIMIT 1
    `;

    const [rows] = await pool.execute(query, [identifier, identifier, identifier]);
    return rows[0];
  }

  static async checkPhoneNumberExists(phoneNumber) {
    const [rows] = await pool.execute(
      `SELECT ad.admin_id 
       FROM system_admin_details ad
       LEFT JOIN system_admin_credentials ac ON ad.admin_id = ac.admin_id
       WHERE ad.phone_number = ? 
         AND ac.is_deleted = 0`,
      [phoneNumber]
    );
    return rows[0] || null;
  }

  static async checkEmailExists(email) {
    const [rows] = await pool.execute(
      `SELECT ad.admin_id 
       FROM system_admin_details ad
       LEFT JOIN system_admin_credentials ac ON ad.admin_id = ac.admin_id
       WHERE ad.email = ? 
         AND ac.is_deleted = 0`,
      [email]
    );
    return rows[0] || null;
  }

}

export default SystemAdminDetails;