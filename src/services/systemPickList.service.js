import pool from '../config/database.js';

class systemPicklistService {

  static async getAllAdminRoles() {
    try {
      const [rows] = await pool.query(
        `SELECT id, role_name, role_code 
         FROM system_admin_roles 
         ORDER BY id ASC`
      );

      return rows;
    } catch (error) {
      console.error('Error in systemPicklistService.getAllAdminRoles:', error);
      throw new Error('Failed to fetch admin roles');
    }
  }

}

export default systemPicklistService;