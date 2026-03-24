import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../theme/theme';
import DateTimePicker from '@react-native-community/datetimepicker';
import { getOrdersByDateAPI } from '../../api/orders';
import { formatCurrency, formatDate, getLocalDateString } from '../../utils/helpers';
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



const WorkerHistoryScreen = () => {
    const navigation = useNavigation();
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        loadOrders();
    }, [selectedDate]);

    const loadOrders = async () => {
        setLoading(true);
        setError(null);
        try {
            // Formatted date string for queries
            const dateStr = getLocalDateString(selectedDate);
            const response = await getOrdersByDateAPI(dateStr);

            if (response && response.success && response.data) {
                const ordersData = response.data;
                // Sắp xếp orders theo thời gian tạo (sớm nhất trước)
                const sortedOrders = ordersData.sort((a, b) => {
                    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
                });
                setOrders(sortedOrders);
            } else {
                setOrders([]);
            }
        } catch (err) {
            console.error('Load orders by date error:', err);
            setError(err.message || 'Lỗi tải danh sách hóa đơn theo ngày');
        } finally {
            setLoading(false);
        }
    };

    const onChangeDate = (event, selected) => {
        setShowDatePicker(false);
        if (selected) {
            setSelectedDate(selected);
        }
    };

    const formatDateDisplay = (date) => {
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
    };

    const formatTime = (dateString) => {
        return new Date(dateString).toLocaleTimeString('vi-VN', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
    };

    const totalTienHang = useMemo(() => {
        return orders.reduce((sum, order) => sum + order.tienHang, 0);
    }, [orders]);

    const renderStatus = (status) => {
        switch (status) {
            case 'completed':
                return <View style={[styles.statusBadge, styles.statusCompleted]}><Text style={styles.statusCompletedText}>Đã thanh toán</Text></View>;
            case 'pending':
                return <View style={[styles.statusBadge, styles.statusPending]}><Text style={styles.statusPendingText}>Chờ xử lý</Text></View>;
            case 'cancelled':
                return <View style={[styles.statusBadge, styles.statusCancelled]}><Text style={styles.statusCancelledText}>Đã hủy</Text></View>;
            default:
                return null;
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={colors.textInfo} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Lịch sử hóa đơn</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* Date Filter */}
                <View style={styles.filterContainer}>
                    <Text style={styles.filterLabel}>Chọn ngày</Text>
                    <TouchableOpacity
                        style={styles.dateSelector}
                        onPress={() => setShowDatePicker(true)}
                    >
                        <Ionicons name="calendar-outline" size={20} color={colors.gray500} />
                        <Text style={styles.dateText}>{formatDateDisplay(selectedDate)}</Text>
                        <Ionicons name="chevron-down" size={20} color={colors.gray400} />
                    </TouchableOpacity>
                </View>

                {showDatePicker && (
                    <DateTimePicker
                        value={selectedDate}
                        mode="date"
                        display="default"
                        onChange={onChangeDate}
                    />
                )}

                {/* Loading / Error States */}
                {loading && (
                    <View style={styles.centerContainer}>
                        <ActivityIndicator size="large" color={colors.primary} />
                        <Text style={styles.loadingText}>Đang tải danh sách...</Text>
                    </View>
                )}

                {error && !loading && (
                    <View style={styles.errorContainer}>
                        <Text style={styles.errorText}>{error}</Text>
                    </View>
                )}

                {/* Thống kê ngày */}
                {!loading && !error && orders.length > 0 && (
                    <View style={styles.statsCard}>
                        <View style={styles.statsRow}>
                            <Text style={styles.statsLabel}>Tổng số hóa đơn:</Text>
                            <Text style={styles.statsValue}>{orders.length} đơn</Text>
                        </View>
                        <View style={styles.statsRow}>
                            <Text style={styles.statsLabel}>Tổng tiền hàng:</Text>
                            <Text style={styles.statsValue}>{(totalTienHang || 0).toLocaleString('vi-VN')}đ</Text>
                        </View>
                    </View>
                )}

                {/* Danh sách hóa đơn */}
                {!loading && !error && (
                    <View style={styles.listContainer}>
                        {orders.length > 0 ? (
                            <>
                                <Text style={styles.listTitle}>Hóa đơn ngày {formatDateDisplay(selectedDate)}</Text>
                                {orders.map((order, index) => (
                                    <TouchableOpacity
                                        key={order.id}
                                        style={styles.orderCard}
                                        onPress={() => navigation.navigate('OrderDetail', { orderId: order.id })}
                                    >
                                        <View style={styles.orderLeft}>
                                            <View style={styles.orderIndexContainer}>
                                                <View style={styles.orderIndexCircle}>
                                                    <Text style={styles.orderIndexText}>{index + 1}</Text>
                                                </View>
                                                <Text style={styles.orderTimeText}>{formatTime(order.createdAt)}</Text>
                                            </View>

                                            <View style={styles.orderInfo}>
                                                <Text style={styles.customerName}>Khách: {order.customerName}</Text>
                                                <Text style={styles.orderSubtext}>
                                                    Tổng tiền: <Text style={styles.orderHighlight}>{(order.tongTienHoaDon || 0).toLocaleString('vi-VN')}đ</Text>
                                                </Text>
                                                <Text style={styles.orderSubtext}>Tiền hàng: {(order.tienHang || 0).toLocaleString('vi-VN')}đ</Text>
                                            </View>
                                        </View>
                                        <View style={styles.orderRight}>
                                            {renderStatus(order.status)}
                                        </View>
                                    </TouchableOpacity>
                                ))}
                            </>
                        ) : (
                            <View style={styles.emptyContainer}>
                                <Ionicons name="receipt-outline" size={64} color={colors.gray300} />
                                <Text style={styles.emptyTitle}>Không có hóa đơn nào</Text>
                                <Text style={styles.emptySubtext}>Chọn ngày khác để xem lịch sử hóa đơn</Text>
                            </View>
                        )}
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.md,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: colors.gray200,
    },
    backButton: {
        padding: spacing.xs,
    },
    headerTitle: {
        fontSize: typography.sizes.lg,
        fontWeight: typography.weights.bold,
        color: colors.textInfo,
    },
    content: {
        flex: 1,
    },
    filterContainer: {
        padding: spacing.lg,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: colors.gray200,
    },
    filterLabel: {
        fontSize: typography.sizes.sm,
        fontWeight: typography.weights.medium,
        color: colors.gray700,
        marginBottom: spacing.xs,
    },
    dateSelector: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: colors.gray300,
        borderRadius: borderRadius.md,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
    },
    dateText: {
        flex: 1,
        marginLeft: spacing.sm,
        fontSize: typography.sizes.md,
        color: colors.gray900,
    },
    centerContainer: {
        padding: spacing.xl,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: spacing.md,
        color: colors.gray600,
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
    statsCard: {
        margin: spacing.lg,
        padding: spacing.md,
        backgroundColor: colors.blue50,
        borderRadius: borderRadius.lg,
        borderWidth: 1,
        borderColor: colors.blue200,
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: spacing.xs,
    },
    statsLabel: {
        fontSize: typography.sizes.sm,
        color: colors.gray700,
        fontWeight: typography.weights.medium,
    },
    statsValue: {
        fontSize: typography.sizes.sm,
        color: colors.gray900,
        fontWeight: typography.weights.bold,
    },
    listContainer: {
        paddingHorizontal: spacing.lg,
        paddingBottom: spacing.xxl, // Padding cho bottom tab
    },
    listTitle: {
        fontSize: typography.sizes.lg,
        fontWeight: typography.weights.bold,
        color: colors.gray900,
        marginBottom: spacing.md,
    },
    orderCard: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#fff',
        padding: spacing.md,
        borderRadius: borderRadius.lg,
        marginBottom: spacing.sm,
        borderWidth: 1,
        borderColor: colors.gray200,
    },
    orderLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    orderIndexContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: spacing.md,
        width: 60,
    },
    orderIndexCircle: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: colors.blue50,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 4,
    },
    orderIndexText: {
        color: colors.primary,
        fontWeight: typography.weights.bold,
        fontSize: typography.sizes.md,
    },
    orderTimeText: {
        fontSize: typography.sizes.xs,
        color: colors.gray500,
        textAlign: 'center',
    },
    orderInfo: {
        flex: 1,
    },
    customerName: {
        fontSize: typography.sizes.md,
        fontWeight: typography.weights.semibold,
        color: colors.gray900,
        marginBottom: 2,
    },
    orderSubtext: {
        fontSize: typography.sizes.sm,
        color: colors.gray500,
        marginBottom: 2,
    },
    orderHighlight: {
        fontWeight: typography.weights.medium,
        color: colors.gray900,
    },
    orderRight: {
        marginLeft: spacing.sm,
    },
    statusBadge: {
        paddingHorizontal: spacing.sm,
        paddingVertical: 4,
        borderRadius: borderRadius.full,
    },
    statusCompleted: {
        backgroundColor: '#dcfce7',
    },
    statusCompletedText: {
        color: '#15803d',
        fontSize: typography.sizes.xs,
        fontWeight: typography.weights.medium,
    },
    statusPending: {
        backgroundColor: '#fef08a',
    },
    statusPendingText: {
        color: '#a16207',
        fontSize: typography.sizes.xs,
        fontWeight: typography.weights.medium,
    },
    statusCancelled: {
        backgroundColor: '#fee2e2',
    },
    statusCancelledText: {
        color: '#b91c1c',
        fontSize: typography.sizes.xs,
        fontWeight: typography.weights.medium,
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: spacing.xxl,
    },
    emptyTitle: {
        fontSize: typography.sizes.lg,
        fontWeight: typography.weights.medium,
        color: colors.gray600,
        marginTop: spacing.md,
        marginBottom: spacing.xs,
    },
    emptySubtext: {
        fontSize: typography.sizes.sm,
        color: colors.gray500,
    },
});

export default WorkerHistoryScreen;
