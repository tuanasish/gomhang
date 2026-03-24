import React, { useState, useEffect, useMemo } from 'react';
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
    ScrollView,
    Keyboard,
    TouchableWithoutFeedback,
    KeyboardAvoidingView
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { showError } from '../../utils/errorHelper';
import { Ionicons } from '@expo/vector-icons';
import { getOrdersByDateAPI, updateOrderStatusAPI } from '../../api/orders';
import { getAllCustomerDailyFeesAPI } from '../../api/customers';
import DateTimePicker from '@react-native-community/datetimepicker';
import { theme } from '../../theme/theme';
import { formatCurrency, formatDate, getLocalDateString } from '../../utils/helpers';
import { useAuth } from '../../context/AuthContext';

import { useUpdateOrder } from '../../hooks/queries/useOrders';

export default function ManagerOrdersScreen({ navigation }) {
    const { userInfo } = useAuth();

    const [filterDate, setFilterDate] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [filterStatus, setFilterStatus] = useState('all');

    const [editModalVisible, setEditModalVisible] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [invoicedCustomers, setInvoicedCustomers] = useState({});

    const [editForm, setEditForm] = useState({
        customerName: '',
        counterName: '',
        tienHang: '0',
        tienCongGom: '0',
        phiDongHang: '0',
        tienHoaHong: '0',
        tienThem: '0',
        loaiTienThem: ''
    });

    const [thueStr, setThueStr] = useState('');
    const tienThue = useMemo(() => {
        const base = parseInt(editForm.tienHang) || 0;
        const rate = parseFloat(thueStr.replace(',', '.')) || 0;
        return Math.round(base * (rate / 100));
    }, [editForm.tienHang, thueStr]);

    const [ordersRes, setOrdersRes] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefetching, setIsRefetching] = useState(false);
    const updateOrderMutation = useUpdateOrder();

    const loading = isLoading;

    const [expandedGroups, setExpandedGroups] = useState({}); // { customerName: boolean }

    // Derived state for filtered orders
    const orders = React.useMemo(() => {
        const list = ordersRes?.success ? ordersRes.data : [];
        if (filterStatus === 'all') return list;
        return list.filter(o => o.status === filterStatus);
    }, [ordersRes, filterStatus]);

    // Group orders by customerName
    const groupedOrders = React.useMemo(() => {
        const groups = {};
        orders.forEach(order => {
            const customerName = order.customerName || 'Khách vãng lai';
            if (!groups[customerName]) {
                groups[customerName] = {
                    customerName,
                    orders: [],
                    totalAmount: 0,
                    count: 0
                };
            }
            groups[customerName].orders.push(order);
            groups[customerName].totalAmount += (order.tongTienHoaDon || 0);
            groups[customerName].count += 1;
        });
        return Object.values(groups);
    }, [orders]);

    const toggleGroup = (customerName) => {
        setExpandedGroups(prev => ({
            ...prev,
            [customerName]: !prev[customerName]
        }));
    };

    const handleDateChange = (event, selected) => {
        setShowDatePicker(Platform.OS === 'ios');
        if (selected) setFilterDate(selected);
    };

    const fetchOrders = async () => {
        setIsLoading(true);
        setIsRefetching(true);
        try {
            const dateStr = getLocalDateString(filterDate);

            // Promise.all to fetch orders and fees concurrently
            const [ordersResponse, feesResponse] = await Promise.all([
                getOrdersByDateAPI(dateStr),
                getAllCustomerDailyFeesAPI(dateStr)
            ]);

            setOrdersRes(ordersResponse);

            // Map the invoiced status
            if (feesResponse?.success && feesResponse.data) {
                const invoicedMap = {};
                feesResponse.data.forEach(fee => {
                    if (fee.isInvoiced) {
                        invoicedMap[fee.customerName || 'Khách vãng lai'] = true;
                    }
                });
                setInvoicedCustomers(invoicedMap);
            } else {
                setInvoicedCustomers({});
            }
        } catch (error) {
            console.error('Fetch data error:', error);
            setOrdersRes({ success: false, data: [] });
            setInvoicedCustomers({});
        } finally {
            setIsLoading(false);
            setIsRefetching(false);
        }
    };

    useFocusEffect(
        React.useCallback(() => {
            fetchOrders();
        }, [filterDate])
    );

    const executeCancel = async (id) => {
        try {
            await updateOrderMutation.mutateAsync({ orderId: id, orderData: { status: 'cancelled' } });
            Alert.alert('Thành công', 'Đã hủy đơn hàng');
            fetchOrders(); // Refetch data after successful cancellation
        } catch (error) {
            console.error('Cancel order error:', error);
            showError(error, 'hủy đơn hàng');
        }
    };

    const handleCancel = (id) => {
        if (Platform.OS === 'web') {
            if (window.confirm('Hủy đơn hàng này?')) {
                executeCancel(id);
            }
        } else {
            Alert.alert('Xác nhận', 'Hủy đơn hàng này?', [
                { text: 'Không' },
                { text: 'Hủy đơn', style: 'destructive', onPress: () => executeCancel(id) }
            ]);
        }
    };

    const openEditModal = (order) => {
        setSelectedOrder(order);
        setEditForm({
            customerName: order.customerName || '',
            counterName: order.counterName || '',
            tienHang: order.tienHang.toString(),
            tienCongGom: order.tienCongGom.toString(),
            phiDongHang: order.phiDongHang.toString(),
            tienHoaHong: (order.tienHoaHong || 0).toString(),
            tienThem: (order.tienThem || 0).toString(),
            loaiTienThem: order.loaiTienThem || ''
        });

        if (order.loaiTienThem && order.loaiTienThem.includes('%')) {
            const match = order.loaiTienThem.match(/(?:[\d.,]+)/);
            if (match) {
                setThueStr(match[0]);
            } else {
                setThueStr('');
            }
        } else {
            setThueStr('');
        }

        setEditModalVisible(true);
    };

    const handleSaveEdit = async () => {
        const tienHang = parseInt(editForm.tienHang) || 0;
        const tienCongGom = parseInt(editForm.tienCongGom) || 0;
        const phiDongHang = parseInt(editForm.phiDongHang) || 0;
        const tienHoaHong = parseInt(editForm.tienHoaHong) || 0;

        let tienThem = parseInt(editForm.tienThem) || 0;
        let loaiTienThem = editForm.loaiTienThem || null;

        if (tienThue > 0 || thueStr !== '') {
            const rate = parseFloat(thueStr.replace(',', '.')) || 0;
            if (Math.round(tienHang * rate / 100) > 0) {
                tienThem = Math.round(tienHang * rate / 100);
                loaiTienThem = `Thuế ${rate}%`;
            } else if (loaiTienThem && loaiTienThem.startsWith('Thuế')) {
                tienThem = 0;
                loaiTienThem = null;
            }
        }

        const payload = {
            customerName: editForm.customerName || null,
            counterName: editForm.counterName || null,
            tienHang,
            tienCongGom,
            phiDongHang,
            tienHoaHong,
            tienThem,
            loaiTienThem,
            tongTienHoaDon: tienHang + tienCongGom + phiDongHang + tienHoaHong + tienThem
        };

        try {
            await updateOrderMutation.mutateAsync({ orderId: selectedOrder.id, orderData: payload });
            Alert.alert('Thành công', 'Đã lưu thay đổi');
            setEditModalVisible(false);
        } catch (error) {
            console.error('Update order error:', error);
            showError(error, 'cập nhật đơn hàng');
        }
    };

    const getStatusInfo = (status) => {
        switch (status) {
            case 'completed': return { label: 'Hoàn thành', color: '#4CAF50', bg: '#E8F5E9' };
            case 'pending': return { label: 'Chờ xử lý', color: '#FF9800', bg: '#FFF3E0' };
            case 'cancelled': return { label: 'Đã hủy', color: '#F44336', bg: '#FFEBEE' };
            default: return { label: status, color: '#666', bg: '#F2F2F7' };
        }
    };

    const renderItem = ({ item }) => {
        const isExpanded = expandedGroups[item.customerName];

        return (
            <View style={styles.groupCard}>
                <TouchableOpacity
                    style={styles.groupHeader}
                    onPress={() => toggleGroup(item.customerName)}
                >
                    <View style={styles.groupHeaderLeft}>
                        <Ionicons
                            name={isExpanded ? 'chevron-down' : 'chevron-forward'}
                            size={20}
                            color="#333"
                        />
                        <Text style={styles.groupCustomerName}>{item.customerName}</Text>
                        <View style={styles.groupCountBadge}>
                            <Text style={styles.groupCountText}>{item.count}</Text>
                        </View>
                        {invoicedCustomers[item.customerName] && (
                            <View style={{ marginLeft: 8, backgroundColor: '#10B981', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 12 }}>
                                <Text style={{ color: '#fff', fontSize: 10, fontWeight: 'bold' }}>✓ Đã xuất</Text>
                            </View>
                        )}
                    </View>
                    <Text style={styles.groupTotalAmount}>{formatCurrency(item.totalAmount)}</Text>
                </TouchableOpacity>

                {isExpanded && (
                    <View style={styles.groupContent}>
                        {item.orders.map(order => renderOrderCard(order))}
                    </View>
                )}
            </View>
        );
    };

    const renderOrderCard = (item) => {
        const sInfo = getStatusInfo(item.status);
        return (
            <View key={item.id} style={styles.card}>
                <View style={styles.cardHeader}>
                    <View>
                        <Text style={styles.orderId}>#{item.id.slice(0, 8).toUpperCase()}</Text>
                        <Text style={styles.orderDate}>{formatDate(item.createdAt)}</Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: sInfo.bg }]}>
                        <Text style={[styles.statusText, { color: sInfo.color }]}>{sInfo.label}</Text>
                    </View>
                </View>

                <View style={styles.cardBody}>
                    <View style={styles.cardBodyColumns}>
                        {/* Left column: staff & counter */}
                        <View style={styles.cardBodyLeft}>
                            <View style={styles.infoRow}>
                                <Ionicons name="person-outline" size={14} color="#8E8E93" />
                                <Text style={styles.infoLabel}>NV:</Text>
                                <Text style={styles.infoValue}>{item.staffName || '---'}</Text>
                            </View>
                            <View style={styles.infoRow}>
                                <Ionicons name="storefront-outline" size={14} color="#8E8E93" />
                                <Text style={styles.infoLabel}>Quầy:</Text>
                                <Text style={styles.infoValue}>{item.counterName || '---'}</Text>
                            </View>
                        </View>
                        {/* Right column: financial details */}
                        <View style={styles.cardBodyRight}>
                            <View style={styles.moneyRow}>
                                <Text style={styles.moneyLabel}>Tiền ứng:</Text>
                                <Text style={styles.moneyValue}>{formatCurrency(item.tienHang)}</Text>
                            </View>
                            <View style={styles.moneyRow}>
                                <Text style={styles.moneyLabel}>Hoa hồng:</Text>
                                <Text style={styles.moneyValue}>{formatCurrency(item.tienHoaHong || 0)}</Text>
                            </View>
                            {(item.tienThem > 0 || (item.loaiTienThem && item.loaiTienThem.includes('Thuế'))) && (
                                <View style={styles.moneyRow}>
                                    <Text style={styles.moneyLabel}>{item.loaiTienThem || 'Thuế'}:</Text>
                                    <Text style={styles.moneyValue}>{formatCurrency(item.tienThem || 0)}</Text>
                                </View>
                            )}
                            <View style={[styles.moneyRow, styles.totalRow]}>
                                <Text style={styles.totalLabel}>Tổng:</Text>
                                <Text style={styles.totalValue}>{formatCurrency(item.tongTienHoaDon)}</Text>
                            </View>
                        </View>
                    </View>
                </View>

                <View style={styles.cardActions}>
                    <TouchableOpacity style={styles.btnDetail} onPress={() => navigation.navigate('OrderDetail', { orderId: item.id })}>
                        <Text style={styles.btnDetailText}>Chi tiết</Text>
                    </TouchableOpacity>
                    {userInfo?.role === 'admin' && (
                        <TouchableOpacity style={styles.btnEdit} onPress={() => openEditModal(item)}>
                            <Text style={styles.btnEditText}>Sửa</Text>
                        </TouchableOpacity>
                    )}
                    {item.status === 'completed' && (
                        <>
                            <TouchableOpacity style={styles.btnCancel} onPress={() => handleCancel(item.id)}>
                                <Text style={styles.btnCancelText}>Hủy</Text>
                            </TouchableOpacity>
                        </>
                    )}
                </View>
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Danh sách Đơn hàng</Text>
            </View>

            <View style={styles.filterSection}>
                <TouchableOpacity style={styles.dateFilter} onPress={() => setShowDatePicker(true)}>
                    <Ionicons name="calendar-outline" size={20} color="#333" />
                    <Text style={styles.dateFilterText}>{formatDate(filterDate)}</Text>
                </TouchableOpacity>

                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.statusFilters}>
                    {['all', 'completed', 'cancelled'].map(status => (
                        <TouchableOpacity
                            key={status}
                            style={[styles.statusBtn, filterStatus === status && styles.statusBtnActive]}
                            onPress={() => setFilterStatus(status)}
                        >
                            <Text style={[styles.statusBtnText, filterStatus === status && styles.statusBtnTextActive]}>
                                {status === 'all' ? 'Tất cả' : getStatusInfo(status).label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            {showDatePicker && (
                <DateTimePicker
                    value={filterDate}
                    mode="date"
                    display="default"
                    onChange={handleDateChange}
                />
            )}

            {loading && !ordersRes ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={theme?.colors?.primary?.default || '#007AFF'} />
                </View>
            ) : (
                <FlatList
                    data={groupedOrders}
                    keyExtractor={item => item.customerName}
                    renderItem={renderItem}
                    contentContainerStyle={styles.listContainer}
                    ListEmptyComponent={<Text style={styles.emptyText}>Không tìm thấy đơn hàng</Text>}
                    refreshing={isRefetching}
                    onRefresh={fetchOrders}
                />
            )}

            <Modal visible={editModalVisible} transparent={true} animationType="slide">
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={{ flex: 1 }}
                >
                    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                        <View style={styles.modalOverlay}>
                            <View style={styles.modalContent}>
                                <ScrollView
                                    keyboardShouldPersistTaps="handled"
                                    showsVerticalScrollIndicator={false}
                                >
                                    <View style={styles.modalHeader}>
                                        <Text style={styles.modalTitle}>Sửa hóa đơn</Text>
                                        <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                                            <Ionicons name="close" size={24} color="#333" />
                                        </TouchableOpacity>
                                    </View>

                                    <Text style={styles.inputLabel}>Tên khách hàng</Text>
                                    <TextInput
                                        style={styles.input}
                                        value={editForm.customerName}
                                        placeholder="Nhập tên khách hàng"
                                        onChangeText={t => setEditForm(prev => ({ ...prev, customerName: t }))}
                                    />

                                    <Text style={styles.inputLabel}>Tên quầy</Text>
                                    <TextInput
                                        style={styles.input}
                                        value={editForm.counterName}
                                        placeholder="Nhập tên quầy"
                                        onChangeText={t => setEditForm(prev => ({ ...prev, counterName: t }))}
                                    />

                                    <Text style={styles.inputLabel}>Tiền hàng</Text>
                                    <TextInput
                                        style={styles.input}
                                        keyboardType="numeric"
                                        value={editForm.tienHang}
                                        onChangeText={t => setEditForm(prev => ({ ...prev, tienHang: t }))}
                                    />

                                    <Text style={styles.inputLabel}>Phí gom</Text>
                                    <TextInput
                                        style={styles.input}
                                        keyboardType="numeric"
                                        value={editForm.tienCongGom}
                                        onChangeText={t => setEditForm(prev => ({ ...prev, tienCongGom: t }))}
                                    />

                                    <Text style={styles.inputLabel}>Phí đóng hàng</Text>
                                    <TextInput
                                        style={styles.input}
                                        keyboardType="numeric"
                                        value={editForm.phiDongHang}
                                        onChangeText={t => setEditForm(prev => ({ ...prev, phiDongHang: t }))}
                                    />

                                    <Text style={styles.inputLabel}>Tiền hoa hồng</Text>
                                    <TextInput
                                        style={styles.input}
                                        keyboardType="numeric"
                                        value={editForm.tienHoaHong}
                                        onChangeText={t => setEditForm(prev => ({ ...prev, tienHoaHong: t }))}
                                    />

                                    {/* Thuế */}
                                    <View style={styles.taxSection}>
                                        <Text style={styles.taxLabel}>Thuế (%)</Text>
                                        <View style={styles.taxRow}>
                                            <View style={styles.taxInputWrap}>
                                                <TextInput
                                                    style={styles.taxInput}
                                                    placeholder="0"
                                                    placeholderTextColor="#9ca3af"
                                                    keyboardType="decimal-pad"
                                                    value={thueStr}
                                                    onChangeText={setThueStr}
                                                />
                                                <Text style={styles.taxPercent}>%</Text>
                                            </View>
                                            <TouchableOpacity
                                                style={[
                                                    styles.taxChip,
                                                    thueStr === '1.5' ? styles.taxChipActive : {}
                                                ]}
                                                onPress={() => setThueStr(thueStr === '1.5' ? '' : '1.5')}
                                            >
                                                <Text style={[
                                                    styles.taxChipText,
                                                    thueStr === '1.5' ? styles.taxChipTextActive : {}
                                                ]}>1.5%</Text>
                                            </TouchableOpacity>
                                            {tienThue > 0 && (
                                                <Text style={styles.taxAmount}>
                                                    = {tienThue.toLocaleString('vi-VN')}đ
                                                </Text>
                                            )}
                                        </View>
                                    </View>

                                    <TouchableOpacity style={styles.submitBtn} onPress={handleSaveEdit}>
                                        <Text style={styles.submitBtnText}>Lưu thay đổi</Text>
                                    </TouchableOpacity>
                                </ScrollView>
                            </View>
                        </View>
                    </TouchableWithoutFeedback>
                </KeyboardAvoidingView>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F2F2F7' },
    header: {
        paddingHorizontal: 16, paddingTop: 60, paddingBottom: 15,
        backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#E5E5EA'
    },
    title: { fontSize: 24, fontWeight: 'bold', color: '#000' },
    filterSection: { padding: 16, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#E5E5EA' },
    dateFilter: {
        flexDirection: 'row', alignItems: 'center', backgroundColor: '#F2F2F7',
        padding: 12, borderRadius: 8, marginBottom: 12
    },
    dateFilterText: { marginLeft: 8, fontSize: 15, fontWeight: '500' },
    statusFilters: { flexDirection: 'row' },
    statusBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#F2F2F7', marginRight: 8 },
    statusBtnActive: { backgroundColor: theme?.colors?.primary?.default || '#007AFF' },
    statusBtnText: { fontSize: 13, fontWeight: '500', color: '#666' },
    statusBtnTextActive: { color: '#FFF' },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    listContainer: { padding: 16, paddingBottom: 100 },
    card: {
        backgroundColor: '#FFF', borderRadius: 12, padding: 16, marginBottom: 16,
        shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 2
    },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
    orderId: { fontSize: 16, fontWeight: 'bold' },
    orderDate: { fontSize: 13, color: '#666', marginTop: 4 },
    statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, alignSelf: 'flex-start' },
    statusText: { fontSize: 12, fontWeight: 'bold' },
    cardBody: { borderTopWidth: 1, borderTopColor: '#F2F2F7', paddingTop: 12, marginBottom: 12 },
    cardBodyColumns: { flexDirection: 'row', gap: 12 },
    cardBodyLeft: { flex: 1, justifyContent: 'center' },
    cardBodyRight: { flex: 1 },
    infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6, gap: 4 },
    infoLabel: { fontSize: 12, color: '#8E8E93', fontWeight: '500' },
    infoValue: { fontSize: 13, color: '#333', fontWeight: '600', flexShrink: 1 },
    moneyRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
    moneyLabel: { fontSize: 12, color: '#8E8E93' },
    moneyValue: { fontSize: 13, color: '#333', fontWeight: '500' },
    totalRow: { borderTopWidth: 1, borderTopColor: '#E5E5EA', paddingTop: 4, marginTop: 2 },
    totalLabel: { fontSize: 13, color: '#333', fontWeight: '700' },
    row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
    label: { color: '#666', fontSize: 14 },
    value: { fontWeight: '500', fontSize: 14 },
    totalValue: { fontWeight: 'bold', fontSize: 16, color: theme?.colors?.primary?.default || '#007AFF' },
    cardActions: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
    btnDetail: { flex: 1, paddingVertical: 10, backgroundColor: '#E6F0FF', borderRadius: 8, alignItems: 'center' },
    btnDetailText: { color: theme?.colors?.primary?.default || '#007AFF', fontWeight: 'bold' },
    btnEdit: { flex: 1, paddingVertical: 10, backgroundColor: '#FFF3E0', borderRadius: 8, alignItems: 'center' },
    btnEditText: { color: '#FF9800', fontWeight: 'bold' },
    btnApprove: { flex: 1, paddingVertical: 10, backgroundColor: '#E8F5E9', borderRadius: 8, alignItems: 'center' },
    btnApproveText: { color: '#4CAF50', fontWeight: 'bold' },
    btnCancel: { flex: 1, paddingVertical: 10, backgroundColor: '#FFEBEE', borderRadius: 8, alignItems: 'center' },
    btnCancelText: { color: '#F44336', fontWeight: 'bold' },
    emptyText: { textAlign: 'center', color: '#8E8E93', marginTop: 40, fontSize: 16 },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: '#FFF', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, paddingBottom: 40, maxHeight: '90%' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    modalTitle: { fontSize: 18, fontWeight: 'bold' },
    inputLabel: { fontSize: 14, fontWeight: '500', marginBottom: 8, color: '#333' },
    input: { borderWidth: 1, borderColor: '#E5E5EA', borderRadius: 8, padding: 12, fontSize: 15, marginBottom: 16 },
    submitBtn: { backgroundColor: theme?.colors?.primary?.default || '#007AFF', borderRadius: 8, padding: 14, alignItems: 'center', marginTop: 10 },
    submitBtnText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },

    // Group styles
    groupCard: {
        backgroundColor: '#FFF',
        borderRadius: 12,
        marginBottom: 16,
        overflow: 'hidden',
        shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 2
    },
    groupHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        backgroundColor: '#F8F8F8',
    },
    groupHeaderLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    groupCustomerName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#000',
        marginLeft: 8,
        marginRight: 8,
    },
    groupCountBadge: {
        backgroundColor: theme?.colors?.primary?.light || '#EBF5FF',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 12,
    },
    groupCountText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: theme?.colors?.primary?.default || '#007AFF',
    },
    groupTotalAmount: {
        fontSize: 16,
        fontWeight: 'bold',
        color: theme?.colors?.primary?.default || '#007AFF',
    },
    groupContent: {
        padding: 16,
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: '#E5E5EA',
        backgroundColor: '#FFF',
    },

    // Tax styles
    taxSection: {
        marginBottom: 16,
    },
    taxLabel: {
        fontSize: 14,
        fontWeight: '500',
        marginBottom: 8,
        color: '#333'
    },
    taxRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    taxInputWrap: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#E5E5EA',
        borderRadius: 8,
        paddingHorizontal: 12,
        height: 44,
    },
    taxInput: {
        width: 50,
        height: 44,
        fontSize: 15,
        color: '#000',
        textAlign: 'right',
        paddingVertical: 0,
    },
    taxPercent: {
        fontSize: 15,
        color: '#9ca3af',
        fontWeight: '500',
        marginLeft: 4,
    },
    taxChip: {
        marginLeft: 12,
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
        backgroundColor: '#f3f4f6',
        borderWidth: 1,
        borderColor: '#e5e7eb',
    },
    taxChipActive: {
        backgroundColor: theme?.colors?.primary?.light || '#EBF5FF',
        borderColor: theme?.colors?.primary?.default || '#007AFF',
    },
    taxChipText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#6b7280',
    },
    taxChipTextActive: {
        color: theme?.colors?.primary?.default || '#007AFF',
    },
    taxAmount: {
        marginLeft: 12,
        fontSize: 14,
        color: theme?.colors?.primary?.default || '#007AFF',
        fontWeight: '600',
    }
});
