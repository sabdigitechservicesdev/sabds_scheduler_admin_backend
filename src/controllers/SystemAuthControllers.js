import SystemAuthService from '../services/systemAuthServices.js';
import { formatResponse, successResponse, errorResponse } from '../utils/responseFormatter.js';

class SystemAuthController {
  static async register(req, res) {
    try {
      const result = await SystemAuthService.register(req.body);

      // Extract data from result
      const userData = result.user || result.data;
      const tokens = userData?.tokens || {};
      const { tokens: _, ...userWithoutTokens } = userData;

      // Always include all fields even if null
      const response = {
        status: 1,
        message: 'Registration successful',
        error: null,
        data: userWithoutTokens,
        token: tokens.accessToken ? {
          accessToken: tokens.accessToken,
          tokenType: tokens.tokenType || 'Bearer'
        } : null
      };

      return res.status(201).json(response);
    } catch (error) {
      console.error('Registration error:', error);

      let statusCode = 500;
      let errorMessage = 'Registration failed';
      let technicalError = process.env.NODE_ENV === 'development' ? error.message : null;

      if (error.message.includes('already')) {
        statusCode = 409;
        errorMessage = error.message;
      }

      return res.status(statusCode).json(
        errorResponse(errorMessage, technicalError, null)
      );
    }
  }

  static async login(req, res) {
    try {
      const { identifier, password } = req.body;
      const result = await SystemAuthService.login(identifier, password);

      // Extract data from result
      const userData = result.user || result.data;
      const tokens = userData?.tokens || result.tokens || {};
      const { tokens: _, ...userWithoutTokens } = userData || {};

      // Always include all fields even if null
      const response = {
        status: 1,
        message: 'Login successful',
        error: null,
        data: userWithoutTokens,
        token: tokens.accessToken ? {
          accessToken: tokens.accessToken,
          tokenType: tokens.tokenType || 'Bearer',
          ...(tokens.refreshToken && { refreshToken: tokens.refreshToken }),
          ...(tokens.expiresIn && { expiresIn: tokens.expiresIn })
        } : null
      };

      return res.status(200).json(response);
    } catch (error) {
      console.error('Login error:', error.message);

      let statusCode = 500;
      let errorMessage = 'Login failed';
      let technicalError = process.env.NODE_ENV === 'development' ? error.message : null;

      if (
        error.message === 'Invalid credentials' ||
        error.message === 'User not found' ||
        error.message.startsWith('Account is')
      ) {
        statusCode = 401;
        errorMessage = error.message;
      }

      return res.status(statusCode).json(
        errorResponse(errorMessage, technicalError, null)
      );
    }
  }

  static async getProfile(req, res) {
    try {
      const profile = await SystemAuthService.getProfile(req.user.adminId);

      // Remove tokens from profile data if they exist
      let profileData = profile;
      if (profile?.tokens) {
        const { tokens, ...profileWithoutTokens } = profile;
        profileData = profileWithoutTokens;
      }

      // Always include all fields even if null
      const response = {
        status: 1,
        message: 'Profile fetched successfully',
        error: null,
        data: profileData,
        token: null
      };

      return res.status(200).json(response);
    } catch (error) {
      console.error('Get profile error:', error);

      return res.status(500).json(
        errorResponse('Failed to fetch profile', process.env.NODE_ENV === 'development' ? error.message : null, null)
      );
    }
  }
}

export default SystemAuthController;