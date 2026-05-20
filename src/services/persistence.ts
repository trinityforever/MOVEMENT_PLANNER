export type MemoryKey = 'user' | 'events' | 'venues' | 'tickets' | 'social';

export async function loadMemory(key: MemoryKey): Promise<unknown | null> {
  // Placeholder for local persistence integration.
  // Replace with Expo SecureStore / FileSystem or AsyncStorage as needed.
  return null;
}

export async function saveMemory(key: MemoryKey, value: unknown): Promise<void> {
  // Placeholder for local persistence integration.
}
