import { successResponse, errorResponse, successResponseWithToken } from '../utils/responseFormatter.js';
import profileServices from '../services/systemProfile.service.js';

class profileController {
  static async getProfile(req, res) {
    try {
      const profile = await profileServices.getProfile(req.user.adminId);

      // Remove tokens from profile data if they exist
      let profileData = profile;
      if (profile?.tokens) {
        const { tokens, ...profileWithoutTokens } = profile;
        profileData = profileWithoutTokens;
      }

      return res.status(200).json(
        successResponse('Profile fetched successfully', profileData)
      );
    } catch (error) {
      console.error('Get profile error:', error);
      return res.status(500).json(
        errorResponse(
          'Failed to fetch profile',
          process.env.NODE_ENV === 'development' ? error.message : null
        )
      );
    }
  }

  static async decryptToken(req, res) {
    try {
      const { encryptedToken } = req.body;

      // Validation is already done by middleware
      const result = await profileServices.decryptToken(encryptedToken);

      return res.status(200).json(
        successResponseWithToken(
          'Token decrypted successfully',
          {
            decoded: result.decoded
          },
          result.originalToken,  // This is the original JWT token
          'Bearer'
        )
      );
    } catch (error) {
      console.error('Decrypt token error:', error.message);

      let statusCode = 400;
      let errorMessage = 'Token decryption failed';

      if (error.message.includes('Invalid') || error.message.includes('expired')) {
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
}

export default profileController;