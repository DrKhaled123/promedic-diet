/**
 * PocketBase Service - Production-Grade Secure Data Access
 * 
 * Following best practices from:
 * - Clean Code principles
 * - 12-Factor App methodology
 * - Defense in depth security
 */

import PocketBase, { RecordModel } from 'pocketbase';

// Configuration
const PB_URL = '/api';
const DEVICE_KEY = 'pb_device_id';
const AUTH_TOKEN_KEY = 'pb_auth_token';

// Types
export interface DietFollowUp extends RecordModel {
  name?: string;
  phone?: string;
  email?: string;
  age?: number;
  weekly_data?: Record<string, any>;
  question?: string;
  user_id?: string;
}

export interface UserProgress extends RecordModel {
  user: string;
  data_type: string;
  payload: Record<string, any>;
}

// Initialize PocketBase client
const pb = new PocketBase(PB_URL);

/**
 * Get or create device identifier
 * Uses crypto.randomUUID() for production-grade uniqueness
 */
function getOrCreateDeviceId(): string {
  let id = localStorage.getItem(DEVICE_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(DEVICE_KEY, id);
  }
  return id;
}

/**
 * Get device credentials (deterministic - same device = same credentials)
 */
function getDeviceCredentials() {
  const deviceId = getOrCreateDeviceId();
  return {
    email: `${deviceId}@device.local`,
    password: deviceId,
  };
}

/**
 * Ensure user is authenticated
 * Creates device-based account if doesn't exist
 */
export async function ensureAuth(): Promise<void> {
  // Skip if already valid
  if (pb.authStore.isValid) return;

  const { email, password } = getDeviceCredentials();

  try {
    // Try to login
    await pb.collection('users').authWithPassword(email, password);
  } catch {
    // First time - register the device
    try {
      await pb.collection('users').create({
        email,
        password,
        passwordConfirm: password,
        // emailVisibility: false by default - keeps email private
      });
      // Login after registration
      await pb.collection('users').authWithPassword(email, password);
    } catch (createErr: any) {
      console.error('Failed to create device user:', createErr);
      throw new Error('Authentication failed');
    }
  }
}

/**
 * Refresh token if close to expiry
 * Prevents silent auth loss after 7 days
 */
export async function refreshIfNeeded(): Promise<void> {
  if (!pb.authStore.isValid) {
    await ensureAuth();
    return;
  }

  const token = pb.authStore.token;
  if (!token) {
    await ensureAuth();
    return;
  }

  try {
    // Decode token to check expiry
    const payload = JSON.parse(atob(token.split('.')[1]));
    const expiresInMs = payload.exp * 1000 - Date.now();
    
    // Refresh if less than 24 hours until expiry
    if (expiresInMs < 86_400_000) {
      await pb.collection('users').authRefresh();
    }
  } catch {
    // Token decode failed - re-auth
    await ensureAuth();
  }
}

/**
 * Logout and clear all auth data
 */
export function logout(): void {
  pb.authStore.clear();
  localStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem(DEVICE_KEY);
}

/**
 * Get current user ID
 */
export function getCurrentUserId(): string | null {
  return pb.authStore.model?.id ?? null;
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  return pb.authStore.isValid;
}

// ====================
// Diet Follow Ups API
// ====================

/**
 * Get user's diet follow up record
 * Automatically filtered by PocketBase rules
 */
export async function getDietFollowUp(): Promise<DietFollowUp | null> {
  await ensureAuth();
  
  const userId = getCurrentUserId();
  if (!userId) return null;

  try {
    const records = await pb.collection('diet_follow_ups').getList(1, 1, {
      filter: `user_id = "${userId}"`,
    });
    
    return (records.items[0] as DietFollowUp) ?? null;
  } catch (err) {
    console.error('Failed to get diet follow up:', err);
    return null;
  }
}

/**
 * Create or update diet follow up
 * CRITICAL: Always sets user_id on create
 */
export async function saveDietFollowUp(data: Partial<DietFollowUp>): Promise<DietFollowUp | null> {
  await ensureAuth();

  const userId = getCurrentUserId();
  if (!userId) throw new Error('Not authenticated');

  try {
    const existing = await getDietFollowUp();
    
    if (existing?.id) {
      // Update - user_id already set, rules will verify ownership
      const record = await pb.collection('diet_follow_ups').update(existing.id, data);
      return record as DietFollowUp;
    } else {
      // Create - MUST set user_id or record will be unreachable
      const record = await pb.collection('diet_follow_ups').create({
        ...data,
        user_id: userId, // ← CRITICAL: Required for ownership
      });
      return record as DietFollowUp;
    }
  } catch (err) {
    console.error('Failed to save diet follow up:', err);
    throw err;
  }
}

/**
 * Update weekly data specifically
 */
export async function updateWeeklyData(weekData: Record<string, any>): Promise<boolean> {
  try {
    const existing = await getDietFollowUp();
    
    const weekly_data = {
      ...(existing?.weekly_data ?? {}),
      ...weekData,
      lastUpdated: new Date().toISOString(),
    };

    await saveDietFollowUp({ weekly_data });
    return true;
  } catch (err) {
    console.error('Failed to update weekly data:', err);
    return false;
  }
}

// ====================
// User Progress API
// ====================

/**
 * Save user progress data
 * CRITICAL: Always sets user field
 */
export async function saveProgress(
  dataType: string, 
  payload: Record<string, any>
): Promise<UserProgress | null> {
  await ensureAuth();

  const userId = getCurrentUserId();
  if (!userId) throw new Error('Not authenticated');

  try {
    const record = await pb.collection('user_progress').create({
      user: userId, // ← CRITICAL: Required for ownership
      data_type: dataType,
      payload,
    });
    
    return record as UserProgress;
  } catch (err) {
    console.error('Failed to save progress:', err);
    throw err;
  }
}

/**
 * Get user progress by type
 */
export async function getProgressByType(dataType: string): Promise<UserProgress[]> {
  await ensureAuth();

  const userId = getCurrentUserId();
  if (!userId) return [];

  try {
    const records = await pb.collection('user_progress').getFullList({
      filter: `user = "${userId}" && data_type = "${dataType}"`,
      sort: '-created',
    });
    
    return records as UserProgress[];
  } catch (err) {
    console.error('Failed to get progress:', err);
    return [];
  }
}

// ====================
// Event Listeners
// ====================

/**
 * Auto-reauthenticate on token invalidation
 */
pb.authStore.onChange((token) => {
  if (!token) {
    // Token became invalid - re-authenticate
    ensureAuth().catch(console.error);
  }
  
  // Persist token
  if (token) {
    localStorage.setItem(AUTH_TOKEN_KEY, token);
  } else {
    localStorage.removeItem(AUTH_TOKEN_KEY);
  }
});

// Restore token from storage on load
const savedToken = localStorage.getItem(AUTH_TOKEN_KEY);
if (savedToken) {
  pb.authStore.save(savedToken, null);
}

// Export the configured client for advanced use cases
export { pb };
