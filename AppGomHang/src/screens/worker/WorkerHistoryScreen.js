import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView, ActivityIndicator, TextInput } from 'react-native';
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
    const [searchText, setSearchText] = useState('');

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
                // Sắp xếp orders theo thời gian tạo (mới nhất lên trước)
                const sortedOrders = ordersData.sort((a, b) => {
                    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
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

    const filteredOrders = useMemo(() => {
        if (!searchText.trim()) return orders;
        const lowerSearch = searchText.toLowerCase();
        return orders.filter(order => 
            (order.customerName && order.customerName.toLowerCase().includes(lowerSearch))
        );
    }, [orders, searchText]);

    const totalTienHang = useMemo(() => {
        return filteredOrders.reduce((sum, order) => sum + order.tienHang, 0);
    }, [filteredOrders]);

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
                {/* Date & Search Filter */}
                <View style={styles.filterContainer}>
                    <View style={{ marginBottom: spacing.md }}>
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

                    <View style={styles.searchContainer}>
                        <Ionicons name="search" size={20} color={colors.gray400} />
                        <TextInput
                            style={styles.searchInput}
                            placeholder="Tìm theo tên khách hàng..."
                            value={searchText}
                            onChangeText={setSearchText}
                            clearButtonMode="while-editing"
                        />
                        {searchText.length > 0 && (
                            <TouchableOpacity onPress={() => setSearchText('')} style={{ padding: 4 }}>
                                <Ionicons name="close-circle" size={20} color={colors.gray400} />
                            </TouchableOpacity>
                        )}
                    </View>
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
                {!loading && !error && filteredOrders.length > 0 && (
                    <View style={styles.statsCard}>
                        <View style={styles.statsRow}>
                            <Text style={styles.statsLabel}>Tổng số hóa đơn:</Text>
                            <Text style={styles.statsValue}>{filteredOrders.length} đơn</Text>
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
                        {filteredOrders.length > 0 ? (
                            <>
                                <Text style={styles.listTitle}>Hóa đơn ngày {formatDateDisplay(selectedDate)}</Text>
                                {filteredOrders.map((order, index) => (
                                    <TouchableOpacity
                                        key={order.id}
                                        style={styles.card}
                                        onPress={() => navigation.navigate('OrderDetail', { orderId: order.id })}
                                    >
                                        <View style={styles.cardHeader}>
                                             <View>
                                                 <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                                                     <View style={styles.orderIndexCircle}>
                                                         <Text style={styles.orderIndexText}>{filteredOrders.length - index}</Text>
                                                     </View>
                                                     <Text style={[styles.orderDate, { fontSize: 18, fontWeight: 'bold', color: theme.colors.primary.default }]}>{formatTime(order.createdAt)}</Text>
                                                 </View>
                                             </View>
                                            <View style={styles.statusBadgeWrapper}>
                                                {renderStatus(order.status)}
                                            </View>
                                        </View>

                                        <View style={styles.cardBody}>
                                            <View style={styles.cardBodyColumns}>
                                                {/* Left column: staff & counter */}
                                                <View style={styles.cardBodyLeft}>
                                                     <View style={[styles.infoRow, { marginBottom: 12 }]}>
                                                         <Text style={[styles.infoLabel, { width: 50, fontSize: 14, color: '#000', fontWeight: 'bold' }]}>Khách:</Text>
                                                         <Text style={[styles.infoValue, { fontSize: 18, fontWeight: '700', color: '#000' }]} numberOfLines={1}>
                                                             {order.customerName || '---'}
                                                         </Text>
                                                     </View>
                                                    <View style={styles.infoRow}>
                                                        <Text style={[styles.infoLabel, { width: 50, fontSize: 14, color: '#000', fontWeight: 'bold' }]}>Quầy:</Text>
                                                        <Text style={[styles.infoValue, { fontSize: 18, fontWeight: '700', color: '#000' }]} numberOfLines={1}>
                                                            {order.counterName || '---'}
                                                        </Text>
                                                    </View>
                                                </View>

                                                {/* Right column: financial details */}
                                                <View style={styles.cardBodyRight}>
                                                    <View style={styles.moneyRow}>
                                                        <Text style={styles.moneyLabel}>Tiền hàng:</Text>
                                                        <Text style={styles.moneyValue}>{formatCurrency(order.tienHang || 0)}</Text>
                                                    </View>

                                                    {!!order.tienHoaHong && order.tienHoaHong > 0 && (
                                                        <View style={styles.moneyRow}>
                                                            <Text style={styles.moneyLabel}>Hoa hồng:</Text>
                                                            <Text style={[styles.moneyValue, { color: '#059669' }]}>
                                                                {formatCurrency(order.tienHoaHong)}
                                                            </Text>
                                                        </View>
                                                    )}

                                                    {!!order.tienCongGom && order.tienCongGom > 0 && (
                                                        <View style={styles.moneyRow}>
                                                            <Text style={styles.moneyLabel}>Phí gom:</Text>
                                                            <Text style={styles.moneyValue}>{formatCurrency(order.tienCongGom)}</Text>
                                                        </View>
                                                    )}

                                                    {!!order.phiDongHang && order.phiDongHang > 0 && (
                                                        <View style={styles.moneyRow}>
                                                            <Text style={styles.moneyLabel}>Phí đóng:</Text>
                                                            <Text style={styles.moneyValue}>{formatCurrency(order.phiDongHang)}</Text>
                                                        </View>
                                                    )}

                                                    {!!order.tienThem && order.tienThem > 0 && (
                                                        <View style={styles.moneyRow}>
                                                            <Text style={styles.moneyLabel}>{order.loaiTienThem || 'Thuế/Phí'}:</Text>
                                                            <Text style={styles.moneyValue}>{formatCurrency(order.tienThem)}</Text>
                                                        </View>
                                                    )}

                                                    <View style={[styles.moneyRow, styles.totalRow]}>
                                                        <Text style={styles.totalLabel}>Tổng:</Text>
                                                        <Text style={styles.totalValue}>{formatCurrency(order.tongTienHoaDon || 0)}</Text>
                                                    </View>
                                                </View>
                                            </View>
                                        </View>
                                    </TouchableOpacity>
                                ))}
                            </>
                        ) : (
                            <View style={styles.emptyContainer}>
                                <Ionicons name="receipt-outline" size={64} color={colors.gray300} />
                                <Text style={styles.emptyTitle}>Không có hóa đơn nào</Text>
                                <Text style={styles.emptySubtext}>{searchText ? 'Không tìm thấy khách hàng phù hợp' : 'Chọn ngày khác để xem lịch sử hóa đơn'}</Text>
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
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.gray100,
        borderRadius: borderRadius.md,
        paddingHorizontal: spacing.sm,
        paddingVertical: 8,
    },
    searchInput: {
        flex: 1,
        marginLeft: spacing.sm,
        fontSize: typography.sizes.md,
        color: colors.gray900,
        paddingVertical: 0,
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
    card: {
        backgroundColor: '#FFF',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
        borderWidth: 1,
        borderColor: colors.gray200,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    orderIndexCircle: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: colors.blue50,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 8,
    },
    orderIndexText: {
        color: colors.primary,
        fontWeight: typography.weights.bold,
        fontSize: 12,
    },
    customerName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#000',
    },
    orderDate: {
        fontSize: 13,
        color: '#666',
        marginTop: 4,
    },
    statusBadgeWrapper: {
        alignSelf: 'flex-start',
    },
    cardBody: {
        borderTopWidth: 1,
        borderTopColor: '#F2F2F7',
        paddingTop: 12,
    },
    cardBodyColumns: {
        flexDirection: 'row',
        gap: 12,
    },
    cardBodyLeft: {
        flex: 1.2, // Rộng hơn một chút để chứa text to
        justifyContent: 'center',
    },
    cardBodyRight: {
        flex: 1,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10, // Giãn cách nhẹ
        gap: 6,
    },
    infoLabel: {
        fontSize: 12,
        color: '#8E8E93',
        fontWeight: '500',
        width: 38, // Cố định nhẹ độ rộng label để text NV/Quầy thẳng hàng
    },
    infoValue: {
        fontSize: 13,
        color: '#333',
        fontWeight: '600',
        flexShrink: 1,
    },
    moneyRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 6, // Rộng rãi hơn 1 chút
    },
    moneyLabel: {
        fontSize: 12,
        color: '#666',
    },
    moneyValue: {
        fontSize: 13,
        color: '#111',
        fontWeight: '500',
    },
    totalRow: {
        borderTopWidth: 1,
        borderTopColor: '#E5E5EA',
        paddingTop: 6,
        marginTop: 4,
    },
    totalLabel: {
        fontSize: 14,
        color: '#111',
        fontWeight: 'bold',
    },
    totalValue: {
        fontWeight: 'bold',
        fontSize: 16,
        color: theme?.colors?.primary?.default || '#007AFF',
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
