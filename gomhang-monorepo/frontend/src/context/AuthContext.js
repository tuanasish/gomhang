import React, { createContext, useState, useEffect } from 'react';
import { DeviceEventEmitter } from 'react-native';
import { loginAPI } from '../api/auth';
import {
    saveAccessToken,
    saveRefreshToken,
    saveUser,
    getAccessToken,
    getUser,
    clearAuthData
} from '../utils/storage';
import * as SplashScreen from 'expo-splash-screen';

export const AuthContext = createContext();

export const useAuth = () => React.useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [isLoading, setIsLoading] = useState(true);
    const [userToken, setUserToken] = useState(null);
    const [userInfo, setUserInfo] = useState(null);

    const login = async (email, password) => {
        setIsLoading(true);
        try {
            const res = await loginAPI(email, password);

            if (res.data?.success && res.data?.data) {
                const { accessToken, refreshToken, user } = res.data.data;

                await saveAccessToken(accessToken);
                await saveRefreshToken(refreshToken);
                await saveUser(user);

                setUserInfo(user);
                setUserToken(accessToken);
            } else {
                throw new Error(res.data?.error || 'Đăng nhập thất bại');
            }
        } catch (e) {
            console.error('Login error:', e);
            throw e;
        } finally {
            setIsLoading(false);
        }
    };

    const logout = async () => {
        setIsLoading(true);
        setUserToken(null);
        setUserInfo(null);
        await clearAuthData();
        setIsLoading(false);
    };

    const isLoggedIn = async () => {
        try {
            setIsLoading(true);
            let userToken = await getAccessToken();
            let userInfo = await getUser();

            if (userToken) {
                setUserToken(userToken);
                setUserInfo(userInfo);
            }
        } catch (e) {
            console.log('isLoggedIn error:', e);
        }
        setIsLoading(false);
    };

    useEffect(() => {
        isLoggedIn().then(() => {
            // Hide splash screen after checking auth status
            SplashScreen.hideAsync();
        });

        // Listen for auth expired events from axiosClient
        const authSubscription = DeviceEventEmitter.addListener('AUTH_EXPIRED', () => {
            logout();
        });

        return () => {
            authSubscription.remove();
        };
    }, []);

    return (
        <AuthContext.Provider value={{ login, logout, isLoading, userToken, userInfo }}>
            {children}
        </AuthContext.Provider>
    );
};
