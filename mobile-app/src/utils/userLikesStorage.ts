import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@legacylens_user_liked_posts';

// In-memory cache for instant UI rendering without layout jumps
let cachedLikes: Set<string> | null = null;
let isLoaded = false;
const listeners = new Set<(postId: string, liked: boolean) => void>();

export const userLikesStorage = {
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

