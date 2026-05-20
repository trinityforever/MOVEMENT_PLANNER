import { loadMemory, saveMemory, MemoryKey } from './persistence';

describe('persistence', () => {
  describe('loadMemory', () => {
    it('returns null for any key (placeholder implementation)', async () => {
      const keys: MemoryKey[] = ['user', 'events', 'venues', 'tickets', 'social'];
      for (const key of keys) {
        const result = await loadMemory(key);
        expect(result).toBeNull();
      }
    });
  });

  describe('saveMemory', () => {
    it('resolves without error (placeholder implementation)', async () => {
      await expect(saveMemory('events', { test: true })).resolves.toBeUndefined();
    });
  });
});
