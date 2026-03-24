import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { theme } from '../../theme/theme';
import { Ionicons } from '@expo/vector-icons';
import Loading from '../../components/common/Loading';
import { useAuth } from '../../context/AuthContext';

export default function ProfileScreen() {
    const { userInfo, logout } = useAuth();
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Just simulate a small loading delay for smooth transition, or we can skip it
        if (userInfo) {
            setLoading(false);
        }
    }, [userInfo]);

    const profile = userInfo || {
        name: 'Đang tải...',
        role: '...',
        email: '...',
        phone: '...',
    };


    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Thông tin cá nhân</Text>
            </View>
            {loading ? <Loading fullScreen={false} /> : (
                <View style={styles.content}>
                    <View style={styles.avatarContainer}>
                        <View style={styles.avatar}>
                            <Ionicons name="person" size={40} color={theme.colors.primary.default} />
                        </View>
                        <Text style={styles.name}>{profile.name}</Text>
                        <Text style={styles.role}>
                            {profile.role === 'admin' ? 'Quản trị viên' :
                                profile.role === 'manager' ? 'Quản lý' : 'Nhân viên'}
                        </Text>
                    </View>

                    <View style={styles.infoSection}>
                        <View style={styles.infoRow}>
                            <Ionicons name="mail" size={20} color={theme.colors.text.secondary} />
                            <Text style={styles.infoText}>{profile.email}</Text>
                        </View>
                        <View style={styles.infoRow}>
                            <Ionicons name="call" size={20} color={theme.colors.text.secondary} />
                            <Text style={styles.infoText}>{profile.phone || 'Chưa cập nhật'}</Text>
                        </View>
                    </View>

                    <TouchableOpacity style={styles.logoutButton} onPress={logout}>
                        <Text style={styles.logoutText}>Đăng xuất</Text>
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background.light },
    header: { padding: 16, paddingTop: 60, backgroundColor: theme.colors.surface.light, borderBottomWidth: 1, borderColor: theme.colors.border },
    headerTitle: { fontSize: 20, fontWeight: 'bold' },
    content: { padding: 16, alignItems: 'center' },
    avatarContainer: { alignItems: 'center', marginBottom: 32, marginTop: 16 },
    avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: theme.colors.primary.light, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
    name: { fontSize: 22, fontWeight: 'bold', marginBottom: 4 },
    role: { fontSize: 16, color: theme.colors.text.secondary },
    infoSection: { width: '100%', backgroundColor: theme.colors.surface.light, borderRadius: 8, padding: 16, borderWidth: 1, borderColor: theme.colors.border },
    infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
    infoText: { marginLeft: 16, fontSize: 16, color: theme.colors.text.primary },
    logoutButton: { marginTop: 32, width: '100%', padding: 16, borderRadius: 8, backgroundColor: theme.colors.error + '10', alignItems: 'center' },
    logoutText: { color: theme.colors.error, fontSize: 16, fontWeight: 'bold' }
});
