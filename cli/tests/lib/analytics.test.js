import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('analytics', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    delete process.env.CHUB_TELEMETRY;
  });

  it('trackEvent does not throw when posthog-node is missing', async () => {
    // posthog-node won't be installed in test env — should silently skip
    const { trackEvent } = await import('../../src/lib/analytics.js');
    await expect(trackEvent('test_event', { foo: 'bar' })).resolves.not.toThrow();
  });

  it('trackEvent does nothing when telemetry is disabled', async () => {
    process.env.CHUB_TELEMETRY = '0';
    const { trackEvent } = await import('../../src/lib/analytics.js');
    await expect(trackEvent('test_event', {})).resolves.not.toThrow();
  });

  it('shutdownAnalytics does not throw when not initialized', async () => {
    const { shutdownAnalytics } = await import('../../src/lib/analytics.js');
    await expect(shutdownAnalytics()).resolves.not.toThrow();
  });
});
