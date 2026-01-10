import OTPService from '../services/systemOTP.service.js';

const deviceInfoMiddleware = (req, res, next) => {
  // Extract device info from request
  req.deviceInfo = OTPService.extractDeviceInfo(req);
  next();
};

export default deviceInfoMiddleware;