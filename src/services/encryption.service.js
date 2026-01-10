import crypto from 'crypto';

class EncryptionService {
  static algorithm = 'aes-256-cbc';
  
  static getKey() {
    // Use JWT_SECRET or fallback to default
    const secret = process.env.JWT_SECRET || 'SUBHAJITMAJUMDRREEIUUBB';
    // Ensure key is exactly 32 bytes
    return crypto.createHash('sha256').update(secret).digest();
  }

  static encryptToken(token) {
    try {
      const key = this.getKey();
      const iv = crypto.randomBytes(16); // Generate new IV for each encryption
      
      const cipher = crypto.createCipheriv(this.algorithm, key, iv);
      let encrypted = cipher.update(token, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      return {
        encryptedToken: encrypted,
        iv: iv.toString('hex')
      };
    } catch (error) {
      console.error('Encryption error:', error);
      throw new Error('Token encryption failed');
    }
  }

  static decryptToken(encryptedToken, ivHex) {
    try {
      const key = this.getKey();
      const iv = Buffer.from(ivHex, 'hex');
      
      const decipher = crypto.createDecipheriv(this.algorithm, key, iv);
      let decrypted = decipher.update(encryptedToken, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } catch (error) {
      console.error('Decryption error:', error);
      throw new Error('Token decryption failed');
    }
  }

  static encryptTokenForResponse(token) {
    try {
      const { encryptedToken, iv } = this.encryptToken(token);
      return encryptedToken + '.' + iv;
    } catch (error) {
      console.error('Encrypt for response error:', error);
      throw error;
    }
  }

  static decryptTokenFromResponse(encryptedString) {
    try {
      const [encryptedToken, iv] = encryptedString.split('.');
      if (!encryptedToken || !iv) {
        throw new Error('Invalid encrypted token format');
      }
      return this.decryptToken(encryptedToken, iv);
    } catch (error) {
      console.error('Decrypt from response error:', error);
      throw error;
    }
  }
}

export default EncryptionService;