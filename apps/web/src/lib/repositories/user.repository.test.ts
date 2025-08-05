import { describe, it, expect, beforeEach } from 'vitest';
import { UserRepository } from './user.repository';

const userRepository = new UserRepository();

describe('UserRepository', () => {
  const testUser = {
    email: 'test@example.com',
    passwordHash: 'hashedPassword123',
  };

  describe('create', () => {
    it('should create a new user', async () => {
      const user = await userRepository.create(testUser);
      
      expect(user).toBeDefined();
      expect(user.id).toBeDefined();
      expect(user.email).toBe(testUser.email);
      expect(user.passwordHash).toBe(testUser.passwordHash);
      expect(user.createdAt).toBeDefined();
      expect(user.updatedAt).toBeDefined();
    });

    it('should throw error for duplicate email', async () => {
      await userRepository.create(testUser);
      
      await expect(
        userRepository.create(testUser)
      ).rejects.toThrow('User with this email already exists');
    });
  });

  describe('findByEmail', () => {
    it('should find user by email', async () => {
      const createdUser = await userRepository.create(testUser);
      const foundUser = await userRepository.findByEmail(testUser.email);
      
      expect(foundUser).toBeDefined();
      expect(foundUser?.id).toBe(createdUser.id);
      expect(foundUser?.email).toBe(testUser.email);
    });

    it('should return null for non-existent email', async () => {
      const foundUser = await userRepository.findByEmail('nonexistent@example.com');
      expect(foundUser).toBeNull();
    });

    it('should throw error for invalid email format', async () => {
      await expect(
        userRepository.findByEmail('invalid-email')
      ).rejects.toThrow('Invalid email format');
    });
  });

  describe('findById', () => {
    it('should find user by ID', async () => {
      const createdUser = await userRepository.create(testUser);
      const foundUser = await userRepository.findById(createdUser.id);
      
      expect(foundUser).toBeDefined();
      expect(foundUser?.id).toBe(createdUser.id);
      expect(foundUser?.email).toBe(testUser.email);
    });

    it('should return null for non-existent ID', async () => {
      const foundUser = await userRepository.findById('nonexistent-id');
      expect(foundUser).toBeNull();
    });
  });

  describe('update', () => {
    it('should update user email', async () => {
      const createdUser = await userRepository.create(testUser);
      const newEmail = 'updated@example.com';
      
      const updatedUser = await userRepository.update(createdUser.id, {
        email: newEmail,
      });
      
      expect(updatedUser.email).toBe(newEmail);
      expect(updatedUser.passwordHash).toBe(testUser.passwordHash);
    });

    it('should update user password hash', async () => {
      const createdUser = await userRepository.create(testUser);
      const newPasswordHash = 'newHashedPassword456';
      
      const updatedUser = await userRepository.update(createdUser.id, {
        passwordHash: newPasswordHash,
      });
      
      expect(updatedUser.passwordHash).toBe(newPasswordHash);
      expect(updatedUser.email).toBe(testUser.email);
    });

    it('should throw error for non-existent user', async () => {
      await expect(
        userRepository.update('nonexistent-id', { email: 'new@example.com' })
      ).rejects.toThrow('User not found');
    });

    it('should throw error for invalid email format', async () => {
      const createdUser = await userRepository.create(testUser);
      
      await expect(
        userRepository.update(createdUser.id, { email: 'invalid-email' })
      ).rejects.toThrow('Invalid email format');
    });
  });

  describe('delete', () => {
    it('should delete user', async () => {
      const createdUser = await userRepository.create(testUser);
      const deletedUser = await userRepository.delete(createdUser.id);
      
      expect(deletedUser.id).toBe(createdUser.id);
      
      // Verify user is deleted
      const foundUser = await userRepository.findById(createdUser.id);
      expect(foundUser).toBeNull();
    });

    it('should throw error for non-existent user', async () => {
      await expect(
        userRepository.delete('nonexistent-id')
      ).rejects.toThrow('User not found');
    });
  });

  describe('findAll', () => {
    it('should return all users', async () => {
      await userRepository.create(testUser);
      await userRepository.create({
        email: 'test2@example.com',
        passwordHash: 'hashedPassword456',
      });
      
      const users = await userRepository.findAll();
      expect(users.length).toBe(2);
      expect(users[0].createdAt.getTime()).toBeGreaterThanOrEqual(users[1].createdAt.getTime());
    });

    it('should return empty array when no users exist', async () => {
      const users = await userRepository.findAll();
      expect(users).toEqual([]);
    });
  });

  describe('count', () => {
    it('should return user count', async () => {
      await userRepository.create(testUser);
      await userRepository.create({
        email: 'test2@example.com',
        passwordHash: 'hashedPassword456',
      });
      
      const count = await userRepository.count();
      expect(count).toBe(2);
    });

    it('should return 0 when no users exist', async () => {
      const count = await userRepository.count();
      expect(count).toBe(0);
    });
  });
});