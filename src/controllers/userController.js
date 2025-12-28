import UserService from '../services/userServices.js';

class UserController {
  // Create user
  static async createUser(req, res) {
    try {
      const result = await UserService.createUser(req.body);
      
      return res.status(201).json(result);
    } catch (error) {
      console.error('Create user error:', error);
      
      if (error.message.includes('already')) {
        return res.status(409).json({
          success: false,
          message: error.message
        });
      }

      return res.status(500).json({
        success: false,
        message: 'Failed to create user'
      });
    }
  }

  // Update user
  static async updateUser(req, res) {
    try {
      const { userId } = req.params;
      const result = await UserService.updateUser(userId, req.body);
      
      return res.status(200).json(result);
    } catch (error) {
      console.error('Update user error:', error);
      
      if (error.message.includes('not found')) {
        return res.status(404).json({
          success: false,
          message: error.message
        });
      }

      return res.status(500).json({
        success: false,
        message: 'Failed to update user'
      });
    }
  }

  // Delete user
  static async deleteUser(req, res) {
    try {
      const { userId } = req.params;
      const result = await UserService.deleteUser(userId);
      
      return res.status(200).json(result);
    } catch (error) {
      console.error('Delete user error:', error);
      
      if (error.message.includes('not found')) {
        return res.status(404).json({
          success: false,
          message: error.message
        });
      }

      return res.status(500).json({
        success: false,
        message: 'Failed to delete user'
      });
    }
  }

  // Deactivate user
  static async deactivateUser(req, res) {
    try {
      const { userId } = req.params;
      const result = await UserService.deactivateUser(userId);
      
      return res.status(200).json(result);
    } catch (error) {
      console.error('Deactivate user error:', error);
      
      if (error.message.includes('not found')) {
        return res.status(404).json({
          success: false,
          message: error.message
        });
      }

      if (error.message.includes('already')) {
        return res.status(400).json({
          success: false,
          message: error.message
        });
      }

      return res.status(500).json({
        success: false,
        message: 'Failed to deactivate user'
      });
    }
  }

  // Activate user
  static async activateUser(req, res) {
    try {
      const { userId } = req.params;
      const result = await UserService.activateUser(userId);
      
      return res.status(200).json(result);
    } catch (error) {
      console.error('Activate user error:', error);
      
      if (error.message.includes('not found')) {
        return res.status(404).json({
          success: false,
          message: error.message
        });
      }

      if (error.message.includes('already')) {
        return res.status(400).json({
          success: false,
          message: error.message
        });
      }

      return res.status(500).json({
        success: false,
        message: 'Failed to activate user'
      });
    }
  }

  // Reset password
  static async resetPassword(req, res) {
    try {
      const { email, newPassword } = req.body;
      const result = await UserService.resetPassword(email, newPassword);
      
      return res.status(200).json(result);
    } catch (error) {
      console.error('Reset password error:', error);
      
      if (error.message.includes('not found')) {
        return res.status(404).json({
          success: false,
          message: error.message
        });
      }

      return res.status(500).json({
        success: false,
        message: 'Failed to reset password'
      });
    }
  }

  // Change password
  static async changePassword(req, res) {
    try {
      const { userId } = req.params;
      const { currentPassword, newPassword } = req.body;
      
      const result = await UserService.changePassword(userId, currentPassword, newPassword);
      
      return res.status(200).json(result);
    } catch (error) {
      console.error('Change password error:', error);
      
      if (error.message.includes('not found') || error.message.includes('incorrect')) {
        return res.status(400).json({
          success: false,
          message: error.message
        });
      }

      return res.status(500).json({
        success: false,
        message: 'Failed to change password'
      });
    }
  }

  // Get all users
  static async getAllUsers(req, res) {
    try {
      const filters = {
        role: req.query.role || 'ALL',
        status: req.query.status || 'ALL',
        search: req.query.search || '',
        page: req.query.page || 1,
        limit: req.query.limit || 10
      };

      const result = await UserService.getAllUsers(filters);
      
      return res.status(200).json(result);
    } catch (error) {
      console.error('Get users error:', error);
      
      return res.status(500).json({
        success: false,
        message: 'Failed to get users'
      });
    }
  }

  // Get user by ID
  static async getUserById(req, res) {
    try {
      const { userId } = req.params;
      const result = await UserService.getUserById(userId);
      
      return res.status(200).json(result);
    } catch (error) {
      console.error('Get user error:', error);
      
      if (error.message.includes('not found')) {
        return res.status(404).json({
          success: false,
          message: error.message
        });
      }

      return res.status(500).json({
        success: false,
        message: 'Failed to get user'
      });
    }
  }

  // Get filter options
  static async getFilterOptions(req, res) {
    try {
      const result = await UserService.getFilters();
      
      return res.status(200).json(result);
    } catch (error) {
      console.error('Get filters error:', error);
      
      return res.status(500).json({
        success: false,
        message: 'Failed to get filter options'
      });
    }
  }
}

export default UserController;