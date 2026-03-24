import React, { useState, useCallback, useMemo } from 'react';
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
    useShiftsList,
    useEndShift,
    useCreateShift,
    useAddMoneyToShift,
    useShiftMoneyAdditions,
    useUpdateShiftMoneyAddition,
    useDeleteShiftMoneyAddition
} from '../../hooks/queries/useShifts';
import { useStaffList } from '../../hooks/queries/useStaff';

// Format helpers for money input
const formatMoneyInput = (value) => {
    const digitsOnly = value.replace(/\D/g, '');
    if (!digitsOnly) return '';
    return digitsOnly.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
};
const parseMoneyValue = (value) => {
    const normalized = value.replace(/\./g, '');
    return normalized ? Number(normalized) : 0;
};

export default function AdminShiftsScreen({ navigation }) {
    // Filter states
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'active', 'ended'

    // Formatted date string for queries
    const dateStr = getLocalDateString(selectedDate);
    const statusQuery = statusFilter !== 'all' ? statusFilter : undefined;

    // Queries
    const {
        data: shiftsData = [],
        isLoading: isShiftsLoading,
        isRefetching: isShiftsRefetching,
        refetch: refetchShifts
    } = useShiftsList({
        date: dateStr,
        ...(statusQuery ? { status: statusQuery } : {})
    });

    const {
        data: staffList = [],
        refetch: refetchStaff
    } = useStaffList();

    // Use derived state for flatlists
    const shifts = useMemo(() => {
        if (!shiftsData) return [];
        if (shiftsData.success && Array.isArray(shiftsData.data)) return shiftsData.data;
        if (Array.isArray(shiftsData)) return shiftsData;
        return [];
    }, [shiftsData]);

    const staffArray = useMemo(() => {
        if (!staffList) return [];
        if (staffList.success && Array.isArray(staffList.data)) return staffList.data;
        if (Array.isArray(staffList)) return staffList;
        return [];
    }, [staffList]);

    // Mutations
    const endShiftMutation = useEndShift();
    const createShiftMutation = useCreateShift();
    const addMoneyMutation = useAddMoneyToShift();
    const updateAdditionMutation = useUpdateShiftMoneyAddition();
    const deleteAdditionMutation = useDeleteShiftMoneyAddition();

    // Detail modal
    const [detailShift, setDetailShift] = useState(null);
    const [editingAddition, setEditingAddition] = useState(null);
    const [editAmount, setEditAmount] = useState('');
    const [editNote, setEditNote] = useState('');

    // Modal Edit Money (Add Money)
    const [moneyModalVisible, setMoneyModalVisible] = useState(false);
    const [moneyAmount, setMoneyAmount] = useState('');
    const [moneyNote, setMoneyNote] = useState('');
    const [selectedShiftForMoney, setSelectedShiftForMoney] = useState(null);

    // Dynamic History Query based on which shift is selected (detail or money modal)
    const activeShiftIdForHistory = detailShift?.id || selectedShiftForMoney?.id || null;
    const {
        data: moneyAdditionsData = [],
        isLoading: loadingHistory,
        refetch: refetchHistory
    } = useShiftMoneyAdditions(activeShiftIdForHistory, {
        enabled: !!activeShiftIdForHistory
    });

    const moneyAdditions = useMemo(() => {
        if (!moneyAdditionsData) return [];
        if (moneyAdditionsData.success && Array.isArray(moneyAdditionsData.data)) return moneyAdditionsData.data;
        if (Array.isArray(moneyAdditionsData)) return moneyAdditionsData;
        return [];
    }, [moneyAdditionsData]);

    // Modal Create Shift
    const [createModalVisible, setCreateModalVisible] = useState(false);
    const [selectedStaff, setSelectedStaff] = useState(null);
    const [newShiftDate, setNewShiftDate] = useState(new Date());
    const [newShiftMoney, setNewShiftMoney] = useState('');
    const [showStaffPicker, setShowStaffPicker] = useState(false);

    const handleRefresh = useCallback(() => {
        refetchShifts();
        refetchStaff();
        if (activeShiftIdForHistory) {
            refetchHistory();
        }
    }, [refetchShifts, refetchStaff, refetchHistory, activeShiftIdForHistory]);

    const handleDateChange = (event, selected) => {
        setShowDatePicker(Platform.OS === 'ios');
        if (selected) {
            setSelectedDate(selected);
        }
    };

    const handleEndShift = (shift) => {
        Alert.alert(
            'Kết thúc ca làm việc',
            `Bạn có chắc chắn muốn kết thúc ca của ${shift.staffName || 'nhân viên này'}?`,
            [
                { text: 'Hủy', style: 'cancel' },
                {
                    text: 'Xác nhận',
                    style: 'destructive',
                    onPress: () => {
                        endShiftMutation.mutate(shift.id, {
                            onSuccess: () => Alert.alert('Thành công', `Đã kết thúc ca của ${shift.staffName || 'nhân viên'}`)
                        });
                    }
                }
            ]
        );
    };

    const openMoneyModal = (shift) => {
        setSelectedShiftForMoney(shift);
        setMoneyAmount('');
        setMoneyNote('');
        setEditingAddition(null);
        setMoneyModalVisible(true);
    };

    const closeMoneyModal = () => {
        setMoneyModalVisible(false);
        setSelectedShiftForMoney(null);
    };

    const handleUpdateMoney = () => {
        const amount = parseMoneyValue(moneyAmount);
        if (!moneyAmount || !amount || isNaN(amount)) {
            showValidationError('Vui lòng nhập số tiền hợp lệ');
            return;
        }

        addMoneyMutation.mutate(
            { shiftId: selectedShiftForMoney.id, amount, note: moneyNote || null },
            {
                onSuccess: () => {
                    Alert.alert('Thành công', `Đã cộng thêm ${formatCurrency(amount)} vào ca của ${selectedShiftForMoney.staffName || 'nhân viên'}`);
                    closeMoneyModal();
                }
            }
        );
    };

    const openDetailShift = (item) => {
        setDetailShift(item);
        setEditingAddition(null);
    };

    const handleEditAddition = (additionId) => {
        const amount = parseMoneyValue(editAmount);
        if (!amount || isNaN(amount)) {
            showValidationError('Vui lòng nhập số tiền hợp lệ');
            return;
        }

        const shiftId = activeShiftIdForHistory; // Can be detailShift or selectedShiftForMoney
        if (!shiftId) return;

        updateAdditionMutation.mutate(
            { shiftId, additionId, data: { amount, note: editNote || null } },
            {
                onSuccess: () => {
                    Alert.alert('Thành công', 'Đã cập nhật lịch sử thêm tiền');
                    setEditingAddition(null);
                }
            }
        );
    };

    const handleDeleteAddition = (additionId) => {
        const shiftId = activeShiftIdForHistory;
        if (!shiftId) return;

        Alert.alert(
            'Xác nhận xóa',
            'Bạn có chắc chắn muốn xóa lần thêm tiền này?',
            [
                { text: 'Hủy', style: 'cancel' },
                {
                    text: 'Xóa', style: 'destructive', onPress: () => {
                        deleteAdditionMutation.mutate({ shiftId, additionId });
                    }
                }
            ]
        );
    };

    const handleCreateShift = () => {
        if (!selectedStaff) {
            showValidationError('Vui lòng chọn nhân viên');
            return;
        }
        const tienGiaoCaValue = parseMoneyValue(newShiftMoney);
        if (newShiftMoney && isNaN(tienGiaoCaValue)) {
            showValidationError('Vui lòng nhập số tiền hợp lệ');
            return;
        }

        const payload = {
            staffId: selectedStaff.id,
            date: getLocalDateString(newShiftDate),
            tienGiaoCa: tienGiaoCaValue || 0
        };

        createShiftMutation.mutate(payload, {
            onSuccess: () => {
                Alert.alert('Thành công', 'Đã tạo ca làm việc mới');
                setCreateModalVisible(false);
                setSelectedStaff(null);
                setNewShiftMoney('');
            }
        });
    };

    const formatTimeOnly = (dateString) => {
        if (!dateString) return '...';
        const d = new Date(dateString);
        return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
    };

    const renderShiftCard = ({ item }) => {
        const isActive = item.status === 'active';

        return (
            <View style={styles.card}>
                <View style={styles.cardHeader}>
                    <View>
                        <Text style={styles.staffName}>{item.staffName}</Text>
                        <Text style={styles.shiftTime}>
                            {formatDate(item.date)} • {formatTimeOnly(item.startTime)} - {isActive ? 'Đang làm' : formatTimeOnly(item.endTime)}
                        </Text>
                    </View>
                    <View style={[styles.statusBadge, isActive ? styles.statusBadgeActive : styles.statusBadgeEnded]}>
                        <Text style={[styles.statusText, isActive ? styles.statusTextActive : styles.statusTextEnded]}>
                            {isActive ? 'Đang làm' : 'Đã kết thúc'}
                        </Text>
                    </View>
                </View>

                <View style={styles.statsGrid}>
                    <View style={styles.statItem}>
                        <Text style={styles.statLabel}>Tiền giao ca</Text>
                        <Text style={styles.statValue}>{formatCurrency(item.tienGiaoCa)}</Text>
                    </View>
                    <View style={styles.statItem}>
                        <Text style={styles.statLabel}>Quỹ còn lại</Text>
                        <Text style={[styles.statValue, { color: theme?.colors?.primary?.default || '#007AFF' }]}>
                            {formatCurrency(item.quyConLai)}
                        </Text>
                    </View>
                    <View style={styles.statItem}>
                        <Text style={styles.statLabel}>Đã trả hàng</Text>
                        <Text style={styles.statValue}>{formatCurrency(item.tongTienHangDaTra)}</Text>
                    </View>
                    <View style={styles.statItem}>
                        <Text style={styles.statLabel}>Số đơn</Text>
                        <Text style={styles.statValue}>{item.soDonHang}</Text>
                    </View>
                </View>

                <View style={styles.cardActions}>
                    {isActive && (
                        <>
                            <TouchableOpacity
                                style={[styles.actionBtn, styles.actionBtnEnd]}
                                onPress={() => handleEndShift(item)}
                            >
                                {endShiftMutation.isPending && endShiftMutation.variables === item.id ? (
                                    <ActivityIndicator size="small" color="#F44336" />
                                ) : (
                                    <Text style={styles.actionBtnTextEnd}>Kết thúc</Text>
                                )}
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.actionBtn, styles.actionBtnPrimary]}
                                onPress={() => openMoneyModal(item)}
                            >
                                <Text style={styles.actionBtnTextPrimary}>Sửa tiền</Text>
                            </TouchableOpacity>
                        </>
                    )}
                    <TouchableOpacity
                        style={[styles.actionBtn, styles.actionBtnPrimary]}
                        onPress={() => openDetailShift(item)}
                    >
                        <Text style={styles.actionBtnTextPrimary}>Chi tiết</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    };

    const renderFilterBar = () => (
        <View style={styles.filterContainer}>
            <TouchableOpacity
                style={styles.dateFilterBtn}
                onPress={() => setShowDatePicker(true)}
            >
                <Ionicons name="calendar-outline" size={18} color="#333" />
                <Text style={styles.dateFilterText}>{formatDate(selectedDate)}</Text>
            </TouchableOpacity>

            <View style={styles.statusFilters}>
                <TouchableOpacity
                    style={[styles.statusFilterBtn, statusFilter === 'all' && styles.statusFilterBtnActive]}
                    onPress={() => setStatusFilter('all')}
                >
                    <Text style={[styles.statusFilterText, statusFilter === 'all' && styles.statusFilterTextActive]}>Tất cả</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.statusFilterBtn, statusFilter === 'active' && styles.statusFilterBtnActive]}
                    onPress={() => setStatusFilter('active')}
                >
                    <Text style={[styles.statusFilterText, statusFilter === 'active' && styles.statusFilterTextActive]}>Đang làm</Text>
                </TouchableOpacity>
            </View>

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

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Quản lý Ca làm việc</Text>
                <TouchableOpacity
                    style={styles.addButton}
                    onPress={() => {
                        setNewShiftDate(new Date());
                        setSelectedStaff(null);
                        setNewShiftMoney('');
                        setCreateModalVisible(true);
                    }}
                >
                    <Ionicons name="add" size={24} color="#FFF" />
                </TouchableOpacity>
            </View>

            {renderFilterBar()}

            {isShiftsLoading && !isShiftsRefetching && shifts.length === 0 ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={theme?.colors?.primary?.default || '#007AFF'} />
                    <Text style={styles.loadingText}>Đang tải dữ liệu...</Text>
                </View>
            ) : (
                <FlatList
                    data={shifts}
                    keyExtractor={(item) => item.id}
                    renderItem={renderShiftCard}
                    contentContainerStyle={styles.listContainer}
                    ListEmptyComponent={
                        <Text style={styles.emptyText}>Không có ca làm việc nào phù hợp</Text>
                    }
                    refreshControl={
                        <RefreshControl
                            refreshing={isShiftsRefetching}
                            onRefresh={handleRefresh}
                            colors={[theme?.colors?.primary?.default || '#007AFF']}
                        />
                    }
                />
            )}

            {/* Modal Chi Tiết Ca */}
            <Modal
                visible={!!detailShift}
                transparent={true}
                animationType="fade"
            >
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={{ flex: 1 }}
                >
                    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                        <View style={styles.modalOverlay}>
                            <TouchableWithoutFeedback>
                                <View style={[styles.modalContent, { maxHeight: '80%' }]}>
                                    <View style={styles.modalHeader}>
                                        <Text style={styles.modalTitle}>Chi tiết ca - {detailShift?.staffName}</Text>
                                        <TouchableOpacity onPress={() => { setDetailShift(null); setEditingAddition(null); }}>
                                            <Ionicons name="close" size={24} color="#333" />
                                        </TouchableOpacity>
                                    </View>

                                    <ScrollView showsVerticalScrollIndicator={false}>
                                        {detailShift && (
                                            <View>
                                                <View style={styles.detailRow}>
                                                    <Text style={styles.detailLabel}>Ngày:</Text>
                                                    <Text style={styles.detailValue}>{formatDate(detailShift.date)}</Text>
                                                </View>
                                                <View style={styles.detailRow}>
                                                    <Text style={styles.detailLabel}>Bắt đầu:</Text>
                                                    <Text style={styles.detailValue}>{formatTimeOnly(detailShift.startTime)}</Text>
                                                </View>
                                                <View style={styles.detailRow}>
                                                    <Text style={styles.detailLabel}>Kết thúc:</Text>
                                                    <Text style={styles.detailValue}>
                                                        {detailShift.status === 'active' ? 'Đang làm' : formatTimeOnly(detailShift.endTime)}
                                                    </Text>
                                                </View>
                                                <View style={{ height: 1, backgroundColor: '#E5E5EA', marginVertical: 12 }} />
                                                <View style={styles.detailRow}>
                                                    <Text style={styles.detailLabel}>Tiền giao ca:</Text>
                                                    <Text style={[styles.detailValue, { fontWeight: 'bold' }]}>{formatCurrency(detailShift.tienGiaoCa)}</Text>
                                                </View>
                                                <View style={styles.detailRow}>
                                                    <Text style={styles.detailLabel}>Quỹ còn lại:</Text>
                                                    <Text style={[styles.detailValue, { fontWeight: 'bold', color: theme?.colors?.primary?.default || '#007AFF' }]}>
                                                        {formatCurrency(detailShift.quyConLai)}
                                                    </Text>
                                                </View>
                                                <View style={styles.detailRow}>
                                                    <Text style={styles.detailLabel}>Đã trả hàng:</Text>
                                                    <Text style={[styles.detailValue, { fontWeight: 'bold' }]}>{formatCurrency(detailShift.tongTienHangDaTra)}</Text>
                                                </View>
                                                <View style={styles.detailRow}>
                                                    <Text style={styles.detailLabel}>Số đơn:</Text>
                                                    <Text style={[styles.detailValue, { fontWeight: 'bold' }]}>{detailShift.soDonHang}</Text>
                                                </View>

                                                {/* Lịch sử thêm tiền (in Detail Shift) */}
                                                <View style={{ height: 1, backgroundColor: '#E5E5EA', marginVertical: 16 }} />
                                                <Text style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 12, color: '#333' }}>
                                                    Lịch sử sửa tiền giao ca
                                                </Text>
                                                {loadingHistory ? (
                                                    <ActivityIndicator size="small" color={theme?.colors?.primary?.default || '#007AFF'} />
                                                ) : moneyAdditions.length === 0 ? (
                                                    <Text style={{ color: '#999', fontStyle: 'italic', textAlign: 'center', paddingVertical: 12 }}>Chưa có lịch sử</Text>
                                                ) : (
                                                    moneyAdditions.map((addition) => (
                                                        <View key={addition.id} style={{
                                                            backgroundColor: '#F8F9FA',
                                                            borderRadius: 8,
                                                            padding: 12,
                                                            marginBottom: 8,
                                                            borderWidth: 1,
                                                            borderColor: '#E5E5EA'
                                                        }}>
                                                            {editingAddition === addition.id ? (
                                                                <View>
                                                                    <View style={{ marginBottom: 8 }}>
                                                                        <Text style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>Số tiền (VNĐ)</Text>
                                                                        <TextInput
                                                                            style={{
                                                                                backgroundColor: '#FFF',
                                                                                borderWidth: 1,
                                                                                borderColor: '#DDD',
                                                                                borderRadius: 6,
                                                                                padding: 8,
                                                                                fontSize: 14
                                                                            }}
                                                                            value={editAmount}
                                                                            onChangeText={(t) => setEditAmount(formatMoneyInput(t))}
                                                                            keyboardType="numeric"
                                                                            placeholder="VD: 1.000.000"
                                                                        />
                                                                    </View>
                                                                    <View style={{ marginBottom: 8 }}>
                                                                        <Text style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>Ghi chú</Text>
                                                                        <TextInput
                                                                            style={{
                                                                                backgroundColor: '#FFF',
                                                                                borderWidth: 1,
                                                                                borderColor: '#DDD',
                                                                                borderRadius: 6,
                                                                                padding: 8,
                                                                                fontSize: 14
                                                                            }}
                                                                            value={editNote}
                                                                            onChangeText={setEditNote}
                                                                            placeholder="Nhập ghi chú"
                                                                        />
                                                                    </View>
                                                                    <View style={{ flexDirection: 'row', gap: 8 }}>
                                                                        <TouchableOpacity
                                                                            style={{ flex: 1, backgroundColor: theme?.colors?.primary?.default || '#007AFF', borderRadius: 6, padding: 8, alignItems: 'center' }}
                                                                            onPress={() => handleEditAddition(addition.id)}
                                                                            disabled={updateAdditionMutation.isPending}
                                                                        >
                                                                            {updateAdditionMutation.isPending && updateAdditionMutation.variables?.additionId === addition.id ? (
                                                                                <ActivityIndicator size="small" color="#FFF" />
                                                                            ) : (
                                                                                <Text style={{ color: '#FFF', fontWeight: '600' }}>Lưu</Text>
                                                                            )}
                                                                        </TouchableOpacity>
                                                                        <TouchableOpacity
                                                                            style={{ flex: 1, backgroundColor: '#EEE', borderRadius: 6, padding: 8, alignItems: 'center' }}
                                                                            onPress={() => setEditingAddition(null)}
                                                                        >
                                                                            <Text style={{ color: '#333', fontWeight: '600' }}>Hủy</Text>
                                                                        </TouchableOpacity>
                                                                    </View>
                                                                </View>
                                                            ) : (
                                                                <View>
                                                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                                                        <Text style={{ fontSize: 15, fontWeight: 'bold', color: '#333' }}>+{formatCurrency(addition.amount)}</Text>
                                                                        <View style={{ flexDirection: 'row', gap: 8 }}>
                                                                            <TouchableOpacity
                                                                                onPress={() => {
                                                                                    setEditingAddition(addition.id);
                                                                                    setEditAmount(formatMoneyInput(String(addition.amount)));
                                                                                    setEditNote(addition.note || '');
                                                                                }}
                                                                            >
                                                                                <Ionicons name="pencil" size={18} color={theme?.colors?.primary?.default || '#007AFF'} />
                                                                            </TouchableOpacity>
                                                                            <TouchableOpacity
                                                                                onPress={() => handleDeleteAddition(addition.id)}
                                                                                disabled={deleteAdditionMutation.isPending}
                                                                            >
                                                                                {deleteAdditionMutation.isPending && deleteAdditionMutation.variables?.additionId === addition.id ? (
                                                                                    <ActivityIndicator size="small" color="#F44336" />
                                                                                ) : (
                                                                                    <Ionicons name="trash" size={18} color="#F44336" />
                                                                                )}
                                                                            </TouchableOpacity>
                                                                        </View>
                                                                    </View>
                                                                    {addition.note && (
                                                                        <Text style={{ fontSize: 13, color: '#666', marginTop: 4 }}>{addition.note}</Text>
                                                                    )}
                                                                    <Text style={{ fontSize: 11, color: '#999', marginTop: 4 }}>
                                                                        {new Date(addition.createdAt).toLocaleString('vi-VN')}
                                                                    </Text>
                                                                </View>
                                                            )}
                                                        </View>
                                                    ))
                                                )}
                                            </View>
                                        )}
                                    </ScrollView>

                                    <TouchableOpacity
                                        style={[styles.submitButton, { marginTop: 16 }]}
                                        onPress={() => { setDetailShift(null); setEditingAddition(null); }}
                                    >
                                        <Text style={styles.submitButtonText}>Đóng</Text>
                                    </TouchableOpacity>
                                </View>
                            </TouchableWithoutFeedback>
                        </View>
                    </TouchableWithoutFeedback>
                </KeyboardAvoidingView>
            </Modal>

            {/* Modal Sửa Tiền Giao Ca (Add Money) */}
            <Modal
                visible={moneyModalVisible}
                transparent={true}
                animationType="slide"
            >
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={{ flex: 1 }}
                >
                    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                        <View style={styles.modalOverlay}>
                            <TouchableWithoutFeedback>
                                <View style={[styles.modalContent, { maxHeight: '85%' }]}>
                                    <View style={styles.modalHeader}>
                                        <Text style={styles.modalTitle}>Sửa tiền giao ca</Text>
                                        <TouchableOpacity onPress={closeMoneyModal}>
                                            <Ionicons name="close" size={24} color="#333" />
                                        </TouchableOpacity>
                                    </View>

                                    <ScrollView showsVerticalScrollIndicator={false}>
                                        {selectedShiftForMoney && (
                                            <Text style={styles.modalSubtitle}>
                                                Nhân viên: <Text style={{ fontWeight: 'bold' }}>{selectedShiftForMoney.staffName}</Text>
                                            </Text>
                                        )}

                                        <View style={styles.formGroup}>
                                            <Text style={styles.label}>Số tiền cần thêm (VNĐ) *</Text>
                                            <TextInput
                                                style={styles.input}
                                                value={moneyAmount}
                                                onChangeText={(t) => setMoneyAmount(formatMoneyInput(t))}
                                                placeholder="VD: 100.000"
                                                placeholderTextColor={theme.colors.text.hint}
                                                keyboardType="numeric"
                                            />
                                        </View>

                                        <View style={styles.formGroup}>
                                            <Text style={styles.label}>Ghi chú</Text>
                                            <TextInput
                                                style={[styles.input, { height: 80 }]}
                                                value={moneyNote}
                                                onChangeText={setMoneyNote}
                                                placeholder="Nhập lý do thêm tiền (không bắt buộc)"
                                                placeholderTextColor={theme.colors.text.hint}
                                                multiline
                                                textAlignVertical="top"
                                            />
                                        </View>

                                        <TouchableOpacity
                                            style={styles.submitButton}
                                            onPress={handleUpdateMoney}
                                            disabled={addMoneyMutation.isPending}
                                        >
                                            {addMoneyMutation.isPending ? (
                                                <ActivityIndicator color="#FFF" />
                                            ) : (
                                                <Text style={styles.submitButtonText}>Xác nhận thêm tiền</Text>
                                            )}
                                        </TouchableOpacity>

                                        {/* Lịch sử thêm tiền (in Add Money context) */}
                                        <View style={{ height: 1, backgroundColor: '#E5E5EA', marginVertical: 16 }} />
                                        <Text style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 12, color: '#333' }}>
                                            Lịch sử thêm tiền
                                        </Text>

                                        {loadingHistory ? (
                                            <ActivityIndicator size="small" color={theme?.colors?.primary?.default || '#007AFF'} />
                                        ) : moneyAdditions.length === 0 ? (
                                            <Text style={{ color: '#999', fontStyle: 'italic', textAlign: 'center', paddingVertical: 12 }}>Chưa có lịch sử thêm tiền</Text>
                                        ) : (
                                            <View style={{ gap: 8 }}>
                                                {moneyAdditions.map((addition) => (
                                                    <View key={addition.id} style={{
                                                        backgroundColor: '#F8F9FA',
                                                        borderRadius: 8,
                                                        padding: 12,
                                                        borderWidth: 1,
                                                        borderColor: '#E5E5EA'
                                                    }}>
                                                        {editingAddition === addition.id ? (
                                                            <View>
                                                                <TextInput
                                                                    style={[styles.input, { marginBottom: 8 }]}
                                                                    value={editAmount}
                                                                    onChangeText={(t) => setEditAmount(formatMoneyInput(t))}
                                                                    placeholder="Số tiền"
                                                                    keyboardType="numeric"
                                                                />
                                                                <TextInput
                                                                    style={[styles.input, { marginBottom: 8, height: 60 }]}
                                                                    value={editNote}
                                                                    onChangeText={setEditNote}
                                                                    placeholder="Ghi chú"
                                                                    multiline
                                                                />
                                                                <View style={{ flexDirection: 'row', gap: 8 }}>
                                                                    <TouchableOpacity
                                                                        style={{ flex: 1, backgroundColor: theme?.colors?.primary?.default || '#007AFF', padding: 8, borderRadius: 6, alignItems: 'center', justifyContent: 'center' }}
                                                                        onPress={() => handleEditAddition(addition.id)}
                                                                        disabled={updateAdditionMutation.isPending}
                                                                    >
                                                                        {updateAdditionMutation.isPending && updateAdditionMutation.variables?.additionId === addition.id ? (
                                                                            <ActivityIndicator size="small" color="#FFF" />
                                                                        ) : (
                                                                            <Text style={{ color: '#FFF', fontWeight: 'bold' }}>Lưu</Text>
                                                                        )}
                                                                    </TouchableOpacity>
                                                                    <TouchableOpacity
                                                                        style={{ flex: 1, backgroundColor: '#E5E5EA', padding: 8, borderRadius: 6, alignItems: 'center' }}
                                                                        onPress={() => setEditingAddition(null)}
                                                                    >
                                                                        <Text style={{ color: '#333', fontWeight: 'bold' }}>Hủy</Text>
                                                                    </TouchableOpacity>
                                                                </View>
                                                            </View>
                                                        ) : (
                                                            <View>
                                                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                                                    <Text style={{ fontSize: 15, fontWeight: 'bold', color: '#333' }}>+{formatCurrency(addition.amount)}</Text>
                                                                    <View style={{ flexDirection: 'row', gap: 8 }}>
                                                                        <TouchableOpacity
                                                                            onPress={() => {
                                                                                setEditingAddition(addition.id);
                                                                                setEditAmount(formatMoneyInput(String(addition.amount)));
                                                                                setEditNote(addition.note || '');
                                                                            }}
                                                                        >
                                                                            <Ionicons name="pencil" size={18} color={theme?.colors?.primary?.default || '#007AFF'} />
                                                                        </TouchableOpacity>
                                                                        <TouchableOpacity
                                                                            onPress={() => handleDeleteAddition(addition.id)}
                                                                            disabled={deleteAdditionMutation.isPending}
                                                                        >
                                                                            {deleteAdditionMutation.isPending && deleteAdditionMutation.variables?.additionId === addition.id ? (
                                                                                <ActivityIndicator size="small" color="#F44336" />
                                                                            ) : (
                                                                                <Ionicons name="trash" size={18} color="#F44336" />
                                                                            )}
                                                                        </TouchableOpacity>
                                                                    </View>
                                                                </View>
                                                                {addition.note && (
                                                                    <Text style={{ fontSize: 13, color: '#666', marginTop: 4 }}>{addition.note}</Text>
                                                                )}
                                                                <Text style={{ fontSize: 11, color: '#999', marginTop: 4 }}>
                                                                    {new Date(addition.createdAt).toLocaleString('vi-VN')}
                                                                </Text>
                                                            </View>
                                                        )}
                                                    </View>
                                                ))}
                                            </View>
                                        )}
                                    </ScrollView>
                                </View>
                            </TouchableWithoutFeedback>
                        </View>
                    </TouchableWithoutFeedback>
                </KeyboardAvoidingView>
            </Modal>

            {/* Modal Tạo Ca Mới (Tích hợp luôn Staff Picker để tránh lỗi 2 Modals trên iOS) */}
            <Modal
                visible={createModalVisible}
                transparent={true}
                animationType="slide"
            >
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={{ flex: 1 }}
                >
                    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                        <View style={styles.modalOverlay}>
                            <TouchableWithoutFeedback>
                                <View style={[styles.modalContent, showStaffPicker ? { maxHeight: '80%' } : {}]}>
                                    {showStaffPicker ? (
                                        <View style={{ width: '100%' }}>
                                            <View style={styles.modalHeader}>
                                                <Text style={styles.modalTitle}>Chọn nhân viên</Text>
                                                <TouchableOpacity onPress={() => setShowStaffPicker(false)}>
                                                    <Ionicons name="close" size={24} color="#333" />
                                                </TouchableOpacity>
                                            </View>
                                            <FlatList
                                                data={staffArray}
                                                keyExtractor={(item) => item.id}
                                                renderItem={({ item }) => (
                                                    <TouchableOpacity
                                                        style={{ paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#F2F2F7' }}
                                                        onPress={() => {
                                                            setSelectedStaff(item);
                                                            setShowStaffPicker(false);
                                                        }}
                                                    >
                                                        <Text style={{ fontSize: 16, fontWeight: '500', color: '#000' }}>{item.name}</Text>
                                                        <Text style={{ fontSize: 13, color: '#666' }}>{item.email || 'Không có email'}</Text>
                                                    </TouchableOpacity>
                                                )}
                                                ListEmptyComponent={
                                                    <Text style={{ textAlign: 'center', color: '#999', marginTop: 20 }}>
                                                        Chưa có dữ liệu nhân viên
                                                    </Text>
                                                }
                                            />
                                        </View>
                                    ) : (
                                        <View style={{ width: '100%' }}>
                                            <View style={styles.modalHeader}>
                                                <Text style={styles.modalTitle}>Tạo ca làm việc mới</Text>
                                                <TouchableOpacity onPress={() => setCreateModalVisible(false)}>
                                                    <Ionicons name="close" size={24} color="#333" />
                                                </TouchableOpacity>
                                            </View>

                                            <View style={styles.formGroup}>
                                                <Text style={styles.label}>Ngày làm việc</Text>
                                                <View style={styles.input}>
                                                    <Text>{formatDate(newShiftDate)}</Text>
                                                </View>
                                            </View>

                                            <View style={styles.formGroup}>
                                                <Text style={styles.label}>Nhân viên *</Text>
                                                <TouchableOpacity
                                                    style={[styles.input, { flexDirection: 'row', justifyContent: 'space-between' }]}
                                                    onPress={() => setShowStaffPicker(true)}
                                                >
                                                    <Text style={{ color: selectedStaff ? '#000' : '#999' }}>
                                                        {selectedStaff ? selectedStaff.name : 'Chọn nhân viên'}
                                                    </Text>
                                                    <Ionicons name="chevron-down" size={20} color="#666" />
                                                </TouchableOpacity>
                                            </View>

                                            <View style={styles.formGroup}>
                                                <Text style={styles.label}>Tiền giao ca ban đầu (VNĐ)</Text>
                                                <TextInput
                                                    style={styles.input}
                                                    value={newShiftMoney}
                                                    onChangeText={(t) => setNewShiftMoney(formatMoneyInput(t))}
                                                    placeholder="VD: 1.000.000"
                                                    placeholderTextColor={theme.colors.text.hint}
                                                    keyboardType="numeric"
                                                />
                                            </View>

                                            <TouchableOpacity
                                                style={styles.submitButton}
                                                onPress={handleCreateShift}
                                                disabled={createShiftMutation.isPending}
                                            >
                                                {createShiftMutation.isPending ? (
                                                    <ActivityIndicator color="#FFF" />
                                                ) : (
                                                    <Text style={styles.submitButtonText}>Tạo Ca</Text>
                                                )}
                                            </TouchableOpacity>
                                        </View>
                                    )}
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
    filterContainer: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#FFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E5EA',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    dateFilterBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F2F2F7',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
    },
    dateFilterText: {
        marginLeft: 6,
        fontSize: 14,
        fontWeight: '500',
        color: '#333',
    },
    statusFilters: {
        flexDirection: 'row',
        backgroundColor: '#F2F2F7',
        borderRadius: 8,
        padding: 4,
    },
    statusFilterBtn: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 6,
    },
    statusFilterBtnActive: {
        backgroundColor: '#FFF',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 1,
        elevation: 1,
    },
    statusFilterText: {
        fontSize: 13,
        fontWeight: '500',
        color: '#666',
    },
    statusFilterTextActive: {
        color: '#000',
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
        paddingBottom: 100,
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
        marginBottom: 16,
    },
    staffName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#000',
        marginBottom: 4,
    },
    shiftTime: {
        fontSize: 13,
        color: '#666',
    },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    statusBadgeActive: {
        backgroundColor: '#E8F5E9',
    },
    statusBadgeEnded: {
        backgroundColor: '#F2F2F7',
    },
    statusText: {
        fontSize: 12,
        fontWeight: '600',
    },
    statusTextActive: {
        color: '#4CAF50',
    },
    statusTextEnded: {
        color: '#666',
    },
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        borderTopWidth: 1,
        borderTopColor: '#F2F2F7',
        paddingTop: 12,
        marginBottom: 16,
    },
    statItem: {
        width: '50%',
        marginBottom: 12,
    },
    statLabel: {
        fontSize: 12,
        color: '#666',
        marginBottom: 4,
    },
    statValue: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#000',
    },
    cardActions: {
        flexDirection: 'row',
        gap: 8,
    },
    actionBtn: {
        flex: 1,
        paddingVertical: 10,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    actionBtnPrimary: {
        backgroundColor: '#E6F0FF',
    },
    actionBtnEnd: {
        backgroundColor: '#FFEBEE',
    },
    actionBtnTextPrimary: {
        color: theme?.colors?.primary?.default || '#007AFF',
        fontSize: 14,
        fontWeight: '600',
    },
    actionBtnTextEnd: {
        color: '#F44336',
        fontSize: 14,
        fontWeight: '600',
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
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#000',
    },
    modalSubtitle: {
        fontSize: 14,
        color: '#666',
        marginBottom: 20,
        paddingBottom: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#F2F2F7',
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
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 8,
    },
    detailLabel: {
        fontSize: 14,
        color: '#666',
    },
    detailValue: {
        fontSize: 15,
        color: '#000',
    },
});
