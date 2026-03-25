import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../theme/theme';

export default function SettingsMenuScreen({ navigation }) {
    const renderMenuItem = (title, icon, route) => (
        <TouchableOpacity
            style={styles.menuItem}
            onPress={() => navigation.navigate(route)}
        >
            <View style={styles.menuIconContainer}>
                <Ionicons name={icon} size={24} color={theme?.colors?.primary?.default || '#007AFF'} />
            </View>
            <Text style={styles.menuText}>{title}</Text>
            <Ionicons name="chevron-forward" size={24} color="#ccc" />
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Cài đặt</Text>
            </View>
            <View style={styles.menuContainer}>
                {renderMenuItem("Quản lý Nhân sự", "people", "AdminStaff")}
                {renderMenuItem("Quản lý Quầy", "business", "AdminCounters")}
                {renderMenuItem("Quản lý Khách hàng", "person-outline", "AdminAllCustomers")}
                {renderMenuItem("Tài khoản Cá nhân", "person", "Profile")}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme?.colors?.background || '#f5f5f5',
    },
    header: {
        paddingTop: 60,
        paddingBottom: 20,
        paddingHorizontal: 20,
        backgroundColor: theme?.colors?.surface || '#fff',
        borderBottomWidth: 1,
        borderBottomColor: theme?.colors?.border || '#eee',
    },
    headerTitle: {
        fontSize: theme?.typography?.sizes?.xxl || 24,
        fontWeight: 'bold',
        color: theme?.colors?.text?.primary || '#333',
    },
    menuContainer: {
        marginTop: 20,
        backgroundColor: theme?.colors?.surface || '#fff',
        borderTopWidth: 1,
        borderBottomWidth: 1,
        borderColor: theme?.colors?.border || '#eee',
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 15,
        paddingHorizontal: 20,
        borderBottomWidth: 1,
        borderBottomColor: theme?.colors?.border || '#eee',
    },
    menuIconContainer: {
        width: 40,
        alignItems: 'center',
    },
    menuText: {
        flex: 1,
        fontSize: theme?.typography?.sizes?.md || 16,
        color: theme?.colors?.text?.primary || '#333',
        marginLeft: 10,
    },
});
