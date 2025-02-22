import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getBaseUrl, api } from './trpc';

describe('tRPC Configuration', () => {
  describe('getBaseUrl', () => {
    const originalWindow = global.window;
    const originalProcess = process;

    beforeEach(() => {
      // Reset window and process.env before each test
      vi.resetModules();
      process.env = {};
    });

    it('should return empty string when running in browser', () => {
      // Mock window to simulate browser environment
      global.window = {} as Window & typeof globalThis;
      expect(getBaseUrl()).toBe('');
    });

    it('should return Vercel URL when VERCEL_URL is set', () => {
      // Remove window to simulate server environment
      global.window = undefined as any;
      process.env.VERCEL_URL = 'my-app.vercel.app';
      expect(getBaseUrl()).toBe('https://my-app.vercel.app');
    });

    it('should return localhost URL with default port when no other conditions met', () => {
      // Remove window to simulate server environment
      global.window = undefined as any;
      process.env.PORT = undefined;
      expect(getBaseUrl()).toBe('http://localhost:3000');
    });

    it('should return localhost URL with custom port when PORT env is set', () => {
      // Remove window to simulate server environment
      global.window = undefined as any;
      process.env.PORT = '4000';
      expect(getBaseUrl()).toBe('http://localhost:4000');
    });
  });

  describe('api configuration', () => {
    it('should have correct configuration structure', () => {
      const config = api.config();
      
      expect(config).toHaveProperty('transformer');
      expect(config).toHaveProperty('links');
      expect(Array.isArray(config.links)).toBe(true);
      expect(config.links).toHaveLength(2);
    });

    it('should have logger link configured correctly', () => {
      const config = api.config();
      const loggerLink = config.links[0];

      // Test logger link in development environment
      process.env.NODE_ENV = 'development';
      expect(loggerLink.enabled({ direction: 'down', result: {} })).toBe(true);

      // Test logger link with error
      process.env.NODE_ENV = 'production';
      expect(loggerLink.enabled({ 
        direction: 'down', 
        result: new Error('test error') 
      })).toBe(true);

      // Test logger link in production without error
      expect(loggerLink.enabled({ 
        direction: 'down', 
        result: {} 
      })).toBe(false);
    });

    it('should have http batch link configured correctly', () => {
      const config = api.config();
      const httpLink = config.links[1];

      expect(httpLink).toHaveProperty('url');
      expect(httpLink.url).toMatch(/\/api\/trpc$/);
    });
  });

  describe('SSR Configuration', () => {
    it('should have SSR disabled', () => {
      expect(api.ssr).toBe(false);
    });
  });
});

// Clean up after tests
afterAll(() => {
  // Restore original window and process
  global.window = originalWindow;
  process = originalProcess;
});
