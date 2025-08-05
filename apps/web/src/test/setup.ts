import { beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/lianglian_rag_test?schema=public';
process.env.JWT_SECRET = 'test-jwt-secret-for-vitest-tests';

// Global React and DOM setup
global.React = require('react');

// Mock ResizeObserver which is used by Ant Design components
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Mock matchMedia which is used by Ant Design components
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => {},
  }),
});

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Database setup for integration tests
let prisma: any;

beforeAll(async () => {
  try {
    // Only import and connect to database if available
    const { prisma: db } = await import('../lib/db');
    prisma = db;
    await prisma.$connect();
  } catch (error) {
    console.log('Database not available for tests, skipping database setup');
  }
});

afterAll(async () => {
  if (prisma) {
    await prisma.$disconnect();
  }
});

beforeEach(async () => {
  if (prisma) {
    try {
      // Clean up database before each test
      const tablenames = await prisma.$queryRaw<Array<{ tablename: string }>>`
        SELECT tablename FROM pg_tables WHERE schemaname='public'
      `;
      
      const tables = tablenames
        .map(({ tablename }) => tablename)
        .filter((name) => name !== '_prisma_migrations')
        .map((name) => `"public"."${name}"`)
        .join(', ');

      if (tables.length > 0) {
        await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${tables} CASCADE;`);
      }
    } catch (error) {
      console.log('Database cleanup skipped:', error);
    }
  }
});