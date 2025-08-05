import { describe, it, expect } from 'vitest';
import { PasswordUtils } from './password';

describe('PasswordUtils', () => {
  describe('hash', () => {
    it('should hash a password successfully', async () => {
      const password = 'TestPassword123!';
      const hash = await PasswordUtils.hash(password);
      
      expect(hash).toBeDefined();
      expect(hash).not.toBe(password);
      expect(hash.length).toBeGreaterThan(50);
    });

    it('should generate different hashes for the same password', async () => {
      const password = 'TestPassword123!';
      const hash1 = await PasswordUtils.hash(password);
      const hash2 = await PasswordUtils.hash(password);
      
      expect(hash1).not.toBe(hash2);
    });

    it('should throw error for empty password', async () => {
      await expect(PasswordUtils.hash('')).rejects.toThrow('Password is required');
    });

    it('should throw error for undefined password', async () => {
      await expect(PasswordUtils.hash(undefined as any)).rejects.toThrow('Password is required');
    });
  });

  describe('verify', () => {
    it('should verify correct password', async () => {
      const password = 'TestPassword123!';
      const hash = await PasswordUtils.hash(password);
      
      const isValid = await PasswordUtils.verify(password, hash);
      expect(isValid).toBe(true);
    });

    it('should reject incorrect password', async () => {
      const password = 'TestPassword123!';
      const wrongPassword = 'WrongPassword123!';
      const hash = await PasswordUtils.hash(password);
      
      const isValid = await PasswordUtils.verify(wrongPassword, hash);
      expect(isValid).toBe(false);
    });

    it('should return false for empty password', async () => {
      const hash = await PasswordUtils.hash('TestPassword123!');
      const isValid = await PasswordUtils.verify('', hash);
      expect(isValid).toBe(false);
    });

    it('should return false for empty hash', async () => {
      const isValid = await PasswordUtils.verify('TestPassword123!', '');
      expect(isValid).toBe(false);
    });

    it('should return false for invalid hash', async () => {
      const isValid = await PasswordUtils.verify('TestPassword123!', 'invalid-hash');
      expect(isValid).toBe(false);
    });
  });

  describe('validatePasswordStrength', () => {
    it('should accept strong password', () => {
      const result = PasswordUtils.validatePasswordStrength('StrongPass123!');
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('should reject password that is too short', () => {
      const result = PasswordUtils.validatePasswordStrength('Short1!');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must be at least 8 characters long');
    });

    it('should reject password that is too long', () => {
      const longPassword = 'A'.repeat(129) + '1!';
      const result = PasswordUtils.validatePasswordStrength(longPassword);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must be less than 128 characters long');
    });

    it('should reject password without lowercase letter', () => {
      const result = PasswordUtils.validatePasswordStrength('UPPERCASE123!');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one lowercase letter');
    });

    it('should reject password without uppercase letter', () => {
      const result = PasswordUtils.validatePasswordStrength('lowercase123!');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one uppercase letter');
    });

    it('should reject password without number', () => {
      const result = PasswordUtils.validatePasswordStrength('Password!');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one number');
    });

    it('should reject password without special character', () => {
      const result = PasswordUtils.validatePasswordStrength('Password123');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one special character');
    });

    it('should reject empty password', () => {
      const result = PasswordUtils.validatePasswordStrength('');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password is required');
    });

    it('should return multiple errors for weak password', () => {
      const result = PasswordUtils.validatePasswordStrength('weak');
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(1);
      expect(result.errors).toContain('Password must be at least 8 characters long');
      expect(result.errors).toContain('Password must contain at least one uppercase letter');
      expect(result.errors).toContain('Password must contain at least one number');
      expect(result.errors).toContain('Password must contain at least one special character');
    });
  });
});