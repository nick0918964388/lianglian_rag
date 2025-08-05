import { userRepository } from '../repositories/user.repository';
import { PasswordUtils } from '../auth/password';
import { ERROR_MESSAGES } from '../auth/constants';
import { signJWT } from '../auth/jwt';
import { User } from '@prisma/client';

export interface RegisterUserInput {
  email: string;
  password: string;
}

export interface RegisterUserResult {
  success: boolean;
  user?: Omit<User, 'passwordHash'>;
  errors?: string[];
}

export interface LoginUserInput {
  email: string;
  password: string;
}

export interface LoginUserResult {
  success: boolean;
  token?: string;
  user?: Omit<User, 'passwordHash'>;
  errors?: string[];
}

export class UserService {
  /**
   * Helper method to remove password hash from user object
   * @param user - User object with password hash
   * @returns User object without password hash
   */
  private static sanitizeUser(user: User): Omit<User, 'passwordHash'> {
    const { passwordHash: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  static async registerUser(input: RegisterUserInput): Promise<RegisterUserResult> {
    const { email, password } = input;

    try {
      // Validate password strength
      const passwordValidation = PasswordUtils.validatePasswordStrength(password);
      if (!passwordValidation.isValid) {
        return {
          success: false,
          errors: passwordValidation.errors,
        };
      }

      // Check if user already exists
      const existingUser = await userRepository.findByEmail(email);
      if (existingUser) {
        return {
          success: false,
          errors: [ERROR_MESSAGES.USER_EXISTS],
        };
      }

      // Hash password
      const passwordHash = await PasswordUtils.hash(password);

      // Create user
      const newUser = await userRepository.create({
        email,
        passwordHash,
      });

      return {
        success: true,
        user: this.sanitizeUser(newUser),
      };
    } catch (error) {
      // Log error for debugging but don't expose sensitive information
      if (process.env.NODE_ENV === 'development') {
        console.error('Error registering user:', error);
      }
      return {
        success: false,
        errors: [ERROR_MESSAGES.REGISTRATION_ERROR],
      };
    }
  }

  static async authenticateUser(email: string, password: string): Promise<User | null> {
    try {
      const user = await userRepository.findByEmail(email);
      if (!user) {
        return null;
      }

      const isValidPassword = await PasswordUtils.verify(password, user.passwordHash);
      if (!isValidPassword) {
        return null;
      }

      return user;
    } catch (error) {
      // Log error for debugging but don't expose sensitive information
      if (process.env.NODE_ENV === 'development') {
        console.error('Error authenticating user:', error);
      }
      return null;
    }
  }

  static async loginUser(input: LoginUserInput): Promise<LoginUserResult> {
    const { email, password } = input;

    try {
      // Find user by email
      const user = await userRepository.findByEmail(email);
      if (!user) {
        return {
          success: false,
          errors: [ERROR_MESSAGES.INVALID_CREDENTIALS],
        };
      }

      // Verify password
      const isValidPassword = await PasswordUtils.verify(password, user.passwordHash);
      if (!isValidPassword) {
        return {
          success: false,
          errors: [ERROR_MESSAGES.INVALID_CREDENTIALS],
        };
      }

      // Generate JWT token
      const token = await signJWT({
        userId: user.id,
        email: user.email,
      });

      return {
        success: true,
        token,
        user: this.sanitizeUser(user),
      };
    } catch (error) {
      // Log error for debugging but don't expose sensitive information
      if (process.env.NODE_ENV === 'development') {
        console.error('Error logging in user:', error);
      }
      return {
        success: false,
        errors: [ERROR_MESSAGES.LOGIN_ERROR],
      };
    }
  }
}