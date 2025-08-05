import jwt from 'jsonwebtoken';

/**
 * JWT Configuration and Constants
 */
export const JWT_CONFIG = {
  EXPIRY: '24h',
  ALGORITHM: 'HS256' as const,
} as const;

export const JWT_ERROR_MESSAGES = {
  SECRET_MISSING: 'JWT secret is not configured',
  TOKEN_EXPIRED: 'Token has expired',
  TOKEN_INVALID: 'Token is invalid',
  TOKEN_MALFORMED: 'Token is malformed',
  USER_NOT_FOUND: 'User not found',
} as const;

/**
 * JWT Payload interface
 */
export interface JWTPayload {
  userId: string;
  email: string;
  iat?: number;
  exp?: number;
}

/**
 * Get JWT secret from environment variables
 * @throws Error if JWT_SECRET is not configured
 */
function getJWTSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.trim().length === 0) {
    throw new Error(JWT_ERROR_MESSAGES.SECRET_MISSING);
  }
  return secret;
}

/**
 * Sign a JWT token with user payload
 * @param payload - User data to encode in the token
 * @returns Promise<string> - Signed JWT token
 * @throws Error if JWT_SECRET is not configured
 */
export async function signJWT(payload: Omit<JWTPayload, 'iat' | 'exp'>): Promise<string> {
  if (!payload || typeof payload !== 'object') {
    throw new Error('Invalid payload: payload must be an object');
  }
  
  if (!payload.userId || typeof payload.userId !== 'string' || payload.userId.trim().length === 0) {
    throw new Error('Invalid payload: userId is required and must be a non-empty string');
  }
  
  if (!payload.email || typeof payload.email !== 'string' || payload.email.trim().length === 0) {
    throw new Error('Invalid payload: email is required and must be a non-empty string');
  }

  const secret = getJWTSecret();
  
  return new Promise((resolve, reject) => {
    jwt.sign(
      payload,
      secret,
      {
        expiresIn: JWT_CONFIG.EXPIRY,
        algorithm: JWT_CONFIG.ALGORITHM,
      },
      (error, token) => {
        if (error || !token) {
          reject(error || new Error('Failed to sign token'));
          return;
        }
        resolve(token);
      }
    );
  });
}

/**
 * Verify and decode a JWT token
 * @param token - JWT token to verify
 * @returns Promise<JWTPayload> - Decoded payload
 * @throws Error if token is invalid, expired, or malformed
 */
export async function verifyJWT(token: string): Promise<JWTPayload> {
  const secret = getJWTSecret();
  
  // Check if token has the basic JWT structure (3 parts separated by dots)
  if (!token || typeof token !== 'string' || token.split('.').length !== 3) {
    throw new Error(JWT_ERROR_MESSAGES.TOKEN_MALFORMED);
  }
  
  return new Promise((resolve, reject) => {
    jwt.verify(token, secret, { algorithms: [JWT_CONFIG.ALGORITHM] }, (error, decoded) => {
      if (error) {
        if (error.name === 'TokenExpiredError') {
          reject(new Error(JWT_ERROR_MESSAGES.TOKEN_EXPIRED));
          return;
        }
        if (error.name === 'JsonWebTokenError') {
          // Check if it's a malformed token vs invalid signature
          if (error.message.includes('malformed') || error.message.includes('invalid token')) {
            reject(new Error(JWT_ERROR_MESSAGES.TOKEN_MALFORMED));
            return;
          }
          reject(new Error(JWT_ERROR_MESSAGES.TOKEN_INVALID));
          return;
        }
        reject(new Error(JWT_ERROR_MESSAGES.TOKEN_MALFORMED));
        return;
      }
      
      if (!decoded || typeof decoded === 'string') {
        reject(new Error(JWT_ERROR_MESSAGES.TOKEN_MALFORMED));
        return;
      }
      
      resolve(decoded as JWTPayload);
    });
  });
}

/**
 * Decode a JWT token without verification (for debugging/testing)
 * @param token - JWT token to decode
 * @returns JWTPayload | null - Decoded payload or null if malformed
 */
export function decodeJWT(token: string): JWTPayload | null {
  try {
    const decoded = jwt.decode(token);
    if (!decoded || typeof decoded === 'string') {
      return null;
    }
    return decoded as JWTPayload;
  } catch {
    return null;
  }
}