import bcrypt from 'bcrypt';
import { PASSWORD_CONFIG, ERROR_MESSAGES } from './constants';

export interface PasswordValidationResult {
  isValid: boolean;
  errors: string[];
}

export class PasswordUtils {
  static async hash(password: string): Promise<string> {
    if (!password?.trim()) {
      throw new Error(ERROR_MESSAGES.PASSWORD_REQUIRED);
    }
    
    return bcrypt.hash(password, PASSWORD_CONFIG.SALT_ROUNDS);
  }

  static async verify(password: string, hash: string): Promise<boolean> {
    if (!password || !hash) {
      return false;
    }
    
    return bcrypt.compare(password, hash);
  }

  static validatePasswordStrength(password: string): PasswordValidationResult {
    const errors: string[] = [];
    
    if (!password?.trim()) {
      errors.push(ERROR_MESSAGES.PASSWORD_REQUIRED);
      return { isValid: false, errors };
    }
    
    if (password.length < PASSWORD_CONFIG.MIN_LENGTH) {
      errors.push(ERROR_MESSAGES.PASSWORD_TOO_SHORT);
    }
    
    if (password.length > PASSWORD_CONFIG.MAX_LENGTH) {
      errors.push(ERROR_MESSAGES.PASSWORD_TOO_LONG);
    }
    
    if (!/[a-z]/.test(password)) {
      errors.push(ERROR_MESSAGES.PASSWORD_MISSING_LOWERCASE);
    }
    
    if (!/[A-Z]/.test(password)) {
      errors.push(ERROR_MESSAGES.PASSWORD_MISSING_UPPERCASE);
    }
    
    if (!/\d/.test(password)) {
      errors.push(ERROR_MESSAGES.PASSWORD_MISSING_NUMBER);
    }
    
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      errors.push(ERROR_MESSAGES.PASSWORD_MISSING_SPECIAL);
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
}