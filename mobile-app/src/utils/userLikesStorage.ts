import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@legacylens_user_liked_posts';
const CLIENT_ID_KEY = '@legacylens_client_device_id';

// In-memory cache for instant UI rendering without layout jumps
let cachedLikes: Set<string> | null = null;
let cachedClientId: string | null = null;
let isLoaded = false;
const listeners = new Set<(postId: string, liked: boolean) => void>();

function generateUuid(): string {
  return 'dev-' + Math.random().toString(36).substring(2, 10) + '-' + Date.now().toString(36);
}

export const userLikesStorage = {
  async getClientId(): Promise<string> {
    if (cachedClientId) return cachedClientId;
    try {
      const stored = await AsyncStorage.getItem(CLIENT_ID_KEY);
      if (stored && stored.trim()) {
        cachedClientId = stored.trim();
        return cachedClientId;
      }
      const newId = generateUuid();
      cachedClientId = newId;
      await AsyncStorage.setItem(CLIENT_ID_KEY, newId);
      return newId;
    } catch {
      if (!cachedClientId) cachedClientId = generateUuid();
      return cachedClientId;
    }
  },

  getClientIdSync(): string | null {
    return cachedClientId;
  },

  async getLikes(): Promise<Set<string>> {
    if (cachedLikes !== null) {
      return cachedLikes;
    }
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed)) {
          cachedLikes = new Set(parsed.map(String));
          isLoaded = true;
          return cachedLikes;
        }
      }
    } catch (err) {
      console.log('Error reading liked posts from storage:', err);
    }
    cachedLikes = new Set();
    isLoaded = true;
    return cachedLikes;
  },

  isLikedSync(postId: string | number): boolean {
    if (!cachedLikes || !postId) return false;
    return cachedLikes.has(String(postId));
  },

  async isLiked(postId: string | number): Promise<boolean> {
    const likes = await this.getLikes();
    return likes.has(String(postId));
  },

  async setLiked(postId: string | number, liked: boolean): Promise<void> {
    const idStr = String(postId);
    const likes = await this.getLikes();
    if (liked) {
      likes.add(idStr);
    } else {
      likes.delete(idStr);
    }
    cachedLikes = new Set(likes);

    // Notify all active card listeners
    listeners.forEach((listener) => {
      try {
        listener(idStr, liked);
      } catch (e) {
        console.log('Error in like listener:', e);
      }
    });

    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(likes)));
    } catch (err) {
      console.log('Error persisting liked posts to storage:', err);
    }
  },

  subscribe(listener: (postId: string, liked: boolean) => void): () => void {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
};

// Immediate pre-fetch on module load
userLikesStorage.getLikes().catch(() => {});
userLikesStorage.getClientId().catch(() => {});
