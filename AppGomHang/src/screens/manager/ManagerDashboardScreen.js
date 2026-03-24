import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { theme } from '../../theme/theme';
import Loading from '../../components/common/Loading';
import { useShiftsList } from '../../hooks/queries/useShifts';
import { useOrdersByDate } from '../../hooks/queries/useOrders';
import { getLocalDateString } from '../../utils/helpers';
import { getAllCustomerDailyFeesAPI } from '../../api/customers';
import { getOrdersByDateRangeAPI } from '../../api/orders';

export default function ManagerDashboardScreen() {
    const { userInfo } = useAuth();
    const navigation = useNavigation();

    const [selectedStaffId, setSelectedStaffId] = useState(null);
    const [filterMode, setFilterMode] = useState('day'); // 'day' | 'month' | 'year'

    const today = getLocalDateString(new Date());
    const [selectedDate, setSelectedDate] = useState(today);

    // Date range calculation for month/year modes
    const dateRange = useMemo(() => {
        const d = new Date(selectedDate + 'T00:00:00');
        if (filterMode === 'month') {
            const start = new Date(d.getFullYear(), d.getMonth(), 1);
            const end = new Date(d.getFullYear(), d.getMonth() + 1, 0);
            return { startDate: getLocalDateString(start), endDate: getLocalDateString(end) };
        } else if (filterMode === 'year') {
            return { startDate: `${d.getFullYear()}-01-01`, endDate: `${d.getFullYear()}-12-31` };
        }
        return null;
    }, [selectedDate, filterMode]);

    // Date navigation
    const changeDate = (direction) => {
        const d = new Date(selectedDate + 'T00:00:00');
        if (filterMode === 'day') {
            d.setDate(d.getDate() + direction);
        } else if (filterMode === 'month') {
            d.setMonth(d.getMonth() + direction);
        } else {
            d.setFullYear(d.getFullYear() + direction);
        }
        setSelectedDate(getLocalDateString(d));
    };

    const formatDisplayDate = (dateStr) => {
        const d = new Date(dateStr + 'T00:00:00');
        const dayNames = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
        const months = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];
        if (filterMode === 'day') {
            const day = d.getDate().toString().padStart(2, '0');
            const month = months[d.getMonth()];
            return `${dayNames[d.getDay()]}, ${day}/${month}/${d.getFullYear()}`;
        } else if (filterMode === 'month') {
            return `Tháng ${d.getMonth() + 1}/${d.getFullYear()}`;
        } else {
            return `Năm ${d.getFullYear()}`;
        }
    };

    const isToday = selectedDate === today;

    // Day mode: fetch by single date
    const { data: ordersResDay, isLoading: ordersLoadingDay, refetch: refetchOrdersDay } = useOrdersByDate(filterMode === 'day' ? selectedDate : null);
    const { data: shiftsRes, isLoading: shiftsLoading, refetch: refetchShifts } = useShiftsList({ date: filterMode === 'day' ? selectedDate : undefined });

    // Month/Year mode: fetch by date range
    const [rangeOrders, setRangeOrders] = useState(null);
    const [rangeLoading, setRangeLoading] = useState(false);

    const fetchRangeOrders = useCallback(async () => {
        if (!dateRange) return;
        setRangeLoading(true);
        try {
            const res = await getOrdersByDateRangeAPI(dateRange.startDate, dateRange.endDate);
            setRangeOrders(res);
        } catch (e) {
            setRangeOrders({ success: true, data: [] });
        } finally {
            setRangeLoading(false);
        }
    }, [dateRange]);

    useEffect(() => {
        if (filterMode !== 'day') {
            fetchRangeOrders();
        }
    }, [filterMode, fetchRangeOrders]);

    // Unified orders data
    const ordersRes = filterMode === 'day' ? ordersResDay : rangeOrders;
    const ordersLoading = filterMode === 'day' ? ordersLoadingDay : rangeLoading;
    const loading = shiftsLoading || ordersLoading;

    // Fetch phí đóng gửi (only for day mode)
    const [totalPhiDongGui, setTotalPhiDongGui] = useState(0);
    const fetchDailyFees = useCallback(async () => {
        if (filterMode !== 'day') {
            setTotalPhiDongGui(0);
            return;
        }
        try {
            const res = await getAllCustomerDailyFeesAPI(selectedDate);
            if (res.success && res.data) {
                const total = res.data.reduce((sum, item) => sum + (Number(item.phiDongGui) || 0), 0);
                setTotalPhiDongGui(total);
            } else {
                setTotalPhiDongGui(0);
            }
        } catch (e) {
            setTotalPhiDongGui(0);
        }
    }, [selectedDate, filterMode]);
    useEffect(() => { fetchDailyFees(); }, [fetchDailyFees]);

    // Tính thống kê
    const stats = useMemo(() => {
        const shifts = shiftsRes?.success ? shiftsRes.data : [];
        const orders = ordersRes?.success ? ordersRes.data : [];

        const totalTienGiaoCaTheoNgay = shifts.reduce((sum, shift) => sum + (Number(shift.tienGiaoCa) || 0), 0);
        const totalTienHangDaTraTheoNgay = orders.reduce((sum, order) => sum + (Number(order.tienHang) || 0), 0);
        const totalTongTienHoaDonTheoNgay = orders.reduce(
            (sum, order) => sum + (Number(order.tongTienHoaDon) || 0),
            0
        );
        const totalTienCongGomTheoNgay = orders.reduce((sum, order) => sum + (Number(order.tienCongGom) || 0), 0);
        // Sửa lại logic: totalThueTheoNgay lấy từ tienThem (Thuế), totalPhiDongHangTheoNgay lấy từ phiDongHang
        const totalThueTheoNgay = orders.reduce((sum, order) => sum + (Number(order.tienThem) || 0), 0);
        const totalPhiDongHangTheoNgay = orders.reduce((sum, order) => sum + (Number(order.phiDongHang) || 0), 0);
        const totalTienHoaHongTheoNgay = orders.reduce((sum, order) => sum + (Number(order.tienHoaHong) || 0), 0);

        return {
            totalTienGiaoCaTheoNgay,
            totalTienHangDaTraTheoNgay,
            totalTongTienHoaDonTheoNgay,
            totalTienCongGomTheoNgay,
            totalThueTheoNgay,
            totalPhiDongHangTheoNgay,
            totalTienHoaHongTheoNgay,
            totalSoDon: orders.length,
        };
    }, [shiftsRes, ordersRes]);

    // Gom đơn hàng theo nhân viên
    const staffSpendingList = useMemo(() => {
        const orders = ordersRes?.success ? ordersRes.data : [];
        const staffMap = {};
        orders.forEach(order => {
            const staffId = order.staffId || 'unknown';
            const staffName = order.staffName || 'Nhân viên';

            if (!staffMap[staffId]) {
                staffMap[staffId] = {
                    staffId,
                    staffName,
                    totalSpent: 0,
                    orders: []
                };
            }

            staffMap[staffId].totalSpent += (Number(order.tienHang) || 0);
            staffMap[staffId].orders.push(order);
        });

        return Object.values(staffMap);
    }, [ordersRes]);

    const handleRefresh = useCallback(() => {
        if (filterMode === 'day') {
            refetchShifts();
            refetchOrdersDay();
        } else {
            fetchRangeOrders();
        }
        fetchDailyFees();
    }, [filterMode, refetchShifts, refetchOrdersDay, fetchRangeOrders, fetchDailyFees]);

    const formatCurrency = (amount) => {
        return amount.toLocaleString('vi-VN') + 'đ';
    };

    const formatTime = (isoString) => {
        const d = new Date(isoString);
        return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    };

    if (loading && (!shiftsRes || !ordersRes)) {
        return (
            <View style={styles.centerContainer}>
                <Loading text="Đang tải thống kê..." />
            </View>
        );
    }

    const selectedStaff = staffSpendingList.find(s => s.staffId === selectedStaffId);

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerUser}>
                    <View style={styles.avatar}>
                        <Ionicons name="person" size={24} color={theme.colors.primary.default} />
                    </View>
                    <View>
                        <Text style={styles.userName}>{userInfo?.name || 'Admin'}</Text>
                        <Text style={styles.userRole}>Quản trị viên</Text>
                    </View>
                </View>
            </View>

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                refreshControl={<RefreshControl refreshing={loading} onRefresh={handleRefresh} />}
            >

                {/* Filter Mode Tabs */}
                <View style={styles.filterTabs}>
                    {[
                        { key: 'day', label: 'Ngày' },
                        { key: 'month', label: 'Tháng' },
                        { key: 'year', label: 'Năm' },
                    ].map(tab => (
                        <TouchableOpacity
                            key={tab.key}
                            style={[styles.filterTab, filterMode === tab.key && styles.filterTabActive]}
                            onPress={() => setFilterMode(tab.key)}
                        >
                            <Text style={[styles.filterTabText, filterMode === tab.key && styles.filterTabTextActive]}>
                                {tab.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Date Selector */}
                <View style={styles.dateSelector}>
                    <TouchableOpacity onPress={() => changeDate(-1)} style={styles.dateArrow}>
                        <Ionicons name="chevron-back" size={22} color={theme.colors.primary.default} />
                    </TouchableOpacity>
                    <View style={{ alignItems: 'center', flex: 1 }}>
                        <Text style={styles.dateText}>{formatDisplayDate(selectedDate)}</Text>
                        {isToday && <Text style={{ fontSize: 11, color: theme.colors.success, fontWeight: '600' }}>Hôm nay</Text>}
                    </View>
                    <TouchableOpacity onPress={() => changeDate(1)} style={styles.dateArrow}>
                        <Ionicons name="chevron-forward" size={22} color={theme.colors.primary.default} />
                    </TouchableOpacity>
                    {!isToday && (
                        <TouchableOpacity onPress={() => setSelectedDate(today)} style={styles.todayBtn}>
                            <Text style={{ fontSize: 12, color: '#fff', fontWeight: '600' }}>Hôm nay</Text>
                        </TouchableOpacity>
                    )}
                </View>

                {/* Start Stats Block */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Thống kê theo ngày</Text>

                    <View style={styles.statRow}>
                        <Text style={styles.statLabel}>Đã giao cho nhân viên</Text>
                        <Text style={styles.statValueBold}>{formatCurrency(stats.totalTienGiaoCaTheoNgay)}</Text>
                    </View>

                    <View style={styles.statRow}>
                        <Text style={styles.statLabel}>Nhân viên đã chi</Text>
                        <Text style={[styles.statValueBold, { color: theme.colors.primary.default }]}>
                            {formatCurrency(stats.totalTienHangDaTraTheoNgay)}
                        </Text>
                    </View>

                    <View style={styles.statRow}>
                        <Text style={styles.statLabel}>Tổng tiền hóa đơn</Text>
                        <Text style={styles.statValueBold}>
                            {formatCurrency(stats.totalTongTienHoaDonTheoNgay)}
                        </Text>
                    </View>

                    <View style={styles.statRow}>
                        <Text style={styles.statLabel}>Phí gom</Text>
                        <Text style={styles.statValueBold}>
                            {formatCurrency(stats.totalTienCongGomTheoNgay)}
                        </Text>
                    </View>

                    <View style={styles.statRow}>
                        <Text style={styles.statLabel}>Thuế</Text>
                        <Text style={styles.statValueBold}>
                            {formatCurrency(stats.totalThueTheoNgay)}
                        </Text>
                    </View>


                    <View style={styles.statRow}>
                        <Text style={styles.statLabel}>Phí đóng gửi</Text>
                        <Text style={styles.statValueBold}>
                            {formatCurrency(totalPhiDongGui)}
                        </Text>
                    </View>

                    <View style={styles.statRow}>
                        <Text style={styles.statLabel}>Tiền hoa hồng công ty</Text>
                        <Text style={[styles.statValueBold, { color: theme.colors.success }]}>
                            {formatCurrency(stats.totalTienHoaHongTheoNgay)}
                        </Text>
                    </View>

                    <View style={[styles.statRow, { borderBottomWidth: 0, paddingBottom: 0 }]}>
                        <Text style={styles.statLabel}>Tổng đơn</Text>
                        <Text style={[styles.statValueBold, { color: theme.colors.primary.default }]}>
                            {stats.totalSoDon} đơn
                        </Text>
                    </View>
                </View>

                {/* Danh sách nhân viên */}
                {staffSpendingList.length > 0 && (
                    <View style={styles.card}>
                        <Text style={styles.cardTitle}>Nhân viên đã chi</Text>

                        {staffSpendingList.map((staff, index) => (
                            <View key={staff.staffId}>
                                <TouchableOpacity
                                    style={[
                                        styles.staffRow,
                                        index !== staffSpendingList.length - 1 && styles.borderBottom,
                                        selectedStaffId === staff.staffId && styles.selectedStaffRow
                                    ]}
                                    onPress={() => setSelectedStaffId(
                                        selectedStaffId === staff.staffId ? null : staff.staffId
                                    )}
                                >
                                    <View style={styles.staffRowLeft}>
                                        <Ionicons
                                            name={selectedStaffId === staff.staffId ? 'chevron-up' : 'chevron-down'}
                                            size={20}
                                            color={theme.colors.text.secondary}
                                            style={{ marginRight: 8 }}
                                        />
                                        <Text style={styles.staffName}>{staff.staffName}</Text>
                                        <View style={{ backgroundColor: theme.colors.primary.default, borderRadius: 12, paddingHorizontal: 8, paddingVertical: 2, marginLeft: 8 }}>
                                            <Text style={{ color: '#fff', fontSize: 12, fontWeight: '600' }}>{staff.orders.length} đơn</Text>
                                        </View>
                                    </View>
                                    <Text style={[styles.statValueBold, { color: theme.colors.primary.default }]}>
                                        {formatCurrency(staff.totalSpent)}
                                    </Text>
                                </TouchableOpacity>

                                {/* Sub-list Orders if selected */}
                                {selectedStaffId === staff.staffId && (
                                    <View style={styles.ordersContainer}>
                                        {staff.orders.map((order, oIndex) => (
                                            <TouchableOpacity
                                                key={order.id}
                                                style={styles.orderItem}
                                                onPress={() => navigation.navigate('OrderDetail', { orderId: order.id })}
                                                activeOpacity={0.7}
                                            >
                                                <View style={styles.orderLeft}>
                                                    <View style={styles.orderBadge}>
                                                        <Text style={styles.orderBadgeText}>{oIndex + 1}</Text>
                                                    </View>
                                                    <View style={{ flex: 1 }}>
                                                        <Text style={styles.orderCustomer} numberOfLines={1}>{order.customerName}</Text>
                                                        {order.counterName ? (
                                                            <Text style={{ fontSize: 15, color: '#2563EB' }} numberOfLines={1}>Quầy: {order.counterName}</Text>
                                                        ) : null}
                                                        <Text style={styles.orderTime}>{formatTime(order.createdAt)}</Text>
                                                    </View>
                                                </View>
                                                <View style={{ alignItems: 'flex-end', marginLeft: 12 }}>
                                                    <Text style={{ fontSize: 14, color: theme.colors.text.secondary }}>Tiền Ứng: {formatCurrency(order.tienHang)}</Text>
                                                    {(Number(order.tienHoaHong) || 0) > 0 && (
                                                        <Text style={{ fontSize: 14, color: theme.colors.success }}>Hoa hồng: {formatCurrency(order.tienHoaHong)}</Text>
                                                    )}
                                                    {(Number(order.tienThem) || 0) > 0 && (
                                                        <Text style={{ fontSize: 13, color: theme.colors.text.secondary }}>Thuế: {formatCurrency(order.tienThem)}</Text>
                                                    )}
                                                    <Text style={{ fontSize: 16, fontWeight: '700', color: theme.colors.primary.default, marginTop: 2 }}>Tổng: {formatCurrency(order.tongTienHoaDon)}</Text>
                                                </View>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                )}
                            </View>
                        ))}
                    </View>
                )}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background.light,
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: theme.colors.background.light,
    },
    header: {
        backgroundColor: theme.colors.surface.light,
        paddingTop: 60,
        paddingBottom: 16,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
    },
    headerUser: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: theme.colors.primary.light,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },

    userName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: theme.colors.text.primary,
    },
    userRole: {
        fontSize: 14,
        color: theme.colors.text.secondary,
    },
    scrollContent: {
        padding: 16,
        paddingBottom: 32,
    },
    pageTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: theme.colors.text.primary,
        marginBottom: 12,
    },
    filterTabs: {
        flexDirection: 'row',
        backgroundColor: theme.colors.surface.light,
        borderRadius: theme.borderRadius.lg,
        padding: 4,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    filterTab: {
        flex: 1,
        paddingVertical: 8,
        alignItems: 'center',
        borderRadius: theme.borderRadius.md,
    },
    filterTabActive: {
        backgroundColor: theme.colors.primary.default,
    },
    filterTabText: {
        fontSize: 14,
        fontWeight: '600',
        color: theme.colors.text.secondary,
    },
    filterTabTextActive: {
        color: '#fff',
    },
    dateSelector: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.surface.light,
        borderRadius: theme.borderRadius.lg,
        padding: 10,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    dateArrow: {
        padding: 6,
    },
    dateText: {
        fontSize: 16,
        fontWeight: '700',
        color: theme.colors.text.primary,
    },
    todayBtn: {
        backgroundColor: theme.colors.primary.default,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        marginLeft: 8,
    },
    card: {
        backgroundColor: theme.colors.surface.light,
        borderRadius: theme.borderRadius.lg,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: theme.colors.text.primary,
        marginBottom: 16,
    },
    statRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
    },
    statLabel: {
        fontSize: 14,
        color: theme.colors.text.primary,
    },
    statValueBold: {
        fontSize: 16,
        fontWeight: 'bold',
        color: theme.colors.text.primary,
    },
    staffRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
    },
    staffRowLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    staffName: {
        fontSize: 14,
        color: theme.colors.text.primary,
    },
    borderBottom: {
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
    },
    selectedStaffRow: {
        backgroundColor: theme.colors.primary.light + '40', // transparent tint
        borderRadius: 8,
        paddingHorizontal: 8,
        marginHorizontal: -8,
    },
    ordersContainer: {
        marginTop: 8,
        marginBottom: 16,
        paddingLeft: 16,
    },
    orderItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        backgroundColor: theme.colors.background.light,
        padding: 14,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: theme.colors.border,
        marginBottom: 10,
    },
    orderLeft: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        flex: 1,
    },
    orderBadge: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: theme.colors.primary.light,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
    },
    orderBadgeText: {
        fontSize: 13,
        fontWeight: 'bold',
        color: theme.colors.primary.default,
    },
    orderCustomer: {
        fontSize: 17,
        fontWeight: '700',
        color: theme.colors.text.primary,
    },
    orderTime: {
        fontSize: 13,
        color: theme.colors.text.secondary,
    },
    orderAmount: {
        fontSize: 14,
        fontWeight: 'bold',
        color: theme.colors.primary.default,
    }
});
