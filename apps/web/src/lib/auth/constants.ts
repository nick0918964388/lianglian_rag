/**
 * Authentication and password security constants
 */

export const PASSWORD_CONFIG = {
  SALT_ROUNDS: 12,
  MIN_LENGTH: 8,
  MAX_LENGTH: 128,
} as const;

export const EMAIL_CONFIG = {
  MAX_LENGTH: 255,
} as const;

export const ERROR_MESSAGES = {
  PASSWORD_REQUIRED: 'Password is required',
  EMAIL_REQUIRED: 'Email is required',
  INVALID_EMAIL: 'Invalid email format',
  EMAIL_TOO_LONG: 'Email too long',
  PASSWORD_TOO_SHORT: 'Password must be at least 8 characters long',
  PASSWORD_TOO_LONG: 'Password must be less than 128 characters long',
  PASSWORD_MISSING_LOWERCASE: 'Password must contain at least one lowercase letter',
  PASSWORD_MISSING_UPPERCASE: 'Password must contain at least one uppercase letter',
  PASSWORD_MISSING_NUMBER: 'Password must contain at least one number',
  PASSWORD_MISSING_SPECIAL: 'Password must contain at least one special character',
  USER_EXISTS: 'User with this email already exists',
  REGISTRATION_SUCCESS: 'User registered successfully',
  REGISTRATION_ERROR: 'An unexpected error occurred during registration',
  PASSWORD_STRENGTH_ERROR: 'Password does not meet strength requirements',
  INVALID_CREDENTIALS: 'Invalid email or password',
  LOGIN_SUCCESS: 'Login successful',
  LOGIN_ERROR: 'An unexpected error occurred during login',
} as const;