import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { View, ActivityIndicator, StyleSheet } from 'react-native';

import AuthNavigator from './AuthNavigator';
import AppNavigator from './AppNavigator';

export default function RootNavigator() {
    const { userToken, isLoading } = useAuth();

    // We no longer render a blank loading view here. Wait for AuthContext to resolve
    // and let expo-splash-screen handle the smooth transition.

    return (
        <NavigationContainer>
            {userToken ? <AppNavigator /> : <AuthNavigator />}
        </NavigationContainer>
    );
}

const styles = StyleSheet.create({});
