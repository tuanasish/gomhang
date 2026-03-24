import React, { useState, useCallback, useMemo } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
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
import { getAllCustomerDailyFeesAPI } from '../../api/customers';

export default function AdminCustomersScreen({ navigation }) {
    const { userInfo } = useAuth();
    const isAdmin = userInfo?.role === 'admin' || userInfo?.role === 'manager';
    // Filter states
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);

    // Formatted date string for queries
    const dateStr = getLocalDateString(selectedDate);

    // Queries
    const {
        data: customersData = [],
        isLoading: isCustomersLoading,
        isRefetching: isCustomersRefetching,
        refetch: refetchCustomers
    } = useCustomersList(); // No filters for now, fetch all

    const {
        data: ordersData = [],
        isRefetching: isOrdersRefetching,
        refetch: refetchOrders
    } = useOrdersByDate(dateStr);

    // Invoice status tracking
    const [invoicedCustomerIds, setInvoicedCustomerIds] = useState({});

    const fetchInvoiceStatus = useCallback(async () => {
        try {
            const feesRes = await getAllCustomerDailyFeesAPI(dateStr);
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
    }, [dateStr]);

    // Fetch invoice statuses when screen gains focus or date changes
    useFocusEffect(
        useCallback(() => {
            fetchInvoiceStatus();
        }, [fetchInvoiceStatus])
    );

    // Use derived state
    const customers = useMemo(() => {
        if (!customersData) return [];
        if (customersData.success && Array.isArray(customersData.data)) return customersData.data;
        if (Array.isArray(customersData)) return customersData;
        return [];
    }, [customersData]);

    const orders = useMemo(() => {
        if (!ordersData) return [];
        if (ordersData.success && Array.isArray(ordersData.data)) return ordersData.data;
        if (Array.isArray(ordersData)) return ordersData;
        return [];
    }, [ordersData]);

    // Mutations
    const createCustomerMutation = useCreateCustomer();
    const updateCustomerMutation = useUpdateCustomer();
    const deleteCustomerMutation = useDeleteCustomer();

    const [modalVisible, setModalVisible] = useState(false);
    const [editingCustomer, setEditingCustomer] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        defaultTax: '',
        defaultTienCongGom: ''
    });

    const handleRefresh = useCallback(() => {
        refetchCustomers();
        refetchOrders();
        fetchInvoiceStatus();
    }, [refetchCustomers, refetchOrders, fetchInvoiceStatus]);

    const handleDateChange = (event, selected) => {
        setShowDatePicker(Platform.OS === 'ios');
        if (selected) {
            setSelectedDate(selected);
        }
    };

    const getCustomerStats = (customerId) => {
        // Filter orders for this customer
        const customerOrders = orders.filter(order => order.customerId === customerId);
        const totalAmount = customerOrders.reduce((sum, order) => sum + (order.tongTienHoaDon || 0), 0);
        return {
            count: customerOrders.length,
            totalAmount
        };
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

    const handleDelete = (id) => {
        Alert.alert(
            'Xác nhận xóa',
            'Bạn có chắc chắn muốn xóa khách hàng này?',
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
                name: customer.name,
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

    const renderDateSelector = () => (
        <View style={styles.dateSelectorContainer}>
            <Text style={styles.dateLabel}>Chọn ngày xem hóa đơn:</Text>
            <TouchableOpacity
                style={styles.dateButton}
                onPress={() => setShowDatePicker(true)}
            >
                <Ionicons name="calendar-outline" size={20} color={theme?.colors?.text?.secondary || '#666'} />
                <Text style={styles.dateText}>{formatDate(selectedDate)}</Text>
            </TouchableOpacity>

            {showDatePicker && (
                <DateTimePicker
                    value={selectedDate}
                    mode="date"
                    display="default"
                    onChange={handleDateChange}
                />
            )}
        </View>
    );

    const renderCustomerCard = ({ item }) => {
        const stats = getCustomerStats(item.id);

        return (
            <TouchableOpacity
                style={styles.card}
                onPress={() => {
                    // Navigate to customer detail
                    navigation.navigate('CustomerDetail', { customerId: item.id });
                }}
            >
                <View style={styles.cardHeader}>
                    <View style={styles.customerInfo}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                            <Text style={styles.customerName}>{item.name}</Text>
                            {invoicedCustomerIds[item.id] && (
                                <View style={{ backgroundColor: '#10B981', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12 }}>
                                    <Text style={{ color: '#fff', fontSize: 11, fontWeight: 'bold' }}>✓ Đã xuất bill</Text>
                                </View>
                            )}
                        </View>
                        {(item.phone || item.address) && (
                            <Text style={styles.customerContact}>
                                {item.phone ? `${item.phone} ` : ''}
                                {item.phone && item.address ? '| ' : ''}
                                {item.address ? `Thuế mặc định: ${item.address}%` : ''}
                            </Text>
                        )}
                    </View>
                    {isAdmin && (
                        <View style={styles.actionRowContainer}>
                            <TouchableOpacity style={styles.actionBtn} onPress={() => openModal(item)}>
                                <Ionicons name="create-outline" size={22} color={theme?.colors?.primary?.default || '#007AFF'} />
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.actionBtn} onPress={() => handleDelete(item.id)}>
                                <Ionicons name="trash-outline" size={22} color="#FF3B30" />
                            </TouchableOpacity>
                        </View>
                    )}
                </View>

                <View style={styles.statsContainer}>
                    <Text style={styles.statsTitle}>Hóa đơn ngày {formatDate(selectedDate)}:</Text>
                    <View style={styles.statsRow}>
                        <Text style={styles.statLabel}>Số lượng đơn:</Text>
                        <Text style={styles.statValue}>{stats.count}</Text>
                    </View>
                    <View style={styles.statsRow}>
                        <Text style={styles.statLabel}>Tổng tiền:</Text>
                        <Text style={[styles.statValue, { color: theme?.colors?.primary?.default || '#007AFF', fontWeight: 'bold' }]}>
                            {formatCurrency(stats.totalAmount)}
                        </Text>
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    const isAnyRefetching = isCustomersRefetching || isOrdersRefetching;
    const isMutationPending = createCustomerMutation.isPending || updateCustomerMutation.isPending;

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Quản lý Khách hàng</Text>
                {isAdmin && (
                    <TouchableOpacity
                        style={styles.addButton}
                        onPress={() => openModal()}
                    >
                        <Ionicons name="add" size={24} color="#FFF" />
                    </TouchableOpacity>
                )}
            </View>

            {renderDateSelector()}

            {isCustomersLoading && !isAnyRefetching && customers.length === 0 ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={theme?.colors?.primary?.default || '#007AFF'} />
                    <Text style={styles.loadingText}>Đang tải dữ liệu...</Text>
                </View>
            ) : (
                <FlatList
                    data={customers}
                    keyExtractor={(item) => item.id}
                    renderItem={renderCustomerCard}
                    contentContainerStyle={styles.listContainer}
                    ListEmptyComponent={
                        <Text style={styles.emptyText}>Chưa có khách hàng nào</Text>
                    }
                    refreshControl={
                        <RefreshControl
                            refreshing={isAnyRefetching}
                            onRefresh={handleRefresh}
                            colors={[theme?.colors?.primary?.default || '#007AFF']}
                        />
                    }
                />
            )}

            {/* Modal Thêm/Sửa */}
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
                                            {editingCustomer ? 'Sửa thông tin' : 'Thêm khách hàng mới'}
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
                                            placeholderTextColor={theme.colors.text.hint}
                                        />
                                    </View>

                                    <View style={styles.formGroup}>
                                        <Text style={styles.label}>Số điện thoại</Text>
                                        <TextInput
                                            style={styles.input}
                                            value={formData.phone}
                                            onChangeText={(text) => setFormData({ ...formData, phone: text })}
                                            placeholder="Nhập số điện thoại"
                                            placeholderTextColor={theme.colors.text.hint}
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
                                            placeholderTextColor={theme.colors.text.hint}
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
                                            placeholderTextColor={theme.colors.text.hint}
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
        backgroundColor: '#F2F2F7',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingTop: 60,
        paddingBottom: 15,
        backgroundColor: '#FFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E5EA',
    },
    title: {
        fontSize: theme?.typography?.sizes?.xl || 22,
        fontWeight: 'bold',
        color: '#000',
    },
    addButton: {
        backgroundColor: theme?.colors?.primary?.default || '#007AFF',
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
    },
    dateSelectorContainer: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#FFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E5EA',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    dateLabel: {
        fontSize: 14,
        color: '#333',
        fontWeight: '500',
    },
    dateButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F2F2F7',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
    },
    dateText: {
        marginLeft: 6,
        fontSize: 14,
        color: '#333',
        fontWeight: '500',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 10,
        color: '#666',
    },
    listContainer: {
        padding: 16,
        paddingBottom: 100, // For flatlist bottom padding
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
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        borderBottomWidth: 1,
        borderBottomColor: '#F2F2F7',
        paddingBottom: 12,
        marginBottom: 12,
    },
    customerInfo: {
        flex: 1,
    },
    customerName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#000',
        marginBottom: 4,
    },
    customerContact: {
        fontSize: 13,
        color: '#666',
    },
    actionRowContainer: {
        flexDirection: 'row',
    },
    actionBtn: {
        padding: 8,
        marginLeft: 4,
    },
    statsContainer: {
        backgroundColor: '#F9F9F9',
        borderRadius: 8,
        padding: 12,
    },
    statsTitle: {
        fontSize: 13,
        fontWeight: '500',
        color: '#333',
        marginBottom: 8,
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 4,
    },
    statLabel: {
        fontSize: 13,
        color: '#666',
    },
    statValue: {
        fontSize: 13,
        color: '#000',
        fontWeight: '500',
    },
    emptyText: {
        textAlign: 'center',
        color: '#8E8E93',
        marginTop: 40,
        fontSize: 16,
    },
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
        color: '#000',
    },
    formGroup: {
        marginBottom: 16,
    },
    label: {
        fontSize: 14,
        fontWeight: '500',
        color: '#333',
        marginBottom: 8,
    },
    input: {
        borderWidth: 1,
        borderColor: '#E5E5EA',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 10,
        fontSize: 15,
        backgroundColor: '#FFF',
    },
    helpText: {
        fontSize: 12,
        color: '#8E8E93',
        marginTop: 4,
    },
    submitButton: {
        backgroundColor: theme?.colors?.primary?.default || '#007AFF',
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
