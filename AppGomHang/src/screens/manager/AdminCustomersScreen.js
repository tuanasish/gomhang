import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    TextInput,
    Platform,
    RefreshControl,
    ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { theme } from '../../theme/theme';
import { formatCurrency, formatDate, getLocalDateString } from '../../utils/helpers';

import { useCustomersList } from '../../hooks/queries/useCustomers';
import { useOrdersByDate } from '../../hooks/queries/useOrders';
import { getOrdersByDateRangeAPI } from '../../api/orders';
import { getAllCustomerDailyFeesAPI } from '../../api/customers';

export default function AdminCustomersScreen({ navigation }) {
    const { userInfo } = useAuth();

    // Filter mode: 'day' | 'month' | 'year'
    const [filterMode, setFilterMode] = useState('day');
    const today = getLocalDateString(new Date());
    const [selectedDate, setSelectedDate] = useState(today);
    const [showDatePicker, setShowDatePicker] = useState(false);

    // Search query
    const [searchQuery, setSearchQuery] = useState('');

    // Expanded customer items: { [customerId]: boolean }
    const [expandedCustomers, setExpandedCustomers] = useState({});

    // Range calculation for month/year modes
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

    // Change date by step (-1 or +1)
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

    const handleDatePicked = (event, picked) => {
        setShowDatePicker(Platform.OS === 'ios');
        if (picked) {
            setSelectedDate(getLocalDateString(picked));
        }
    };

    // Queries
    const {
        data: customersData = [],
        isLoading: isCustomersLoading,
        isRefetching: isCustomersRefetching,
        refetch: refetchCustomers
    } = useCustomersList();

    // Day mode orders
    const {
        data: ordersDataDay,
        isLoading: ordersLoadingDay,
        isRefetching: ordersRefetchingDay,
        refetch: refetchOrdersDay
    } = useOrdersByDate(filterMode === 'day' ? selectedDate : null);

    // Range mode orders (month / year)
    const [rangeOrders, setRangeOrders] = useState(null);
    const [rangeLoading, setRangeLoading] = useState(false);

    const fetchRangeOrders = useCallback(async () => {
        if (!dateRange) return;
        setRangeLoading(true);
        try {
            const pageSize = 1000;
            let offset = 0;
            let allOrders = [];

            while (true) {
                const res = await getOrdersByDateRangeAPI(dateRange.startDate, dateRange.endDate, {
                    offset,
                    limit: pageSize,
                });

                if (!res?.success) {
                    setRangeOrders(res || { success: false, data: [] });
                    break;
                }

                const list = res.data || [];
                allOrders = allOrders.concat(list);
                if (list.length < pageSize) {
                    setRangeOrders({ success: true, data: allOrders });
                    break;
                }
                offset += pageSize;
            }
        } catch (e) {
            setRangeOrders({ success: false, data: [] });
        } finally {
            setRangeLoading(false);
        }
    }, [dateRange]);

    useEffect(() => {
        if (filterMode !== 'day') {
            fetchRangeOrders();
        }
    }, [filterMode, selectedDate, fetchRangeOrders]);

    // Track invoiced status
    const [invoicedCustomerIds, setInvoicedCustomerIds] = useState({});

    const fetchInvoiceStatus = useCallback(async () => {
        try {
            const feesRes = await getAllCustomerDailyFeesAPI(
                filterMode === 'day' ? selectedDate : undefined,
                dateRange ? dateRange.startDate : undefined,
                dateRange ? dateRange.endDate : undefined
            );
            if (feesRes?.success && feesRes.data) {
                const map = {};
                feesRes.data.forEach(fee => {
                    if (fee.isInvoiced && fee.customerId) {
                        map[fee.customerId] = true;
                    }
                });
                setInvoicedCustomerIds(map);
            } else {
                setInvoicedCustomerIds({});
            }
        } catch (e) {
            setInvoicedCustomerIds({});
        }
    }, [filterMode, selectedDate, dateRange]);

    useFocusEffect(
        useCallback(() => {
            fetchInvoiceStatus();
        }, [fetchInvoiceStatus])
    );

    // Consolidated orders list
    const orders = useMemo(() => {
        if (filterMode === 'day') {
            if (!ordersDataDay) return [];
            if (ordersDataDay.success && Array.isArray(ordersDataDay.data)) return ordersDataDay.data;
            if (Array.isArray(ordersDataDay)) return ordersDataDay;
            return [];
        } else {
            if (!rangeOrders?.success) return [];
            return rangeOrders.data || [];
        }
    }, [filterMode, ordersDataDay, rangeOrders]);

    // Group & rank customers by order count DESCENDING
    const customerStatsList = useMemo(() => {
        const customerMap = {};

        // Base customers from DB
        let allCustomers = [];
        if (customersData?.success && Array.isArray(customersData.data)) allCustomers = customersData.data;
        else if (Array.isArray(customersData)) allCustomers = customersData;

        allCustomers.forEach(c => {
            customerMap[c.id] = {
                id: c.id,
                name: c.name,
                phone: c.phone,
                address: c.address,
                defaultTienCongGom: c.defaultTienCongGom,
                orderCount: 0,
                totalAmount: 0,
                totalTienUng: 0,
                orders: []
            };
        });

        // Tích lũy đơn hàng cho từng khách
        orders.forEach(order => {
            if (order.status === 'cancelled') return;
            const cId = order.customerId;
            if (!cId) return;

            if (!customerMap[cId]) {
                customerMap[cId] = {
                    id: cId,
                    name: order.customerName || 'Khách vãng lai',
                    phone: '',
                    address: '',
                    defaultTienCongGom: null,
                    orderCount: 0,
                    totalAmount: 0,
                    totalTienUng: 0,
                    orders: []
                };
            }

            customerMap[cId].orderCount += 1;
            customerMap[cId].totalAmount += (Number(order.tongTienHoaDon) || 0);
            customerMap[cId].totalTienUng += (Number(order.tienHang) || 0);
            customerMap[cId].orders.push(order);
        });

        // Chỉ lấy các khách có đơn trong khoảng thời gian đã chọn
        let list = Object.values(customerMap).filter(c => c.orderCount > 0);

        // Lọc theo tìm kiếm tên hoặc sđt
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase().trim();
            list = list.filter(c => c.name?.toLowerCase().includes(q) || c.phone?.includes(q));
        }

        // SẮP XẾP TỪ NHIỀU ĐƠN NHẤT > ÍT ĐƠN NHẤT
        list.sort((a, b) => {
            if (b.orderCount !== a.orderCount) {
                return b.orderCount - a.orderCount;
            }
            return b.totalAmount - a.totalAmount;
        });

        return list;
    }, [customersData, orders, searchQuery]);

    // Tổng hợp nhanh
    const totalSummary = useMemo(() => {
        let totalOrders = 0;
        let totalRevenue = 0;
        customerStatsList.forEach(c => {
            totalOrders += c.orderCount;
            totalRevenue += c.totalAmount;
        });
        return {
            customerCount: customerStatsList.length,
            orderCount: totalOrders,
            totalRevenue
        };
    }, [customerStatsList]);

    const toggleExpand = (customerId) => {
        setExpandedCustomers(prev => ({
            ...prev,
            [customerId]: !prev[customerId]
        }));
    };

    const handleRefresh = useCallback(() => {
        refetchCustomers();
        if (filterMode === 'day') {
            refetchOrdersDay();
        } else {
            fetchRangeOrders();
        }
        fetchInvoiceStatus();
    }, [refetchCustomers, filterMode, refetchOrdersDay, fetchRangeOrders, fetchInvoiceStatus]);

    const isLoading = isCustomersLoading || (filterMode === 'day' ? ordersLoadingDay : rangeLoading);
    const isRefetching = isCustomersRefetching || (filterMode === 'day' ? ordersRefetchingDay : rangeLoading);

    const formatTime = (isoString) => {
        if (!isoString) return '';
        const d = new Date(isoString);
        return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    };

    const renderDateSelector = () => (
        <View style={styles.filterSection}>
            {/* Filter mode selector */}
            <View style={styles.filterModeTabs}>
                <TouchableOpacity
                    style={[styles.modeTab, filterMode === 'day' && styles.modeTabActive]}
                    onPress={() => setFilterMode('day')}
                >
                    <Text style={[styles.modeTabText, filterMode === 'day' && styles.modeTabTextActive]}>Ngày</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.modeTab, filterMode === 'month' && styles.modeTabActive]}
                    onPress={() => setFilterMode('month')}
                >
                    <Text style={[styles.modeTabText, filterMode === 'month' && styles.modeTabTextActive]}>Tháng</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.modeTab, filterMode === 'year' && styles.modeTabActive]}
                    onPress={() => setFilterMode('year')}
                >
                    <Text style={[styles.modeTabText, filterMode === 'year' && styles.modeTabTextActive]}>Năm</Text>
                </TouchableOpacity>
            </View>

            {/* Date Navigation Bar */}
            <View style={styles.dateNavRow}>
                <TouchableOpacity style={styles.dateNavBtn} onPress={() => changeDate(-1)}>
                    <Ionicons name="chevron-back" size={20} color="#1F2937" />
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.dateDisplayBtn}
                    onPress={() => {
                        if (filterMode === 'day') setShowDatePicker(true);
                    }}
                >
                    <Ionicons name="calendar-outline" size={17} color="#2563EB" style={{ marginRight: 6 }} />
                    <Text style={styles.dateDisplayText}>{formatDisplayDate(selectedDate)}</Text>
                    {filterMode === 'day' && (
                        <Ionicons name="caret-down" size={12} color="#6B7280" style={{ marginLeft: 4 }} />
                    )}
                </TouchableOpacity>

                <TouchableOpacity style={styles.dateNavBtn} onPress={() => changeDate(1)}>
                    <Ionicons name="chevron-forward" size={20} color="#1F2937" />
                </TouchableOpacity>
            </View>

            {showDatePicker && (
                <DateTimePicker
                    value={new Date(selectedDate + 'T00:00:00')}
                    mode="date"
                    display="default"
                    onChange={handleDatePicked}
                />
            )}
        </View>
    );

    const renderCustomerCard = ({ item, index }) => {
        const isExpanded = expandedCustomers[item.id];
        const isTop3 = index < 3;
        const rankColors = ['#F59E0B', '#64748B', '#B45309'];
        const rankColor = isTop3 ? rankColors[index] : '#9CA3AF';

        return (
            <View style={styles.card}>
                {/* Header row */}
                <TouchableOpacity
                    style={styles.cardHeader}
                    onPress={() => toggleExpand(item.id)}
                    activeOpacity={0.7}
                >
                    {/* Rank Badge */}
                    <View style={[styles.rankBadge, { backgroundColor: isTop3 ? rankColor : '#F3F4F6' }]}>
                        <Text style={[styles.rankText, { color: isTop3 ? '#FFF' : '#4B5563' }]}>
                            #{index + 1}
                        </Text>
                    </View>

                    <View style={styles.customerInfo}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6 }}>
                            <Text style={styles.customerName}>{item.name}</Text>
                            {invoicedCustomerIds[item.id] && filterMode === 'day' && (
                                <View style={styles.invoicedBadge}>
                                    <Text style={styles.invoicedBadgeText}>✓ Đã xuất bill</Text>
                                </View>
                            )}
                        </View>
                        {(item.phone || item.address) ? (
                            <Text style={styles.customerContact}>
                                {item.phone ? `${item.phone} ` : ''}
                                {item.phone && item.address ? '| ' : ''}
                                {item.address ? `Thuế: ${item.address}%` : ''}
                            </Text>
                        ) : null}
                    </View>

                    {/* Order Count & Total Amount */}
                    <View style={styles.cardHeaderRight}>
                        <View style={styles.orderCountBadge}>
                            <Text style={styles.orderCountText}>{item.orderCount} đơn</Text>
                        </View>
                        <Text style={styles.totalAmountText}>{formatCurrency(item.totalAmount)}</Text>
                    </View>

                    <Ionicons
                        name={isExpanded ? 'chevron-up' : 'chevron-down'}
                        size={20}
                        color="#6B7280"
                        style={{ marginLeft: 6 }}
                    />
                </TouchableOpacity>

                {/* Action buttons row */}
                <View style={styles.actionRow}>
                    <TouchableOpacity
                        style={styles.detailBtn}
                        onPress={() => navigation.navigate('CustomerDetail', { customerId: item.id })}
                    >
                        <Ionicons name="document-text-outline" size={15} color="#2563EB" style={{ marginRight: 4 }} />
                        <Text style={styles.detailBtnText}>Làm bill & Chi tiết</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.expandToggleBtn}
                        onPress={() => toggleExpand(item.id)}
                    >
                        <Text style={styles.expandToggleText}>
                            {isExpanded ? 'Thu gọn đơn' : `Xem ${item.orderCount} đơn`}
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Accordion Sub-list: Giống đơn nhân viên đánh */}
                {isExpanded && (
                    <View style={styles.ordersListContainer}>
                        <Text style={styles.subListTitle}>Danh sách đơn hàng ({item.orderCount} đơn):</Text>
                        {item.orders.map((order, oIndex) => (
                            <TouchableOpacity
                                key={order.id}
                                style={styles.orderItem}
                                onPress={() => navigation.navigate('OrderDetail', { orderId: order.id })}
                                activeOpacity={0.7}
                            >
                                <View style={styles.orderItemLeft}>
                                    <View style={styles.orderIndexBadge}>
                                        <Text style={styles.orderIndexText}>{oIndex + 1}</Text>
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                            <Ionicons name="storefront-outline" size={13} color="#2563EB" style={{ marginRight: 4 }} />
                                            <Text style={styles.orderCounterName} numberOfLines={1}>
                                                Quầy: {order.counterName || 'Chưa đặt quầy'}
                                            </Text>
                                        </View>
                                        <Text style={styles.orderStaffText}>
                                            NV: {order.staffName || '---'} | {formatTime(order.createdAt)}
                                        </Text>
                                    </View>
                                </View>

                                <View style={styles.orderItemRight}>
                                    <Text style={styles.orderMoneyDetail}>
                                        Ứng: {formatCurrency(order.tienHang || 0)}
                                    </Text>
                                    {(Number(order.tienThem) || 0) > 0 && (
                                        <Text style={styles.orderTaxDetail}>
                                            Thuế: {formatCurrency(order.tienThem || 0)}
                                        </Text>
                                    )}
                                    <Text style={styles.orderTotalText}>
                                        {formatCurrency(order.tongTienHoaDon || 0)}
                                    </Text>
                                </View>
                            </TouchableOpacity>
                        ))}
                    </View>
                )}
            </View>
        );
    };

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.title}>Quản lý Khách hàng</Text>
                <TouchableOpacity
                    style={styles.refreshIconBtn}
                    onPress={handleRefresh}
                >
                    <Ionicons name="refresh-outline" size={20} color="#1F2937" />
                </TouchableOpacity>
            </View>

            {/* Date filter bar */}
            {renderDateSelector()}

            {/* Quick summary stats */}
            <View style={styles.summaryBar}>
                <View style={styles.summaryItem}>
                    <Text style={styles.summaryLabel}>Khách có đơn</Text>
                    <Text style={styles.summaryValue}>{totalSummary.customerCount}</Text>
                </View>
                <View style={styles.summaryDivider} />
                <View style={styles.summaryItem}>
                    <Text style={styles.summaryLabel}>Tổng đơn</Text>
                    <Text style={[styles.summaryValue, { color: '#2563EB' }]}>{totalSummary.orderCount}</Text>
                </View>
                <View style={styles.summaryDivider} />
                <View style={styles.summaryItem}>
                    <Text style={styles.summaryLabel}>Tổng tiền</Text>
                    <Text style={[styles.summaryValue, { color: '#16A34A' }]}>{formatCurrency(totalSummary.totalRevenue)}</Text>
                </View>
            </View>

            {/* Search Input */}
            <View style={styles.searchContainer}>
                <Ionicons name="search" size={18} color="#9CA3AF" style={styles.searchIcon} />
                <TextInput
                    style={styles.searchInput}
                    placeholder="Tìm theo tên hoặc số điện thoại..."
                    placeholderTextColor="#9CA3AF"
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    clearButtonMode="while-editing"
                />
                {searchQuery.length > 0 && (
                    <TouchableOpacity onPress={() => setSearchQuery('')} style={{ padding: 4 }}>
                        <Ionicons name="close-circle" size={18} color="#9CA3AF" />
                    </TouchableOpacity>
                )}
            </View>

            {/* List */}
            {isLoading && !isRefetching && customerStatsList.length === 0 ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={theme?.colors?.primary?.default || '#007AFF'} />
                    <Text style={styles.loadingText}>Đang tải danh sách đơn...</Text>
                </View>
            ) : (
                <FlatList
                    data={customerStatsList}
                    keyExtractor={(item) => item.id}
                    renderItem={renderCustomerCard}
                    contentContainerStyle={styles.listContainer}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Ionicons name="people-outline" size={48} color="#D1D5DB" />
                            <Text style={styles.emptyText}>
                                {searchQuery ? 'Không tìm thấy khách hàng phù hợp' : 'Không có khách nào có đơn hàng trong khoảng thời gian này'}
                            </Text>
                        </View>
                    }
                    refreshControl={
                        <RefreshControl
                            refreshing={isRefetching}
                            onRefresh={handleRefresh}
                            colors={[theme?.colors?.primary?.default || '#007AFF']}
                        />
                    }
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F3F4F6',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingTop: Platform.OS === 'ios' ? 56 : 40,
        paddingBottom: 12,
        backgroundColor: '#FFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#111827',
    },
    refreshIconBtn: {
        padding: 8,
        borderRadius: 8,
        backgroundColor: '#F3F4F6',
    },
    filterSection: {
        backgroundColor: '#FFF',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    filterModeTabs: {
        flexDirection: 'row',
        backgroundColor: '#F3F4F6',
        borderRadius: 8,
        padding: 3,
        marginBottom: 10,
    },
    modeTab: {
        flex: 1,
        paddingVertical: 6,
        alignItems: 'center',
        borderRadius: 6,
    },
    modeTabActive: {
        backgroundColor: '#FFF',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 1,
    },
    modeTabText: {
        fontSize: 13,
        fontWeight: '500',
        color: '#6B7280',
    },
    modeTabTextActive: {
        fontWeight: '700',
        color: '#2563EB',
    },
    dateNavRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    dateNavBtn: {
        padding: 8,
        borderRadius: 8,
        backgroundColor: '#F3F4F6',
    },
    dateDisplayBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 14,
        paddingVertical: 7,
        borderRadius: 8,
        backgroundColor: '#EFF6FF',
    },
    dateDisplayText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1E40AF',
    },
    summaryBar: {
        flexDirection: 'row',
        backgroundColor: '#FFF',
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    summaryItem: {
        flex: 1,
        alignItems: 'center',
    },
    summaryLabel: {
        fontSize: 11,
        color: '#6B7280',
        marginBottom: 2,
    },
    summaryValue: {
        fontSize: 15,
        fontWeight: '700',
        color: '#111827',
    },
    summaryDivider: {
        width: 1,
        backgroundColor: '#E5E7EB',
        marginVertical: 4,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF',
        marginHorizontal: 16,
        marginTop: 10,
        marginBottom: 6,
        paddingHorizontal: 12,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        height: 42,
    },
    searchIcon: {
        marginRight: 8,
    },
    searchInput: {
        flex: 1,
        fontSize: 14,
        color: '#111827',
    },
    listContainer: {
        padding: 16,
        paddingBottom: 100,
    },
    card: {
        backgroundColor: '#FFF',
        borderRadius: 12,
        marginBottom: 12,
        padding: 14,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
        elevation: 2,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    rankBadge: {
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 10,
    },
    rankText: {
        fontSize: 12,
        fontWeight: 'bold',
    },
    customerInfo: {
        flex: 1,
    },
    customerName: {
        fontSize: 16,
        fontWeight: '700',
        color: '#111827',
    },
    customerContact: {
        fontSize: 12,
        color: '#6B7280',
        marginTop: 2,
    },
    invoicedBadge: {
        backgroundColor: '#10B981',
        paddingHorizontal: 6,
        paddingVertical: 1,
        borderRadius: 8,
    },
    invoicedBadgeText: {
        color: '#FFF',
        fontSize: 10,
        fontWeight: 'bold',
    },
    cardHeaderRight: {
        alignItems: 'flex-end',
        marginLeft: 8,
    },
    orderCountBadge: {
        backgroundColor: '#EFF6FF',
        borderColor: '#BFDBFE',
        borderWidth: 1,
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 12,
        marginBottom: 4,
    },
    orderCountText: {
        color: '#2563EB',
        fontSize: 12,
        fontWeight: '700',
    },
    totalAmountText: {
        fontSize: 15,
        fontWeight: 'bold',
        color: '#111827',
    },
    actionRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
        marginTop: 10,
        paddingTop: 10,
    },
    detailBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#EFF6FF',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
    },
    detailBtnText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#2563EB',
    },
    expandToggleBtn: {
        paddingHorizontal: 10,
        paddingVertical: 6,
    },
    expandToggleText: {
        fontSize: 12,
        color: '#6B7280',
        fontWeight: '500',
    },
    ordersListContainer: {
        backgroundColor: '#F9FAFB',
        borderRadius: 8,
        padding: 10,
        marginTop: 10,
        borderWidth: 1,
        borderColor: '#F3F4F6',
    },
    subListTitle: {
        fontSize: 12,
        fontWeight: '600',
        color: '#4B5563',
        marginBottom: 8,
    },
    orderItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#FFF',
        padding: 10,
        borderRadius: 8,
        marginBottom: 6,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    orderItemLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    orderIndexBadge: {
        width: 22,
        height: 22,
        borderRadius: 11,
        backgroundColor: '#EFF6FF',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 8,
    },
    orderIndexText: {
        fontSize: 11,
        fontWeight: '700',
        color: '#2563EB',
    },
    orderCounterName: {
        fontSize: 13,
        fontWeight: '600',
        color: '#1F2937',
    },
    orderStaffText: {
        fontSize: 11,
        color: '#6B7280',
        marginTop: 2,
    },
    orderItemRight: {
        alignItems: 'flex-end',
        marginLeft: 8,
    },
    orderMoneyDetail: {
        fontSize: 11,
        color: '#6B7280',
    },
    orderTaxDetail: {
        fontSize: 10,
        color: '#9CA3AF',
    },
    orderTotalText: {
        fontSize: 13,
        fontWeight: '700',
        color: '#2563EB',
        marginTop: 2,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 40,
    },
    loadingText: {
        marginTop: 10,
        color: '#6B7280',
        fontSize: 14,
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 40,
        paddingHorizontal: 20,
    },
    emptyText: {
        textAlign: 'center',
        color: '#9CA3AF',
        marginTop: 10,
        fontSize: 14,
        lineHeight: 20,
    },
});
