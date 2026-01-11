import systemPicklistService from '../services/systemPickList.service.js';
import { successResponse, errorResponse } from '../utils/responseFormatter.js';

class PicklistController {

  static async getAllAdminRoles(req, res) {
    try {
      const data = await systemPicklistService.getAllAdminRoles();
      return res.status(200).json(
        successResponse('Admin roles fetched successfully', data)
      );
    } catch (error) {
      console.error('Error in PicklistController.getAllAdminRoles:', error.message);
      return res.status(500).json(
        errorResponse('Failed to fetch admin roles')
      );
    }
  }

}

export default PicklistController;