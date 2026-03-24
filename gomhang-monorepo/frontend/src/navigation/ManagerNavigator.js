import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../theme/theme';

import ManagerDashboardScreen from '../screens/manager/ManagerDashboardScreen';
import AdminShiftsScreen from '../screens/manager/AdminShiftsScreen';
import AdminCustomersScreen from '../screens/manager/AdminCustomersScreen';
import ManagerOrdersScreen from '../screens/manager/ManagerOrdersScreen';
import CustomerDetailScreen from '../screens/manager/CustomerDetailScreen';
import OrderDetailScreen from '../screens/worker/OrderDetailScreen';
import SettingsNavigator from './SettingsNavigator'; // Placeholder for settings stack

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

function ManagerTabNavigator() {
    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                tabBarIcon: ({ focused, color, size }) => {
                    let iconName;

                    if (route.name === 'Dashboard') {
                        iconName = focused ? 'stats-chart' : 'stats-chart-outline';
                    } else if (route.name === 'Orders') {
                        iconName = focused ? 'document-text' : 'document-text-outline';
                    } else if (route.name === 'Shifts') {
                        iconName = focused ? 'calendar' : 'calendar-outline';
                    } else if (route.name === 'Customers') {
                        iconName = focused ? 'people' : 'people-outline';
                    } else if (route.name === 'SettingsGroup') {
                        iconName = focused ? 'settings' : 'settings-outline';
                    }

                    return <Ionicons name={iconName} size={size} color={color} />;
                },
                tabBarActiveTintColor: theme.colors.primary.default,
                tabBarInactiveTintColor: 'gray',
                headerShown: false,
                tabBarStyle: {
                    height: 85,
                    paddingBottom: 20,
                    borderTopWidth: 1,
                    elevation: 5,
                },
                tabBarItemStyle: {
                    paddingTop: 5,
                    paddingBottom: 5,
                },
                tabBarLabelStyle: {
                    fontSize: 12,
                    marginTop: -5, // give label a bit more space from icon
                }
            })}
        >
            <Tab.Screen name="Dashboard" component={ManagerDashboardScreen} options={{ tabBarLabel: 'Tổng quan' }} />
            <Tab.Screen name="Shifts" component={AdminShiftsScreen} options={{ tabBarLabel: 'Ca làm' }} />
            <Tab.Screen name="Orders" component={ManagerOrdersScreen} options={{ tabBarLabel: 'Đơn hàng' }} />
            <Tab.Screen name="Customers" component={AdminCustomersScreen} options={{ tabBarLabel: 'Khách hàng' }} />
            <Tab.Screen name="SettingsGroup" component={SettingsNavigator} options={{ tabBarLabel: 'Cài đặt' }} />
        </Tab.Navigator>
    );
}

export default function ManagerNavigator() {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="ManagerMain" component={ManagerTabNavigator} />
            <Stack.Screen name="CustomerDetail" component={CustomerDetailScreen} />
            <Stack.Screen name="OrderDetail" component={OrderDetailScreen} />
        </Stack.Navigator>
    );
}
