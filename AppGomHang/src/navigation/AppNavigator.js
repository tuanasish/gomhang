import React from 'react';
import { useAuth } from '../context/AuthContext';
import ManagerNavigator from './ManagerNavigator';
import WorkerNavigator from './WorkerNavigator';
import { View, ActivityIndicator } from 'react-native';

export default function AppNavigator() {
    const { userInfo } = useAuth();

    // The splash screen handles the blank state.
    if (!userInfo) {
        return <View style={{ flex: 1, backgroundColor: '#fff' }} />;
    }

    if (userInfo.role === 'admin' || userInfo.role === 'manager') {
        return <ManagerNavigator />;
    }

    return <WorkerNavigator />;
}
