import systemAuthService from '../services/systemAuth.service.js';
import { successResponse, errorResponse, successResponseWithEncryptedToken } from '../utils/responseFormatter.js';

class systemAuthController {
  static async register(req, res) {
    try {
      const result = await systemAuthService.register(req.body);

      // Extract data from result
      const userData = result.user || result.data;

      return res.status(201).json(
        successResponse('Registration successful', userData)
      );
    } catch (error) {
      console.error('Registration error:', error);

      let statusCode = 500;
      let errorMessage = 'Registration failed';

      if (error.message.includes('already')) {
        statusCode = 409;
        errorMessage = error.message;
      }

      return res.status(statusCode).json(
        errorResponse(
          errorMessage,
          process.env.NODE_ENV === 'development' ? error.message : null
        )
      );
    }
  }

  static async login(req, res) {
    try {
      const { identifier, password } = req.body;
      const result = await systemAuthService.login(identifier, password);

      // Extract user data and tokens
      const userData = result.user || result.data;
      const tokens = result.tokens || {};

      // If we have tokens, return with encrypted token format
      if (tokens.accessToken) {
        return res.status(200).json(
          successResponseWithEncryptedToken(
            result.message || 'Login successful',
            userData,
            tokens.accessToken  // This is the encrypted token
          )
        );
      }

      // If no tokens, return regular success response
      return res.status(200).json(
        successResponse(result.message || 'Login successful', userData)
      );
    } catch (error) {
      console.error('Login error:', error.message);

      let statusCode = 500;
      let errorMessage = 'Login failed';

      if (
        error.message === 'Invalid credentials' ||
        error.message === 'User not found' ||
        error.message.startsWith('Account is')
      ) {
        statusCode = 401;
        errorMessage = error.message;
      }

      return res.status(statusCode).json(
        errorResponse(
          errorMessage,
          process.env.NODE_ENV === 'development' ? error.message : null
        )
      );
    }
  }

  static async forgotPassword(req, res) {
    try {
      const { identifier, new_password } = req.body;

      if (!identifier || !new_password) {
        return res.status(400).json(
          errorResponse('Email or username and new password are required')
        );
      }

      const result = await systemAuthService.forgotPassword(identifier, new_password);

      return res.status(200).json(
        successResponse(result.message)
      );
    } catch (error) {
      console.error('Forgot password error:', error.message);

      let statusCode = 500;
      let errorMessage = 'Password reset failed';

      if (error.message === 'User not found' ||
        error.message === 'Account is deactivated' ||
        error.message === 'Account is deleted') {
        statusCode = 404;
        errorMessage = error.message;
      } else if (error.message.includes('not active') || error.message.includes('Account is')) {
        statusCode = 403;
        errorMessage = error.message;
      }

      return res.status(statusCode).json(
        errorResponse(
          errorMessage,
          process.env.NODE_ENV === 'development' ? error.message : null
        )
      );
    }
  }
}

export default systemAuthController;