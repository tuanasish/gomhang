import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
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
import AdminCountersScreen from '../screens/manager/AdminCountersScreen';
import CustomerDetailScreen from '../screens/manager/CustomerDetailScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Nút Custom nổi nổi lên ở giữa
const CustomTabBarButton = ({ children, onPress }) => (
    <TouchableOpacity
        style={styles.customTabBarButton}
        onPress={onPress}
        activeOpacity={0.8}
    >
        <View style={styles.customTabBarButtonInner}>
            {children}
        </View>
    </TouchableOpacity>
);

function WorkerTabNavigator({ navigation }) {
    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                tabBarIcon: ({ focused, color, size }) => {
                    let iconName;

                    if (route.name === 'HomeTab') {
                        iconName = focused ? 'home' : 'home-outline';
                    } else if (route.name === 'HistoryTab') {
                        iconName = focused ? 'calendar' : 'calendar-outline';
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
                    position: 'relative',
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
            <Tab.Screen name="HistoryTab" component={WorkerHistoryScreen} options={{ tabBarLabel: 'Lịch sử' }} />

            {/* Nút giả để thêm mới Đơn hàng, lấn át Tab Khách Hàng */}
            <Tab.Screen
                name="CreateOrderTab"
                component={View} // Dummy component
                options={{
                    tabBarButton: (props) => (
                        <CustomTabBarButton onPress={() => navigation.navigate('CreateOrder')}>
                            <Ionicons name="add" size={36} color="#fff" style={{ marginLeft: 2, marginTop: 2 }} />
                        </CustomTabBarButton>
                    ),
                }}
            />

            <Tab.Screen name="CountersTab" component={AdminCountersScreen} options={{ tabBarLabel: 'Quầy' }} />
            <Tab.Screen name="ProfileTab" component={ProfileScreen} options={{ tabBarLabel: 'Cá nhân' }} />
        </Tab.Navigator>
    );
}

const styles = StyleSheet.create({
    customTabBarButton: {
        top: -25, // Nổi hẳn lên
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
    },
    customTabBarButtonInner: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: theme.colors.primary.default,
        justifyContent: 'center',
        alignItems: 'center',
    }
});

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
