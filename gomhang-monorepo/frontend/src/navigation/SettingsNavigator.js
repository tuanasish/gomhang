import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import AdminStaffScreen from '../screens/manager/AdminStaffScreen';
import AdminCountersScreen from '../screens/manager/AdminCountersScreen';
import ProfileScreen from '../screens/common/ProfileScreen';
import SettingsMenuScreen from '../screens/manager/SettingsMenuScreen';

const Stack = createStackNavigator();

export default function SettingsNavigator() {
    return (
        <Stack.Navigator
            screenOptions={{
                headerShown: false,
            }}
        >
            <Stack.Screen name="SettingsMenu" component={SettingsMenuScreen} />
            <Stack.Screen name="AdminStaff" component={AdminStaffScreen} />
            <Stack.Screen name="AdminCounters" component={AdminCountersScreen} />
            <Stack.Screen name="Profile" component={ProfileScreen} />
        </Stack.Navigator>
    );
}
