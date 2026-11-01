import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    Modal,
    TextInput,
    Alert,
    Platform,
    RefreshControl,
    Keyboard,
    TouchableWithoutFeedback,
    KeyboardAvoidingView
} from 'react-native';
import { showError, showValidationError } from '../../utils/errorHelper';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { theme } from '../../theme/theme';
import { formatCurrency, formatDate, getLocalDateString } from '../../utils/helpers';

import {
    useCustomersList,
    useCreateCustomer,
    useUpdateCustomer,
    useDeleteCustomer
} from '../../hooks/queries/useCustomers';
import { useOrdersByDate } from '../../hooks/queries/useOrders';
import { getOrdersByDateRangeAPI } from '../../api/orders';

export default function AdminAllCustomersScreen({ navigation }) {
    // Filter mode: 'month' | 'year'
    const [filterMode, setFilterMode] = useState('month');
    const today = getLocalDateString(new Date());
    const [selectedDate, setSelectedDate] = useState(today);
    const [showDatePicker, setShowDatePicker] = useState(false);

    // Expanded customer accordion: { [customerId]: boolean }
    const [expandedCustomers, setExpandedCustomers] = useState({});

    // Search query
    const [searchQuery, setSearchQuery] = useState('');

    // Modal state for Add / Edit customer
    const [modalVisible, setModalVisible] = useState(false);
    const [editingCustomer, setEditingCustomer] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        defaultTax: '',
        defaultTienCongGom: ''
    });

    // Date range for 'month' or 'year' mode
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

    // Change date step (-1 or +1)
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

    // Queries: Customers list
    const {
        data: customersData = [],
        isLoading: isCustomersLoading,
        isRefetching: isCustomersRefetching,
        refetch: refetchCustomers
    } = useCustomersList();

    // Queries: Orders by day
    const {
        data: ordersDataDay,
        isLoading: ordersLoadingDay,
        isRefetching: ordersRefetchingDay,
        refetch: refetchOrdersDay
    } = useOrdersByDate(filterMode === 'day' ? selectedDate : null);

    // Queries: Orders by range (month/year)
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

    // Consolidate orders
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

    // Map customer stats from orders
    const customerStatsMap = useMemo(() => {
        const map = {};
        orders.forEach(order => {
            if (order.status === 'cancelled') return;
            const cId = order.customerId;
            if (!cId) return;

            if (!map[cId]) {
                map[cId] = {
                    orderCount: 0,
                    totalAmount: 0,
                    totalTienUng: 0,
                    orders: []
                };
            }
            map[cId].orderCount += 1;
            map[cId].totalAmount += (Number(order.tongTienHoaDon) || 0);
            map[cId].totalTienUng += (Number(order.tienHang) || 0);
            map[cId].orders.push(order);
        });
        return map;
    }, [orders]);

    // Combine all customers with stats & sort by orderCount DESCENDING
    const customersWithStats = useMemo(() => {
        let baseList = [];
        if (customersData?.success && Array.isArray(customersData.data)) baseList = customersData.data;
        else if (Array.isArray(customersData)) baseList = customersData;

        const combined = baseList.map(c => {
            const stats = customerStatsMap[c.id] || {
                orderCount: 0,
                totalAmount: 0,
                totalTienUng: 0,
                orders: []
            };
            return {
                ...c,
                orderCount: stats.orderCount,
                totalAmount: stats.totalAmount,
                totalTienUng: stats.totalTienUng,
                orders: stats.orders
            };
        });

        let list = combined;
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase().trim();
            list = list.filter(c =>
                c.name?.toLowerCase().includes(q) ||
                c.phone?.includes(q)
            );
        }

        // SẮP XẾP TỪ NHIỀU ĐƠN NHẤT > ÍT ĐƠN NHẤT
        list.sort((a, b) => {
            if (b.orderCount !== a.orderCount) {
                return b.orderCount - a.orderCount;
            }
            if (b.orderCount > 0 && b.totalAmount !== a.totalAmount) {
                return b.totalAmount - a.totalAmount;
            }
            return (a.name || '').localeCompare(b.name || '');
        });

        return list;
    }, [customersData, customerStatsMap, searchQuery]);

    // Overall summary for current selection
    const summaryStats = useMemo(() => {
        let activeCustomers = 0;
        let totalOrders = 0;
        let totalRevenue = 0;

        customersWithStats.forEach(c => {
            if (c.orderCount > 0) {
                activeCustomers += 1;
                totalOrders += c.orderCount;
                totalRevenue += c.totalAmount;
            }
        });

        return {
            totalCustomers: customersWithStats.length,
            activeCustomers,
            totalOrders,
            totalRevenue
        };
    }, [customersWithStats]);

    // Mutations
    const createCustomerMutation = useCreateCustomer();
    const updateCustomerMutation = useUpdateCustomer();
    const deleteCustomerMutation = useDeleteCustomer();

    const handleRefresh = useCallback(() => {
        refetchCustomers();
        if (filterMode === 'day') {
            refetchOrdersDay();
        } else {
            fetchRangeOrders();
        }
    }, [refetchCustomers, filterMode, refetchOrdersDay, fetchRangeOrders]);

    const toggleExpand = (customerId) => {
        setExpandedCustomers(prev => ({
            ...prev,
            [customerId]: !prev[customerId]
        }));
    };

    const handleSave = () => {
        if (!formData.name.trim()) {
            showValidationError('Vui lòng nhập tên khách hàng');
            return;
        }

        const payload = {
            name: formData.name.trim(),
            phone: formData.phone ? formData.phone.trim() : '',
            address: formData.defaultTax ? formData.defaultTax.trim() : '',
            defaultTienCongGom: formData.defaultTienCongGom ? parseInt(formData.defaultTienCongGom) : null,
        };

        if (editingCustomer) {
            updateCustomerMutation.mutate(
                { customerId: editingCustomer.id, customerData: payload },
                {
                    onSuccess: () => {
                        Alert.alert('Thành công', 'Đã cập nhật thông tin khách hàng');
                        closeModal();
                    },
                    onError: (error) => showError(error, 'cập nhật thông tin khách hàng')
                }
            );
        } else {
            createCustomerMutation.mutate(
                payload,
                {
                    onSuccess: () => {
                        Alert.alert('Thành công', 'Đã thêm khách hàng mới');
                        closeModal();
                    },
                    onError: (error) => showError(error, 'tạo khách hàng')
                }
            );
        }
    };

    const handleDelete = (id, name) => {
        Alert.alert(
            'Xác nhận xóa',
            `Bạn có chắc chắn muốn xóa khách hàng "${name || 'này'}"?`,
            [
                { text: 'Hủy', style: 'cancel' },
                {
                    text: 'Xóa',
                    style: 'destructive',
                    onPress: () => {
                        deleteCustomerMutation.mutate(id, {
                            onSuccess: () => Alert.alert('Thành công', 'Đã xóa khách hàng'),
                            onError: (error) => showError(error, 'xóa khách hàng')
                        });
                    }
                }
            ]
        );
    };

    const openModal = (customer = null) => {
        if (customer) {
            setEditingCustomer(customer);
            setFormData({
                name: customer.name || '',
                phone: customer.phone || '',
                defaultTax: customer.address || '',
                defaultTienCongGom: customer.defaultTienCongGom ? customer.defaultTienCongGom.toString() : ''
            });
        } else {
            setEditingCustomer(null);
            setFormData({
                name: '',
                phone: '',
                defaultTax: '',
                defaultTienCongGom: ''
            });
        }
        setModalVisible(true);
    };

    const closeModal = () => {
        setModalVisible(false);
        setEditingCustomer(null);
    };

    const formatTime = (isoString) => {
        if (!isoString) return '';
        try {
            const d = new Date(isoString);
            return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
        } catch {
            return '';
        }
    };

    const isMutationPending = createCustomerMutation.isPending || updateCustomerMutation.isPending;
    const isLoading = isCustomersLoading || (filterMode === 'day' ? ordersLoadingDay : rangeLoading);
    const isRefetching = isCustomersRefetching || (filterMode === 'day' ? ordersRefetchingDay : rangeLoading);

    const renderDateSelector = () => (
        <View style={styles.filterSection}>
            {/* Filter mode selector: Tháng | Năm */}
            <View style={styles.filterModeTabs}>
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

                <View style={styles.dateDisplayBtn}>
                    <Ionicons name="calendar-outline" size={17} color="#2563EB" style={{ marginRight: 6 }} />
                    <Text style={styles.dateDisplayText}>{formatDisplayDate(selectedDate)}</Text>
                </View>

                <TouchableOpacity style={styles.dateNavBtn} onPress={() => changeDate(1)}>
                    <Ionicons name="chevron-forward" size={20} color="#1F2937" />
                </TouchableOpacity>
            </View>
        </View>
    );

    const renderCustomerCard = ({ item, index }) => {
        const isExpanded = !!expandedCustomers[item.id];
        const hasOrders = item.orderCount > 0;
        const isTop3 = hasOrders && index < 3;
        const rankColors = ['#F59E0B', '#64748B', '#B45309'];
        const rankColor = isTop3 ? rankColors[index] : '#2563EB';

        return (
            <View style={styles.card}>
                {/* Header Row: Rank badge, Name, Actions */}
                <View style={styles.cardHeader}>
                    {/* Rank Badge */}
                    <View style={[
                        styles.rankBadge,
                        hasOrders ? (isTop3 ? { backgroundColor: rankColor } : styles.rankBadgeNormal) : styles.rankBadgeZero
                    ]}>
                        <Text style={[
                            styles.rankText,
                            hasOrders ? (isTop3 ? styles.rankTextTop : styles.rankTextNormal) : styles.rankTextZero
                        ]}>
                            {hasOrders ? `#${index + 1}` : '•'}
                        </Text>
                    </View>

                    {/* Customer Info */}
                    <View style={styles.customerInfo}>
                        <Text style={styles.customerName}>{item.name}</Text>

                        {/* 3 dòng theo đúng yêu cầu */}
                        <View style={styles.threeLinesContainer}>
                            <Text style={styles.infoLine}>
                                <Text style={styles.infoLineLabel}>Tổng số đơn : </Text>
                                <Text style={[styles.infoLineValue, hasOrders ? styles.infoLineOrderActive : null]}>
                                    {item.orderCount} đơn{hasOrders ? ` (${formatCurrency(item.totalAmount)})` : ''}
                                </Text>
                            </Text>

                            <Text style={styles.infoLine}>
                                <Text style={styles.infoLineLabel}>Thuế mặc định : </Text>
                                <Text style={styles.infoLineValue}>{item.address ? `${item.address}%` : '0%'}</Text>
                            </Text>

                            <Text style={styles.infoLine}>
                                <Text style={styles.infoLineLabel}>Phí gom mặc định : </Text>
                                <Text style={styles.infoLineValue}>
                                    {item.defaultTienCongGom ? `${Number(item.defaultTienCongGom).toLocaleString('vi-VN')}đ` : '0đ'}
                                </Text>
                            </Text>

                            {item.phone ? (
                                <Text style={[styles.infoLine, { marginTop: 2 }]}>
                                    <Text style={[styles.infoLineLabel, { color: '#9CA3AF' }]}>SĐT : </Text>
                                    <Text style={[styles.infoLineValue, { color: '#6B7280' }]}>{item.phone}</Text>
                                </Text>
                            ) : null}
                        </View>
                    </View>

                    {/* Action buttons (Edit & Delete) */}
                    <View style={styles.actionRowContainer}>
                        <TouchableOpacity
                            style={styles.actionBtn}
                            onPress={() => openModal(item)}
                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        >
                            <Ionicons name="create-outline" size={21} color="#2563EB" />
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.actionBtn}
                            onPress={() => handleDelete(item.id, item.name)}
                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        >
                            <Ionicons name="trash-outline" size={21} color="#EF4444" />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Footer Action Buttons */}
                {hasOrders && (
                    <View style={[styles.cardFooter, { justifyContent: 'flex-end' }]}>
                        <TouchableOpacity
                            style={styles.expandToggleBtn}
                            onPress={() => toggleExpand(item.id)}
                        >
                            <Text style={styles.expandToggleText}>
                                {isExpanded ? 'Thu gọn đơn' : `Xem ${item.orderCount} đơn`}
                            </Text>
                            <Ionicons
                                name={isExpanded ? 'chevron-up' : 'chevron-down'}
                                size={16}
                                color="#2563EB"
                                style={{ marginLeft: 4 }}
                            />
                        </TouchableOpacity>
                    </View>
                )}

                {/* Accordion Sub-list: Giống đơn nhân viên đánh */}
                {isExpanded && hasOrders && (
                    <View style={styles.ordersListContainer}>
                        <Text style={styles.subListTitle}>
                            Danh sách đơn hàng ({item.orderCount} đơn trong {filterMode === 'day' ? 'ngày' : filterMode === 'month' ? 'tháng' : 'năm'}):
                        </Text>
                        {item.orders.map((order, oIndex) => (
                            <TouchableOpacity
                                key={order.id || oIndex}
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
                <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color="#1F2937" />
                </TouchableOpacity>
                <Text style={styles.title}>Tất cả Khách hàng</Text>
                <TouchableOpacity
                    style={styles.addButton}
                    onPress={() => openModal()}
                    activeOpacity={0.8}
                >
                    <Ionicons name="add" size={24} color="#FFF" />
                </TouchableOpacity>
            </View>

            {/* Date filter bar (Ngày / Tháng / Năm) */}
            {renderDateSelector()}

            {/* Summary Bar */}
            <View style={styles.summaryBar}>
                <View style={styles.summaryItem}>
                    <Text style={styles.summaryLabel}>Khách có đơn</Text>
                    <Text style={styles.summaryValue}>{summaryStats.activeCustomers} / {summaryStats.totalCustomers}</Text>
                </View>
                <View style={styles.summaryDivider} />
                <View style={styles.summaryItem}>
                    <Text style={styles.summaryLabel}>Tổng đơn</Text>
                    <Text style={[styles.summaryValue, { color: '#2563EB' }]}>{summaryStats.totalOrders} đơn</Text>
                </View>
                <View style={styles.summaryDivider} />
                <View style={styles.summaryItem}>
                    <Text style={styles.summaryLabel}>Tổng tiền</Text>
                    <Text style={[styles.summaryValue, { color: '#059669' }]}>{formatCurrency(summaryStats.totalRevenue)}</Text>
                </View>
            </View>

            {/* Search Box */}
            <View style={styles.searchContainer}>
                <Ionicons name="search" size={18} color="#8E8E93" style={styles.searchIcon} />
                <TextInput
                    style={styles.searchInput}
                    placeholder="Tìm theo tên hoặc số điện thoại..."
                    placeholderTextColor="#9CA3AF"
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    clearButtonMode="while-editing"
                />
                {searchQuery ? (
                    <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                        <Ionicons name="close-circle" size={18} color="#9CA3AF" />
                    </TouchableOpacity>
                ) : null}
            </View>

            {/* Customer List */}
            {isLoading && !isRefetching && customersWithStats.length === 0 ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#2563EB" />
                    <Text style={styles.loadingText}>Đang tải dữ liệu...</Text>
                </View>
            ) : (
                <FlatList
                    data={customersWithStats}
                    keyExtractor={(item) => item.id}
                    renderItem={renderCustomerCard}
                    contentContainerStyle={styles.listContainer}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Ionicons name="person-outline" size={48} color="#D1D5DB" />
                            <Text style={styles.emptyText}>KHÔNG TÌM THẤY KHÁCH HÀNG</Text>
                        </View>
                    }
                    refreshControl={
                        <RefreshControl
                            refreshing={isRefetching}
                            onRefresh={handleRefresh}
                            colors={['#2563EB']}
                        />
                    }
                />
            )}

            {/* Modal Thêm / Sửa khách hàng */}
            <Modal
                visible={modalVisible}
                transparent={true}
                animationType="slide"
            >
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={{ flex: 1 }}
                >
                    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                        <View style={styles.modalOverlay}>
                            <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
                                <View style={styles.modalContent}>
                                    <View style={styles.modalHeader}>
                                        <Text style={styles.modalTitle}>
                                            {editingCustomer ? 'Sửa thông tin khách hàng' : 'Thêm khách hàng mới'}
                                        </Text>
                                        <TouchableOpacity onPress={closeModal}>
                                            <Ionicons name="close" size={24} color="#333" />
                                        </TouchableOpacity>
                                    </View>

                                    <View style={styles.formGroup}>
                                        <Text style={styles.label}>Tên khách hàng *</Text>
                                        <TextInput
                                            style={styles.input}
                                            value={formData.name}
                                            onChangeText={(text) => setFormData({ ...formData, name: text })}
                                            placeholder="Nhập tên khách hàng"
                                            placeholderTextColor="#9CA3AF"
                                        />
                                    </View>

                                    <View style={styles.formGroup}>
                                        <Text style={styles.label}>Số điện thoại</Text>
                                        <TextInput
                                            style={styles.input}
                                            value={formData.phone}
                                            onChangeText={(text) => setFormData({ ...formData, phone: text })}
                                            placeholder="Nhập số điện thoại"
                                            placeholderTextColor="#9CA3AF"
                                            keyboardType="phone-pad"
                                        />
                                    </View>

                                    <View style={styles.formGroup}>
                                        <Text style={styles.label}>Thuế mặc định (%)</Text>
                                        <TextInput
                                            style={styles.input}
                                            value={formData.defaultTax}
                                            onChangeText={(text) => setFormData({ ...formData, defaultTax: text })}
                                            placeholder="VD: 1.5"
                                            placeholderTextColor="#9CA3AF"
                                            keyboardType="decimal-pad"
                                        />
                                        <Text style={styles.helpText}>Tự động điền khi tạo đơn cho khách này</Text>
                                    </View>

                                    <View style={styles.formGroup}>
                                        <Text style={styles.label}>Phí gom mặc định (VNĐ)</Text>
                                        <TextInput
                                            style={styles.input}
                                            value={formData.defaultTienCongGom}
                                            onChangeText={(text) => setFormData({ ...formData, defaultTienCongGom: text })}
                                            placeholder="VD: 50000"
                                            placeholderTextColor="#9CA3AF"
                                            keyboardType="numeric"
                                        />
                                        <Text style={styles.helpText}>Tự động điền khi tạo đơn cho khách này</Text>
                                    </View>

                                    <TouchableOpacity
                                        style={styles.submitButton}
                                        onPress={handleSave}
                                        disabled={isMutationPending}
                                    >
                                        {isMutationPending ? (
                                            <ActivityIndicator color="#FFF" />
                                        ) : (
                                            <Text style={styles.submitButtonText}>
                                                {editingCustomer ? 'Lưu thay đổi' : 'Thêm khách hàng'}
                                            </Text>
                                        )}
                                    </TouchableOpacity>
                                </View>
                            </TouchableWithoutFeedback>
                        </View>
                    </TouchableWithoutFeedback>
                </KeyboardAvoidingView>
            </Modal>
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
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingTop: Platform.OS === 'ios' ? 56 : 46,
        paddingBottom: 14,
        backgroundColor: '#FFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    backButton: {
        marginRight: 12,
        padding: 4,
    },
    title: {
        flex: 1,
        fontSize: 20,
        fontWeight: '700',
        color: '#111827',
    },
    addButton: {
        backgroundColor: '#2563EB',
        width: 38,
        height: 38,
        borderRadius: 19,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#2563EB',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 3,
        elevation: 3,
    },

    // Date Filter Section
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
        marginBottom: 8,
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
        elevation: 2,
    },
    modeTabText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#6B7280',
    },
    modeTabTextActive: {
        color: '#2563EB',
        fontWeight: '700',
    },
    dateNavRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    dateNavBtn: {
        padding: 6,
        borderRadius: 6,
        backgroundColor: '#F3F4F6',
    },
    dateDisplayBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 6,
        paddingHorizontal: 12,
        backgroundColor: '#EFF6FF',
        borderRadius: 8,
    },
    dateDisplayText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#1D4ED8',
    },

    // Summary Bar
    summaryBar: {
        flexDirection: 'row',
        backgroundColor: '#FFF',
        marginHorizontal: 14,
        marginTop: 10,
        borderRadius: 10,
        paddingVertical: 10,
        paddingHorizontal: 12,
        alignItems: 'center',
        justifyContent: 'space-around',
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    summaryItem: {
        alignItems: 'center',
        flex: 1,
    },
    summaryLabel: {
        fontSize: 11,
        color: '#6B7280',
        marginBottom: 2,
    },
    summaryValue: {
        fontSize: 14,
        fontWeight: '700',
        color: '#1F2937',
    },
    summaryDivider: {
        width: 1,
        height: 24,
        backgroundColor: '#E5E7EB',
    },

    // Search Box
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF',
        marginHorizontal: 14,
        marginTop: 10,
        marginBottom: 6,
        paddingHorizontal: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        height: 40,
    },
    searchIcon: {
        marginRight: 8,
    },
    searchInput: {
        flex: 1,
        fontSize: 14,
        color: '#1F2937',
        paddingVertical: 0,
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
    listContainer: {
        paddingHorizontal: 14,
        paddingTop: 8,
        paddingBottom: 80,
    },

    // Card
    card: {
        backgroundColor: '#FFF',
        borderRadius: 12,
        padding: 14,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    rankBadge: {
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
        marginTop: 2,
    },
    rankBadgeNormal: {
        backgroundColor: '#EFF6FF',
    },
    rankBadgeZero: {
        backgroundColor: '#F3F4F6',
    },
    rankText: {
        fontSize: 13,
        fontWeight: '800',
    },
    rankTextTop: {
        color: '#FFF',
    },
    rankTextNormal: {
        color: '#2563EB',
    },
    rankTextZero: {
        color: '#9CA3AF',
        fontSize: 16,
    },
    customerInfo: {
        flex: 1,
    },
    customerName: {
        fontSize: 16,
        fontWeight: '700',
        color: '#111827',
        marginBottom: 4,
    },
    threeLinesContainer: {
        marginTop: 4,
    },
    infoLine: {
        fontSize: 13,
        lineHeight: 20,
        marginBottom: 2,
    },
    infoLineLabel: {
        color: '#4B5563',
        fontWeight: '500',
    },
    infoLineValue: {
        color: '#111827',
        fontWeight: '600',
    },
    infoLineOrderActive: {
        color: '#2563EB',
        fontWeight: '700',
    },
    statsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 4,
    },
    orderCountBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
    },
    orderCountBadgeActive: {
        backgroundColor: '#EFF6FF',
    },
    orderCountBadgeZero: {
        backgroundColor: '#F3F4F6',
    },
    orderCountText: {
        fontSize: 12,
        fontWeight: '700',
    },
    orderCountTextActive: {
        color: '#2563EB',
    },
    orderCountTextZero: {
        color: '#6B7280',
    },
    totalAmountText: {
        fontSize: 13,
        fontWeight: '700',
        color: '#059669',
    },
    customerContact: {
        fontSize: 12,
        color: '#6B7280',
        lineHeight: 18,
    },
    actionRowContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginLeft: 8,
    },
    actionBtn: {
        padding: 6,
        marginLeft: 4,
    },

    // Card Footer Actions
    cardFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 10,
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
    },
    detailBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 4,
        paddingHorizontal: 8,
        backgroundColor: '#EFF6FF',
        borderRadius: 6,
    },
    detailBtnText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#2563EB',
    },
    expandToggleBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 4,
        paddingHorizontal: 8,
    },
    expandToggleText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#2563EB',
    },

    // Orders Accordion Sub-list
    ordersListContainer: {
        marginTop: 10,
        paddingTop: 10,
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
    },
    subListTitle: {
        fontSize: 12,
        fontWeight: '700',
        color: '#4B5563',
        marginBottom: 8,
    },
    orderItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 8,
        paddingHorizontal: 10,
        backgroundColor: '#F9FAFB',
        borderRadius: 8,
        marginBottom: 6,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    orderItemLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        marginRight: 10,
    },
    orderIndexBadge: {
        width: 22,
        height: 22,
        borderRadius: 11,
        backgroundColor: '#E5E7EB',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 8,
    },
    orderIndexText: {
        fontSize: 11,
        fontWeight: '700',
        color: '#374151',
    },
    orderCounterName: {
        fontSize: 13,
        fontWeight: '700',
        color: '#111827',
    },
    orderStaffText: {
        fontSize: 11,
        color: '#6B7280',
        marginTop: 2,
    },
    orderItemRight: {
        alignItems: 'flex-end',
    },
    orderMoneyDetail: {
        fontSize: 11,
        color: '#4B5563',
    },
    orderTaxDetail: {
        fontSize: 11,
        color: '#D97706',
    },
    orderTotalText: {
        fontSize: 13,
        fontWeight: '700',
        color: '#2563EB',
        marginTop: 1,
    },

    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 50,
    },
    emptyText: {
        textAlign: 'center',
        color: '#9CA3AF',
        marginTop: 12,
        fontSize: 14,
        fontWeight: '600',
    },

    // Modal
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#FFF',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 20,
        paddingBottom: Platform.OS === 'ios' ? 40 : 20,
        maxHeight: '90%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#F2F2F7',
        paddingBottom: 15,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#111827',
    },
    formGroup: {
        marginBottom: 16,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 8,
    },
    input: {
        borderWidth: 1,
        borderColor: '#D1D5DB',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 10,
        fontSize: 15,
        backgroundColor: '#FFF',
        color: '#111827',
    },
    helpText: {
        fontSize: 12,
        color: '#6B7280',
        marginTop: 4,
    },
    submitButton: {
        backgroundColor: '#2563EB',
        borderRadius: 8,
        padding: 14,
        alignItems: 'center',
        marginTop: 10,
    },
    submitButtonText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
});
