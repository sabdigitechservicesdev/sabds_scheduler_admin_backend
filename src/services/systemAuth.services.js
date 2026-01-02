import { SystemAdminDetails, SystemAdminCredentials, SystemAdminAddress } from "../models/index.js"
import TokenService from './token.service.js';
import pool from '../config/database.js';


class systemAuthService {
  static async register(adminData) {
    const {
      admin_name, first_name, middle_name, last_name, email,
      password, area, city, state, pincode, role_code
    } = adminData;

    // Check if email already exists
    const existingAdmin = await SystemAdminDetails.findByEmail(email);
    if (existingAdmin) {
      throw new Error('Email already registered');
    }

    // Check if admin_name already exists
    const existingAdminName = await SystemAdminDetails.findByAdminName(admin_name);
    if (existingAdminName) {
      throw new Error('Admin name already taken');
    }

    // Hash password
    const hashedPassword = await TokenService.hashPassword(password);


    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      // Create admin details
      const adminResult = await SystemAdminDetails.create({
        admin_name,
        first_name,
        middle_name,
        last_name,
        email,
        role_code: role_code || 'AD'
      });

      const adminId = adminResult.adminId;

      // Create credentials
      await SystemAdminCredentials.create(adminId, {
        admin_name,
        email,
        password: hashedPassword
      });

      // Create address if provided
      if (area && city && state && pincode) {
        await SystemAdminAddress.create(adminId, {
          area, city, state, pincode
        });
      }

      await connection.commit();

      // Generate tokens
      const tokens = this.generateTokens(adminId, email, admin_name, role_code);

      return {
        success: true,
        message: 'Registration successful',
        data: {
          adminId,
          admin_name,
          email,
          tokens
        }
      };

    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  static async login(identifier, password) {

    const admin = await SystemAdminDetails.findByLoginIdentifier(identifier);

    // 1️⃣ User not found OR soft deleted
    if (!admin || admin.is_deleted === 1) {
      throw new Error('User not found');
    }

    if (!admin || admin.is_deactivated === 1) {
      throw new Error('User are Deactivated');
    }

    // 2️⃣ Status check
    if (admin.status_code !== 'ACT') {
      throw new Error(`Account is ${admin.status_name.toLowerCase()}`);
    }

    // 3️⃣ Password verify
    const isValidPassword = await TokenService.comparePassword(
      password,
      admin.password
    );

    if (!isValidPassword) {
      throw new Error('Invalid credentials');
    }

    // 4️⃣ Generate tokens
    const tokens = this.generateTokens(
      admin.admin_id,
      admin.email,
      admin.admin_name,
      admin.role_code
    );

    return {
      success: true,
      message: 'Login successful',
      data: {
        adminId: admin.admin_id,
        admin_name: admin.admin_name,
        first_name: admin.first_name,
        last_name: admin.last_name,
        email: admin.email,
        role: admin.role_code,
        role_name: admin.role_name,
        status: admin.status_code,
        tokens
      }
    };
  }


  static generateTokens(adminId, email, adminName, role) {
    const accessToken = TokenService.generateAccessToken({
      adminId,
      email,
      adminName,
      role
    });



    return {
      accessToken,

      tokenType: 'Bearer'
    };
  }

  //   static async refreshAccessToken(refreshToken) {
  //     const decoded = TokenService.verifyRefreshToken(refreshToken);

  //     if (!decoded) {
  //       throw new Error('Invalid refresh token');
  //     }

  //     // Verify admin still exists and is active
  //     const admin = await SystemAdminDetails.findById(decoded.adminId);

  //     if (!admin) {
  //       throw new Error('User not found');
  //     }

  //     if (admin.status_code !== 'ACT') {
  //       throw new Error('Account is not active');
  //     }

  //     // Generate new access token
  //     const accessToken = TokenService.generateAccessToken({
  //       adminId: admin.admin_id,
  //       email: admin.email,
  //       adminName: admin.admin_name,
  //       role: admin.role_code
  //     });

  //     return {
  //       accessToken,
  //       tokenType: 'Bearer'
  //     };
  //   }
// SystemAuthService.js - add this method
  static async forgotPassword(identifier, newPassword) {
    // 1️⃣ First, find the user using the same method as login
    const admin = await SystemAdminDetails.findByLoginIdentifier(identifier);

    // 2️⃣ Validate user existence and status - EXACTLY like login
    if (!admin || admin.is_deleted === 1) {
      throw new Error('User not found');
    }

    if (!admin || admin.is_deactivated === 1) {
      throw new Error('User are Deactivated');
    }

    // 3️⃣ Status check - same as login
    if (admin.status_code !== 'ACT') {
      throw new Error(`Account is ${admin.status_name.toLowerCase()}`);
    }

    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();

      // 4️⃣ Hash the new password
      const hashedPassword = await TokenService.hashPassword(newPassword);

      // 5️⃣ Update password in credentials table
      const [updateResult] = await connection.execute(
        `UPDATE system_admin_credentials 
         SET password = ?, updated_at = CURRENT_TIMESTAMP 
         WHERE admin_id = ?`,
        [hashedPassword, admin.admin_id]
      );

      if (updateResult.affectedRows === 0) {
        throw new Error('Failed to update password');
      }

      await connection.commit();

      return {
        success: true,
        message: 'Password reset successful'
      };

    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

}

export default systemAuthService;