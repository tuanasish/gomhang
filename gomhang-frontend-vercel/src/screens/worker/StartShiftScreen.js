import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../theme/theme';
import Button from '../../components/common/Button';
import { getCurrentShiftAPI, startShiftAPI, autoStartShiftAPI } from '../../api/shifts';
const { spacing, typography, borderRadius } = theme;
const colors = {
    background: theme.colors.background.light,
    surface: theme.colors.surface.light,
    primary: theme.colors.primary.default,
    success: theme.colors.success,
    warning: theme.colors.warning,
    error: theme.colors.error,
    textInfo: theme.colors.text.primary,
    gray100: '#f3f4f6',
    gray200: '#e5e7eb',
    gray400: '#9ca3af',
    gray500: '#6b7280',
    gray600: '#4b5563',
    gray700: '#374151',
    gray800: '#1f2937',
    gray900: '#111827',
    blue50: '#eff6ff',
    blue200: '#bfdbfe',
    blue500: '#3b82f6',
    errorBackground: '#fee2e2',
    errorLight: '#fca5a5',
    errorBorder: '#f87171',
};
const shadows = {
    sm: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
    md: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
};


import { useAuth } from '../../context/AuthContext';

const StartShiftScreen = () => {
    const navigation = useNavigation();
    const { logout } = useAuth();
    const [shift, setShift] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isStarting, setIsStarting] = useState(false);

    useEffect(() => {
        loadCurrentShift();
    }, []);

    const loadCurrentShift = async () => {
        setLoading(true);
        setError(null);
        try {
            const currentShift = await getCurrentShiftAPI();
            const shiftData = currentShift?.data || null;
            setShift(shiftData);

            // Tự động chuyển thẳng vào màn Home nếu đã có ca đang active
            if (shiftData && shiftData.status === 'active') {
                // Dùng replace để không back lại màn StartShift được
                navigation.replace('WorkerMain');
            }
        } catch (err) {
            console.error('Load current shift error:', err);
            setError('Lỗi tải thông tin ca làm việc. Vui lòng thử lại.');
        } finally {
            setLoading(false);
        }
    };

    const handleStartShift = async () => {
        if (!shift) return;

        setIsStarting(true);
        setError(null);
        try {
            await startShiftAPI(shift.id);
            navigation.replace('WorkerMain'); // Chuyển thẳng vào Home mượt mà
        } catch (err) {
            console.error('Start shift error:', err);
            setError('Lỗi bắt đầu ca. Vui lòng thử lại.');
        } finally {
            setIsStarting(false);
        }
    };

    const handleAutoStartShift = async () => {
        setIsStarting(true);
        setError(null);
        try {
            await autoStartShiftAPI();
            navigation.replace('WorkerMain'); // Chuyển thẳng vào Home mượt mà
        } catch (err) {
            console.error('Auto start shift error:', err);
            setError(err.response?.data?.error || 'Lỗi tự động tạo ca. Vui lòng thử lại.');
        } finally {
            setIsStarting(false);
        }
    };

    const handleLogout = () => {
        Alert.alert(
            "Đăng xuất",
            "Bạn có chắc chắn muốn đăng xuất không?",
            [
                { text: "Hủy", style: "cancel" },
                {
                    text: "Đăng xuất",
                    style: "destructive",
                    onPress: async () => {
                        await logout();
                        // AuthContext sẽ tự động cập nhật state và đẩy về màn Login
                    }
                }
            ]
        );
    };

    const formatDate = (dateString) => {
        if (!dateString) return '';
        const [year, month, day] = dateString.split('-');
        return `${day}/${month}/${year}`;
    };

    const renderContent = () => {
        if (loading) {
            return (
                <View style={styles.centerContainer}>
                    <ActivityIndicator size="large" color={colors.primary} />
                    <Text style={styles.loadingText}>Đang tải thông tin ca...</Text>
                </View>
            );
        }

        if (error) {
            return (
                <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>{error}</Text>
                    <Button title="Thử lại" onPress={loadCurrentShift} style={{ marginTop: spacing.md }} />
                </View>
            );
        }

        if (!shift) {
            return (
                <View style={styles.centerContainer}>
                    <Ionicons name="briefcase-outline" size={64} color={colors.primary} />
                    <Text style={styles.title}>Ca làm việc mới</Text>
                    <Text style={styles.noShiftSubtext}>Bạn chưa có ca làm việc nào trong ngày hôm nay. Nhấn "Bắt đầu làm việc" để hệ thống tự động tạo ca với số dư 0đ.</Text>
                    <Button
                        title="Bắt đầu làm việc"
                        onPress={handleAutoStartShift}
                        loading={isStarting}
                        disabled={isStarting}
                        style={{ marginTop: spacing.xl, width: '100%' }}
                    />
                    <TouchableOpacity onPress={() => handleLogout()} style={[styles.backButton, { marginTop: spacing.md }]}>
                        <Text style={styles.backButtonText}>Đăng xuất</Text>
                    </TouchableOpacity>
                </View>
            );
        }

        return (
            <View style={styles.content}>
                <View style={styles.header}>
                    <Text style={styles.title}>Bắt đầu ca làm việc</Text>
                    <Text style={styles.subtitle}>Xác nhận thông tin ca làm việc của bạn.</Text>
                </View>

                <View style={styles.infoCard}>
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Nhân viên:</Text>
                        <Text style={styles.infoValue}>{shift.staffName}</Text>
                    </View>
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Ngày:</Text>
                        <Text style={styles.infoValue}>{formatDate(shift.date)}</Text>
                    </View>
                    <View style={styles.divider} />
                    <View style={styles.moneyRow}>
                        <Text style={styles.moneyLabel}>Tiền giao ca:</Text>
                        <Text style={styles.moneyValue}>{(shift.tienGiaoCa || 0).toLocaleString('vi-VN')}đ</Text>
                    </View>
                </View>

                <View style={styles.actionContainer}>
                    <Button
                        title="Bắt đầu ca"
                        onPress={handleStartShift}
                        loading={isStarting}
                        disabled={isStarting}
                        style={styles.startButton}
                    />
                    <TouchableOpacity onPress={() => handleLogout()} style={[styles.backButton, { marginTop: spacing.md, alignSelf: 'center' }]}>
                        <Text style={styles.backButtonText}>Đăng xuất</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            {renderContent()}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    content: {
        flex: 1,
        padding: spacing.lg,
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: spacing.xl,
    },
    header: {
        alignItems: 'center',
        marginBottom: spacing.xl,
        marginTop: spacing.xl,
    },
    title: {
        fontSize: typography.sizes.xxl,
        fontWeight: typography.weights.bold,
        color: colors.textInfo,
        marginBottom: spacing.xs,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: typography.sizes.md,
        color: colors.gray500,
        textAlign: 'center',
    },
    infoCard: {
        backgroundColor: colors.blue50,
        borderRadius: borderRadius.lg,
        padding: spacing.lg,
        borderWidth: 1,
        borderColor: colors.blue200,
        marginBottom: spacing.xl,
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.md,
    },
    infoLabel: {
        fontSize: typography.sizes.md,
        fontWeight: typography.weights.medium,
        color: colors.gray700,
    },
    infoValue: {
        fontSize: typography.sizes.md,
        fontWeight: typography.weights.bold,
        color: colors.gray900,
    },
    divider: {
        height: 1,
        backgroundColor: colors.blue200,
        marginVertical: spacing.sm,
    },
    moneyRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: spacing.xs,
    },
    moneyLabel: {
        fontSize: typography.sizes.lg,
        fontWeight: typography.weights.semibold,
        color: colors.gray900,
    },
    moneyValue: {
        fontSize: typography.sizes.xxl,
        fontWeight: typography.weights.bold,
        color: colors.primary,
    },
    actionContainer: {
        marginTop: 'auto',
        marginBottom: spacing.xl,
    },
    startButton: {
        paddingVertical: spacing.md,
    },
    loadingText: {
        marginTop: spacing.md,
        color: colors.gray600,
        fontSize: typography.sizes.md,
    },
    errorContainer: {
        margin: spacing.lg,
        padding: spacing.lg,
        backgroundColor: colors.errorBackground,
        borderRadius: borderRadius.md,
        borderWidth: 1,
        borderColor: colors.errorBorder,
    },
    errorText: {
        color: colors.error,
        fontSize: typography.sizes.sm,
        textAlign: 'center',
    },
    noShiftText: {
        fontSize: typography.sizes.lg,
        fontWeight: typography.weights.medium,
        color: colors.gray700,
        marginTop: spacing.md,
        textAlign: 'center',
    },
    noShiftSubtext: {
        fontSize: typography.sizes.sm,
        color: colors.gray500,
        textAlign: 'center',
        marginTop: spacing.xs,
        marginBottom: spacing.xl,
    },
    backButton: {
        padding: spacing.sm,
    },
    backButtonText: {
        color: colors.primary,
        fontSize: typography.sizes.md,
        fontWeight: typography.weights.medium,
    },
});

export default StartShiftScreen;
