import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../theme/theme';

import WorkerHomeScreen from '../screens/worker/WorkerHomeScreen';
// Import các màn hình mới
import StartShiftScreen from '../screens/worker/StartShiftScreen';
import WorkerHistoryScreen from '../screens/worker/WorkerHistoryScreen';
import OrderDetailScreen from '../screens/worker/OrderDetailScreen';

import ProfileScreen from '../screens/common/ProfileScreen';
import CreateOrderScreen from '../screens/worker/CreateOrderScreen';
import EndShiftScreen from '../screens/worker/EndShiftScreen';

// Admin/Manager screens reused for Worker
import AdminCustomersScreen from '../screens/manager/AdminCustomersScreen';
import AdminCountersScreen from '../screens/manager/AdminCountersScreen';
import CustomerDetailScreen from '../screens/manager/CustomerDetailScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

function WorkerTabNavigator() {
    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                tabBarIcon: ({ focused, color, size }) => {
                    let iconName;

                    if (route.name === 'HomeTab') {
                        iconName = focused ? 'home' : 'home-outline';
                    } else if (route.name === 'HistoryTab') { // Đổi tên Tab
                        iconName = focused ? 'calendar' : 'calendar-outline';
                    } else if (route.name === 'CustomersTab') {
                        iconName = focused ? 'people' : 'people-outline';
                    } else if (route.name === 'CountersTab') {
                        iconName = focused ? 'storefront' : 'storefront-outline';
                    } else if (route.name === 'ProfileTab') {
                        iconName = focused ? 'person' : 'person-outline';
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
                    marginTop: -5,
                }
            })}
        >
            <Tab.Screen name="HomeTab" component={WorkerHomeScreen} options={{ tabBarLabel: 'Trang chủ' }} />
            {/* Sử dụng History thay vì ShiftScreen chung */}
            <Tab.Screen name="HistoryTab" component={WorkerHistoryScreen} options={{ tabBarLabel: 'Lịch sử' }} />
            <Tab.Screen name="CustomersTab" component={AdminCustomersScreen} options={{ tabBarLabel: 'Khách hàng' }} />
            <Tab.Screen name="CountersTab" component={AdminCountersScreen} options={{ tabBarLabel: 'Quầy' }} />
            <Tab.Screen name="ProfileTab" component={ProfileScreen} options={{ tabBarLabel: 'Cá nhân' }} />
        </Tab.Navigator>
    );
}

export default function WorkerNavigator() {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            {/* Thêm màn hình StartShift trước Main Tab */}
            <Stack.Screen name="StartShift" component={StartShiftScreen} />
            <Stack.Screen name="WorkerMain" component={WorkerTabNavigator} />

            {/* Các màn hình popup / modal hoặc phụ */}
            <Stack.Screen
                name="CreateOrder"
                component={CreateOrderScreen}
                options={{ presentation: 'modal' }}
            />
            <Stack.Screen
                name="EndShift"
                component={EndShiftScreen}
                options={{ presentation: 'modal' }}
            />
            {/* Thêm OrderDetail */}
            <Stack.Screen name="OrderDetail" component={OrderDetailScreen} />
            <Stack.Screen name="CustomerDetail" component={CustomerDetailScreen} />
        </Stack.Navigator>
    );
}
