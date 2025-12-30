import { User, UserCredentials } from '../models/index.js';
import TokenService from './tokenService.js';
import pool from '../config/database.js';

class UserService {
  // Create new user
  static async createUser(userData) {
    const {
      user_name, first_name, middle_name, last_name, email,
      password, role_code, status_code, area, city, state, pincode
    } = userData;

    // Check if email already exists
    const existingUser = await User.findByLoginIdentifier(email);
    if (existingUser) {
      throw new Error('Email already registered');
    }

    // Check if username already exists
    const existingUserName = await User.findByLoginIdentifier(user_name);
    if (existingUserName) {
      throw new Error('Username already taken');
    }

    // Hash password
    const hashedPassword = await TokenService.hashPassword(password || 'Default@123');

    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();

      // Create user details
      const userResult = await User.create({
        user_name,
        first_name,
        middle_name,
        last_name,
        email,
        role_code: role_code || 'SE',
        status_code: status_code || 'ACT'
      });

      const userId = userResult.userId;

      // Create credentials
      await UserCredentials.create(userId, {
        user_name,
        email,
        password: hashedPassword
      });

      // Create address if provided
      if (area && city && state && pincode) {
        await connection.execute(
          `INSERT INTO user_address (user_id, area, city, state, pincode) 
           VALUES (?, ?, ?, ?, ?)`,
          [userId, area, city, state, pincode]
        );
      }

      await connection.commit();

      return {
        success: true,
        message: 'User created successfully',
        data: { userId }
      };

    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  // Update user
  static async updateUser(userId, updateData) {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const updated = await User.update(userId, updateData);
    if (!updated) {
      throw new Error('Failed to update user');
    }

    return {
      success: true,
      message: 'User updated successfully'
    };
  }

  // Delete user (soft delete)
  static async deleteUser(userId) {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    await User.softDelete(userId);

    return {
      success: true,
      message: 'User deleted successfully'
    };
  }

  // Deactivate user
  static async deactivateUser(userId) {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    if (user.status_code === 'DEA') {
      throw new Error('User is already deactivated');
    }

    await User.deactivate(userId);

    return {
      success: true,
      message: 'User deactivated successfully'
    };
  }

  // Activate user
  static async activateUser(userId) {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    if (user.status_code === 'ACT') {
      throw new Error('User is already active');
    }

    await User.activate(userId);

    return {
      success: true,
      message: 'User activated successfully'
    };
  }

  // Reset password
  static async resetPassword(email, newPassword) {
    const user = await User.findByLoginIdentifier(email);
    if (!user) {
      throw new Error('User not found');
    }

    const hashedPassword = await TokenService.hashPassword(newPassword);
    const updated = await UserCredentials.resetPassword(email, hashedPassword);

    if (!updated) {
      throw new Error('Failed to reset password');
    }

    return {
      success: true,
      message: 'Password reset successfully'
    };
  }

  // Change password
  static async changePassword(userId, oldPassword, newPassword) {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Get credentials
    const credentials = await UserCredentials.findByUserId(userId);
    
    // Verify old password
    const isValid = await TokenService.comparePassword(oldPassword, credentials.password);
    if (!isValid) {
      throw new Error('Current password is incorrect');
    }

    // Hash new password
    const hashedPassword = await TokenService.hashPassword(newPassword);
    const updated = await UserCredentials.updatePassword(userId, hashedPassword);

    if (!updated) {
      throw new Error('Failed to change password');
    }

    return {
      success: true,
      message: 'Password changed successfully'
    };
  }

  // Get all users with filters
  static async getAllUsers(filters = {}) {
    const result = await User.findAll(filters);

    return {
      success: true,
      data: {
        users: result.users.map(user => ({
          user_id: user.user_id,
          user_name: user.user_name,
          first_name: user.first_name,
          middle_name: user.middle_name,
          last_name: user.last_name,
          email: user.email,
          role: user.role_code,
          role_name: user.role_name,
          status: user.status_code,
          status_name: user.status_name,
          is_deleted: user.is_deleted,
          is_deactivated: user.is_deactivated,
          address: {
            area: user.area,
            city: user.city,
            state: user.state,
            pincode: user.pincode
          },
          created_at: user.created_at,
          updated_at: user.updated_at
        })),
        pagination: result.pagination
      }
    };
  }

  // Get user by ID
  static async getUserById(userId) {
    const user = await User.findById(userId);
    
    if (!user) {
      throw new Error('User not found');
    }

    return {
      success: true,
      data: {
        user_id: user.user_id,
        user_name: user.user_name,
        first_name: user.first_name,
        middle_name: user.middle_name,
        last_name: user.last_name,
        email: user.email,
        role: user.role_code,
        role_name: user.role_name,
        status: user.status_code,
        status_name: user.status_name,
        is_deleted: user.is_deleted,
        is_deactivated: user.is_deactivated,
        address: {
          area: user.area,
          city: user.city,
          state: user.state,
          pincode: user.pincode
        },
        created_at: user.created_at,
        updated_at: user.updated_at
      }
    };
  }

  // Get roles and statuses for filters
  static async getFilters() {
    const [roles] = await pool.execute('SELECT * FROM roles ORDER BY role_name');
    const [statuses] = await pool.execute('SELECT * FROM status ORDER BY status_name');
    
    return {
      success: true,
      data: {
        roles: [{ role_code: 'ALL', role_name: 'All Roles' }, ...roles],
        statuses: [{ status_code: 'ALL', status_name: 'All Status' }, ...statuses]
      }
    };
  }
}

export default UserService;