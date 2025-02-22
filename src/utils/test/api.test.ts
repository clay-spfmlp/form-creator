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
```

To use these tests, you'll need to:

1. Install the necessary dependencies:
```bash
npm install -D vitest @testing-library/react
```

2. Configure Vitest in your `vite.config.ts`:
```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/setupTests.ts'],
  },
});
```

3. Create a `setupTests.ts` file if you need any global test setup.

This test suite covers:

1. The `getBaseUrl` function behavior in different environments:
   - Browser environment
   - Vercel deployment
   - Local development with default and custom ports

2. The tRPC API configuration:
   - General structure
   - Logger link configuration
   - HTTP batch link configuration

3. SSR configuration

The tests mock the necessary global objects (`window`) and environment variables to test different scenarios. They also clean up after themselves to prevent test pollution.

Note that you might need to adapt the imports and paths according to your project structure. Also, depending on your actual implementation, you might need to mock more dependencies or adjust the expectati