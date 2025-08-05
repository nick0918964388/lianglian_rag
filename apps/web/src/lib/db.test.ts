import { describe, it, expect } from 'vitest';
import { prisma, connectDatabase, disconnectDatabase, healthCheck } from './db';

describe('Database Connection', () => {
  it('should connect to database successfully', async () => {
    const result = await connectDatabase();
    expect(result).toBe(true);
  });

  it('should perform health check', async () => {
    const result = await healthCheck();
    expect(result.status).toBe('healthy');
    expect(result.timestamp).toBeDefined();
  });

  it('should execute raw queries', async () => {
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
  });

  it('should disconnect from database', async () => {
    await expect(disconnectDatabase()).resolves.not.toThrow();
  });
});