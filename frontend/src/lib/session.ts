import { ChatMessage, FarmerProfile } from "../types";

export const CHAT_HISTORY_KEY = "agribot_chat_history";
export const FARMER_PROFILE_KEY = "agribot_farmer_profile";
export const LAST_ACTIVE_KEY = "agribot_chat_last_active";

// 1 day duration in milliseconds (24 hours)
export const SESSION_DURATION_MS = 24 * 60 * 60 * 1000;

/**
 * Checks if the chat session has expired (> 24 hours of inactivity).
 * If expired, automatically deletes chat history, user profile data, and last active timestamp.
 * Returns true if the session was expired and cleaned, false otherwise.
 */
export function checkAndCleanChatSession(): boolean {
  try {
    const lastActiveStr = localStorage.getItem(LAST_ACTIVE_KEY);
    if (lastActiveStr) {
      const lastActive = parseInt(lastActiveStr, 10);
      const now = Date.now();
      if (!isNaN(lastActive) && now - lastActive > SESSION_DURATION_MS) {
        // Expired! Delete chat history, user profile, and timestamp
        localStorage.removeItem(CHAT_HISTORY_KEY);
        localStorage.removeItem(FARMER_PROFILE_KEY);
        localStorage.removeItem(LAST_ACTIVE_KEY);
        return true;
      }
    }
  } catch (e) {
    console.error("Error checking chat session expiration:", e);
  }
  return false;
}

/**
 * Updates the last active timestamp to now.
 */
export function touchChatSession(): void {
  try {
    localStorage.setItem(LAST_ACTIVE_KEY, Date.now().toString());
  } catch (e) {
    console.error("Error updating chat session timestamp:", e);
  }
}

/**
 * Returns saved farmer profile if session is still valid.
 */
export function getFarmerProfile(): FarmerProfile | null {
  checkAndCleanChatSession();
  try {
    const saved = localStorage.getItem(FARMER_PROFILE_KEY);
    if (saved) return JSON.parse(saved);
  } catch (e) {
    console.error("Error loading farmer profile:", e);
  }
  return null;
}

/**
 * Saves farmer profile and touches active timestamp.
 */
export function saveFarmerProfileSession(profile: FarmerProfile): void {
  try {
    localStorage.setItem(FARMER_PROFILE_KEY, JSON.stringify(profile));
    touchChatSession();
  } catch (e) {
    console.error("Error saving farmer profile:", e);
  }
}

/**
 * Returns saved chat history if session is still valid.
 */
export function getChatHistory(): ChatMessage[] {
  checkAndCleanChatSession();
  try {
    const saved = localStorage.getItem(CHAT_HISTORY_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.error("Error loading chat history:", e);
  }
  return [];
}

/**
 * Saves chat history and touches active timestamp.
 */
export function saveChatHistorySession(messages: ChatMessage[]): void {
  try {
    localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(messages));
    touchChatSession();
  } catch (e) {
    console.error("Error saving chat history:", e);
  }
}

/**
 * Manually clear the session data.
 */
export function clearChatSessionData(): void {
  try {
    localStorage.removeItem(CHAT_HISTORY_KEY);
    localStorage.removeItem(FARMER_PROFILE_KEY);
    localStorage.removeItem(LAST_ACTIVE_KEY);
  } catch (e) {
    console.error("Error clearing chat session:", e);
  }
}
