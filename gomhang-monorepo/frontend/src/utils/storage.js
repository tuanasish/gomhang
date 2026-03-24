import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const ACCESS_TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';
const USER_KEY = 'user';
const REMEMBER_ME_KEY = 'remember_me';

// Helper for Web compatibility (SecureStore is not available on web)
const isWeb = Platform.OS === 'web';

/**
 * Save access token
 */
export async function saveAccessToken(token) {
    if (isWeb) {
        localStorage.setItem(ACCESS_TOKEN_KEY, token);
    } else {
        await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, token);
    }
}

/**
 * Get access token
 */
export async function getAccessToken() {
    if (isWeb) {
        return localStorage.getItem(ACCESS_TOKEN_KEY);
    } else {
        return await SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
    }
}

/**
 * Save refresh token
 */
export async function saveRefreshToken(token) {
    if (isWeb) {
        localStorage.setItem(REFRESH_TOKEN_KEY, token);
    } else {
        await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, token);
    }
}

/**
 * Get refresh token
 */
export async function getRefreshToken() {
    if (isWeb) {
        return localStorage.getItem(REFRESH_TOKEN_KEY);
    } else {
        return await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
    }
}

/**
 * Save user data
 */
export async function saveUser(user) {
    const userStr = JSON.stringify(user);
    if (isWeb) {
        localStorage.setItem(USER_KEY, userStr);
    } else {
        await SecureStore.setItemAsync(USER_KEY, userStr);
    }
}

/**
 * Get user data
 */
export async function getUser() {
    let userStr;
    if (isWeb) {
        userStr = localStorage.getItem(USER_KEY);
    } else {
        userStr = await SecureStore.getItemAsync(USER_KEY);
    }

    if (!userStr) return null;
    try {
        return JSON.parse(userStr);
    } catch (e) {
        console.log('[STORAGE] getUser - Parse error', e);
        return null;
    }
}

/**
 * Save remember me flag
 */
export async function saveRememberMe(remember) {
    if (isWeb) {
        localStorage.setItem(REMEMBER_ME_KEY, String(remember));
    } else {
        await SecureStore.setItemAsync(REMEMBER_ME_KEY, String(remember));
    }
}

/**
 * Get remember me flag
 */
export async function getRememberMe() {
    if (isWeb) {
        return localStorage.getItem(REMEMBER_ME_KEY) === 'true';
    } else {
        const val = await SecureStore.getItemAsync(REMEMBER_ME_KEY);
        return val === 'true';
    }
}

/**
 * Remove all auth data
 */
export async function clearAuthData() {
    console.log('[STORAGE] clearAuthData - Clearing all auth data');
    if (isWeb) {
        localStorage.removeItem(ACCESS_TOKEN_KEY);
        localStorage.removeItem(REFRESH_TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
    } else {
        await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
        await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
        await SecureStore.deleteItemAsync(USER_KEY);
    }
    console.log('[STORAGE] clearAuthData - Done');
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated() {
    const token = await getAccessToken();
    return !!token;
}
