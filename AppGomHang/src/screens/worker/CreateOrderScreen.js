import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator, TextInput } from 'react-native';
import { showError, showValidationError } from '../../utils/errorHelper';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../theme/theme';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import { createOrderAPI } from '../../api/orders';
import { getCurrentShiftAPI } from '../../api/shifts';
import { getCustomersListAPI } from '../../api/customers';
import { getCountersListAPI } from '../../api/counters';

export default function CreateOrderScreen() {
    const navigation = useNavigation();

    // Form state
    const [customerName, setCustomerName] = useState('');
    const [customerId, setCustomerId] = useState('');
    const [counterName, setCounterName] = useState('');
    const [counterId, setCounterId] = useState('');

    // Autocomplete state
    const [allCustomers, setAllCustomers] = useState([]);
    const [filteredCustomers, setFilteredCustomers] = useState([]);
    const [counters, setCounters] = useState([]);
    const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
    const [showCounterDropdown, setShowCounterDropdown] = useState(false);
    const [filteredCounters, setFilteredCounters] = useState([]);

    // Money state
    const [tienHangStr, setTienHangStr] = useState('');
    const [tienCongGomStr, setTienCongGomStr] = useState('');
    const [phiDongHangStr, setPhiDongHangStr] = useState('');
    const [tienHoaHongStr, setTienHoaHongStr] = useState('');
    const [thueStr, setThueStr] = useState(''); // Tax percentage

    const [isSaving, setIsSaving] = useState(false);
    const [currentShiftId, setCurrentShiftId] = useState(null);
    const [quyConLai, setQuyConLai] = useState(0);

    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                const shiftRes = await getCurrentShiftAPI();
                if (shiftRes && shiftRes.success && shiftRes.data) {
                    setCurrentShiftId(shiftRes.data.id);
                    setQuyConLai(shiftRes.data.quyConLai || 0);
                }
                const counterRes = await getCountersListAPI();
                if (counterRes && counterRes.success && counterRes.data) {
                    setCounters(counterRes.data);
                }
                // Load all customers for local filtering
                const customerRes = await getCustomersListAPI();
                if (customerRes && customerRes.success && customerRes.data) {
                    setAllCustomers(customerRes.data);
                }
            } catch (error) {
                console.log('Failed to fetch initial data:', error);
            }
        };
        fetchInitialData();
    }, []);

    // === Customer autocomplete (local filtering) ===
    const handleCustomerInput = (val) => {
        setCustomerName(val);
        setCustomerId('');
        if (val.trim().length >= 1) {
            const filtered = allCustomers.filter(c =>
                c.name.toLowerCase().includes(val.toLowerCase())
            );
            setFilteredCustomers(filtered);
            setShowCustomerDropdown(true);
        } else {
            setShowCustomerDropdown(false);
            setFilteredCustomers([]);
        }
    };

    const selectCustomer = (c) => {
        setCustomerName(c.name);
        setCustomerId(c.id);
        setShowCustomerDropdown(false);
        // Tự động điền thuế mặc định và công gom mặc định
        if (c.address) {
            setThueStr(c.address.toString());
        } else {
            setThueStr('0');
        }
        if (c.defaultTienCongGom !== undefined && c.defaultTienCongGom !== null) {
            setTienCongGomStr(formatMoneyInput(c.defaultTienCongGom.toString()));
        } else {
            setTienCongGomStr('0');
        }
    };

    // === Counter autocomplete ===
    const handleCounterInput = (val) => {
        setCounterName(val);
        setCounterId('');
        if (val.trim().length >= 1) {
            const filtered = counters.filter(c =>
                c.name.toLowerCase().includes(val.toLowerCase())
            );
            setFilteredCounters(filtered);
            setShowCounterDropdown(true);
        } else {
            setShowCounterDropdown(false);
            setFilteredCounters([]);
        }
    };

    const selectCounter = (c) => {
        setCounterName(c.name);
        setCounterId(c.id);
        setShowCounterDropdown(false);
    };

    // Show all counters when tapping the list icon
    const showAllCounters = () => {
        setFilteredCounters(counters);
        setShowCounterDropdown(true);
    };

    // === Money formatters ===
    const formatMoneyInput = (value) => {
        const digitsOnly = value.replace(/\D/g, '');
        if (!digitsOnly) return '';
        return digitsOnly.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    };

    const parseMoneyValue = (value) => {
        if (!value) return 0;
        const normalized = value.toString().replace(/\./g, '');
        const parsed = Number(normalized);
        return isNaN(parsed) ? 0 : parsed;
    };

    const tienHang = parseMoneyValue(tienHangStr);
    const tienCongGom = parseMoneyValue(tienCongGomStr);
    const phiDongHang = parseMoneyValue(phiDongHangStr);
    const tienHoaHong = parseMoneyValue(tienHoaHongStr);
    const thuePhanTram = thueStr ? parseFloat(thueStr.replace(',', '.')) : 0;
    const tienThue = !isNaN(thuePhanTram) && !isNaN(tienHang) && !isNaN(tienCongGom) ? Math.round((tienHang + tienCongGom) * thuePhanTram / 100) : 0;

    const tongTienHoaDon =
        (isNaN(tienHang) ? 0 : tienHang) +
        (isNaN(tienCongGom) ? 0 : tienCongGom) +
        (isNaN(phiDongHang) ? 0 : phiDongHang) +
        (isNaN(tienHoaHong) ? 0 : tienHoaHong) +
        tienThue;

    const handleSave = async () => {
        if (!currentShiftId) {
            showValidationError('Bạn chưa có ca làm việc nào đang mở. Vui lòng nhận ca trước khi tạo đơn.');
            return;
        }

        try {
            if (!customerName || !counterName) {
                Alert.alert('Lỗi', 'Vui lòng nhập đầy đủ thông tin khách hàng và quầy');
                return;
            }

            if (isNaN(tienHang) || tienHang < 0) {
                Alert.alert('Lỗi', 'Tiền hàng không hợp lệ');
                return;
            }

            if (!customerId) {
                Alert.alert(
                    'Không thể tạo khách hàng mới',
                    'Chỉ có quản lý mới được phép tạo khách hàng mới. Vui lòng liên hệ quản lý để thêm khách hàng này.',
                    [{ text: 'Đã hiểu' }]
                );
                return;
            }

            setIsSaving(true);
            const payload = {
                shiftId: currentShiftId,
                customerId: customerId || undefined,
                customerName: customerName,
                counterId: counterId || undefined,
                counterName: counterName,
                tienHang: isNaN(tienHang) ? 0 : tienHang,
                tienCongGom: isNaN(tienCongGom) ? 0 : tienCongGom,
                phiDongHang: isNaN(phiDongHang) ? 0 : phiDongHang,
                tienHoaHong: isNaN(tienHoaHong) ? 0 : tienHoaHong,
                tienThem: tienThue > 0 ? tienThue : undefined,
                loaiTienThem: tienThue > 0 ? `Thuế ${thuePhanTram}%` : undefined,
            };
            console.log('[DEBUG] Save order payload:', JSON.stringify(payload));
            await createOrderAPI(payload);
            Alert.alert('Thành công', 'Đã lưu đơn hàng mới.');
            navigation.goBack();
        } catch (error) {
            console.log('[DEBUG] Save order error:', error.message, error.response?.status, JSON.stringify(error.response?.data));
            showError(error, 'tạo đơn hàng');
        } finally {
            setIsSaving(false);
        }
    };

    // === Autocomplete dropdown component ===
    const AutocompleteDropdown = ({ items, isLoading, onSelect, type, emptyText }) => {
        if (isLoading) {
            return (
                <View style={styles.dropdown}>
                    <View style={styles.dropdownLoading}>
                        <ActivityIndicator size="small" color={theme.colors.primary.default} />
                        <Text style={styles.dropdownLoadingText}>Đang tìm kiếm...</Text>
                    </View>
                </View>
            );
        }

        if (items.length === 0) {
            return (
                <View style={styles.dropdown}>
                    <View style={styles.dropdownEmpty}>
                        <Ionicons name="search-outline" size={18} color="#9ca3af" />
                        <Text style={styles.dropdownEmptyText}>{emptyText || 'Không tìm thấy kết quả'}</Text>
                    </View>
                </View>
            );
        }

        return (
            <View style={styles.dropdown}>
                <ScrollView
                    style={styles.dropdownScroll}
                    nestedScrollEnabled
                    keyboardShouldPersistTaps="handled"
                >
                    {items.slice(0, 8).map((item, index) => (
                        <TouchableOpacity
                            key={item.id}
                            style={[
                                styles.dropdownItem,
                                index === items.length - 1 || index === 7 ? { borderBottomWidth: 0 } : {}
                            ]}
                            onPress={() => onSelect(item)}
                            activeOpacity={0.6}
                        >
                            <View style={styles.dropdownItemIcon}>
                                <Ionicons
                                    name={type === 'customer' ? 'person-outline' : 'storefront-outline'}
                                    size={18}
                                    color={theme.colors.primary.default}
                                />
                            </View>
                            <View style={styles.dropdownItemContent}>
                                <Text style={styles.dropdownItemName}>{item.name}</Text>
                                {type === 'customer' && item.phone ? (
                                    <Text style={styles.dropdownItemSub}>📞 {item.phone}</Text>
                                ) : null}
                                {type === 'counter' && item.address ? (
                                    <Text style={styles.dropdownItemSub}>📍 {item.address}</Text>
                                ) : null}
                            </View>
                            <Ionicons name="chevron-forward" size={16} color="#d1d5db" />
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>
        );
    };

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={theme.colors.text.primary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Tạo hóa đơn mới</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView
                style={styles.content}
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled"
            >
                {/* Khách hàng */}
                <View style={[styles.section, { zIndex: 20 }]}>
                    <Text style={styles.sectionTitle}>Thông tin khách hàng</Text>
                    <View style={styles.autocompleteContainer}>
                        <View style={styles.inputRow}>
                            <View style={styles.inputIconLeft}>
                                <Ionicons name="person-outline" size={20} color={customerId ? theme.colors.primary.default : '#9ca3af'} />
                            </View>
                            <TextInput
                                style={[styles.autocompleteInput, customerId ? styles.selectedInput : {}]}
                                placeholder="Nhập tên khách hàng để tìm..."
                                placeholderTextColor="#9ca3af"
                                value={customerName}
                                onChangeText={handleCustomerInput}
                                onFocus={() => {
                                    if (customerName.trim().length >= 1) {
                                        setShowCustomerDropdown(true);
                                    }
                                }}
                            />
                            {customerId ? (
                                <TouchableOpacity
                                    style={styles.clearButton}
                                    onPress={() => {
                                        setCustomerName('');
                                        setCustomerId('');
                                        setShowCustomerDropdown(false);
                                        setFilteredCustomers([]);
                                    }}
                                >
                                    <Ionicons name="close-circle" size={20} color="#9ca3af" />
                                </TouchableOpacity>
                            ) : null}
                        </View>
                        {customerId ? (
                            <View style={styles.selectedBadge}>
                                <Ionicons name="checkmark-circle" size={14} color={theme.colors.primary.default} />
                                <Text style={styles.selectedBadgeText}>Đã chọn khách hàng</Text>
                            </View>
                        ) : null}
                        {showCustomerDropdown && !customerId && (
                            <AutocompleteDropdown
                                items={filteredCustomers}
                                isLoading={false}
                                onSelect={selectCustomer}
                                type="customer"
                                emptyText="Không tìm thấy — liên hệ quản lý để thêm khách"
                            />
                        )}
                    </View>
                </View>

                {/* Quầy */}
                <View style={[styles.section, { zIndex: 10 }]}>
                    <Text style={styles.sectionTitle}>Thông tin quầy</Text>
                    <View style={styles.autocompleteContainer}>
                        <View style={styles.inputRow}>
                            <View style={styles.inputIconLeft}>
                                <Ionicons name="storefront-outline" size={20} color={counterId ? theme.colors.primary.default : '#9ca3af'} />
                            </View>
                            <TextInput
                                style={[styles.autocompleteInput, counterId ? styles.selectedInput : {}]}
                                placeholder="Nhập tên quầy để tìm..."
                                placeholderTextColor="#9ca3af"
                                value={counterName}
                                onChangeText={handleCounterInput}
                                onFocus={() => {
                                    if (counterName.trim().length >= 1) {
                                        const filtered = counters.filter(c =>
                                            c.name.toLowerCase().includes(counterName.toLowerCase())
                                        );
                                        setFilteredCounters(filtered);
                                        setShowCounterDropdown(true);
                                    }
                                }}
                            />
                            <TouchableOpacity
                                style={styles.dropdownToggle}
                                onPress={() => {
                                    if (showCounterDropdown) {
                                        setShowCounterDropdown(false);
                                    } else {
                                        showAllCounters();
                                    }
                                }}
                            >
                                <Ionicons
                                    name={showCounterDropdown ? "chevron-up" : "chevron-down"}
                                    size={20}
                                    color="#6b7280"
                                />
                            </TouchableOpacity>
                            {counterId ? (
                                <TouchableOpacity
                                    style={styles.clearButton}
                                    onPress={() => {
                                        setCounterName('');
                                        setCounterId('');
                                        setShowCounterDropdown(false);
                                    }}
                                >
                                    <Ionicons name="close-circle" size={20} color="#9ca3af" />
                                </TouchableOpacity>
                            ) : null}
                        </View>
                        {counterId ? (
                            <View style={styles.selectedBadge}>
                                <Ionicons name="checkmark-circle" size={14} color={theme.colors.primary.default} />
                                <Text style={styles.selectedBadgeText}>Đã chọn quầy</Text>
                            </View>
                        ) : null}
                        {showCounterDropdown && !counterId && (
                            <AutocompleteDropdown
                                items={filteredCounters}
                                isLoading={false}
                                onSelect={selectCounter}
                                type="counter"
                                emptyText="Không tìm thấy quầy phù hợp"
                            />
                        )}
                    </View>
                </View>

                {/* Thông tin tiền */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Thông tin tiền</Text>

                    <Input
                        label="Tiền hàng (trả cho quầy) *"
                        placeholder="0"
                        keyboardType="numeric"
                        value={tienHangStr}
                        onChangeText={(t) => setTienHangStr(formatMoneyInput(t))}
                    />

                    <View style={styles.inputGroup}>
                        <Input
                            label="Phí gom *"
                            placeholder="0"
                            keyboardType="numeric"
                            value={tienCongGomStr}
                            onChangeText={(t) => setTienCongGomStr(formatMoneyInput(t))}
                        />
                        <View style={styles.quickOptionsContainer}>
                            {['10.000', '15.000', '20.000', '30.000'].map((amount) => (
                                <TouchableOpacity
                                    key={amount}
                                    style={[
                                        styles.quickOptionChip,
                                        tienCongGomStr === amount ? styles.quickOptionChipActive : {}
                                    ]}
                                    onPress={() => setTienCongGomStr(amount)}
                                >
                                    <Text style={[
                                        styles.quickOptionText,
                                        tienCongGomStr === amount ? styles.quickOptionTextActive : {}
                                    ]}>{amount.replace('.000', 'K')}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    <Input
                        label="Phí đóng hàng *"
                        placeholder="0"
                        keyboardType="numeric"
                        value={phiDongHangStr}
                        onChangeText={(t) => setPhiDongHangStr(formatMoneyInput(t))}
                    />

                    <Input
                        label="Tiền hoa hồng (nếu có)"
                        placeholder="0"
                        keyboardType="numeric"
                        value={tienHoaHongStr}
                        onChangeText={(t) => setTienHoaHongStr(formatMoneyInput(t))}
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
                </View>

                {/* Tổng kết */}
                <View style={[styles.summaryBox, { borderBottomWidth: 1, borderBottomColor: theme.colors.border, paddingBottom: 16 }]}>
                    <Text style={styles.summaryLabel}>Quỹ hiện tại:</Text>
                    <Text style={[styles.summaryValue, quyConLai < 0 ? styles.negativeValue : {}]}>
                        {quyConLai.toLocaleString('vi-VN')}đ
                    </Text>
                </View>

                <View style={[styles.summaryBox, { marginTop: 16 }]}>
                    <Text style={styles.summaryLabel}>Tổng tiền hóa đơn:</Text>
                    <Text style={styles.summaryValue}>{tongTienHoaDon.toLocaleString('vi-VN')}đ</Text>
                </View>

                <View style={[styles.summaryBox, { borderTopWidth: 0, marginTop: 4 }]}>
                    <Text style={styles.summaryLabel}>Quỹ sau khi tạo đơn (dự kiến):</Text>
                    <Text style={[styles.summaryValue, (quyConLai - (isNaN(tienHang) ? 0 : tienHang)) < 0 ? styles.negativeValue : {}]}>
                        {(quyConLai - (isNaN(tienHang) ? 0 : tienHang)).toLocaleString('vi-VN')}đ
                    </Text>
                </View>

            </ScrollView>

            {/* Footer / Submit */}
            <View style={styles.footer}>
                <Button
                    title="Lưu đơn"
                    onPress={handleSave}
                    loading={isSaving}
                    disabled={!customerName || !counterName || (!isNaN(tienHang) && tienHang < 0)}
                />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background.light,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: theme.colors.surface.light,
        paddingTop: 60,
        paddingBottom: 16,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
    },
    backButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 8,
        backgroundColor: theme.colors.background.light,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: theme.colors.text.primary,
    },
    content: {
        flex: 1,
    },
    scrollContent: {
        padding: 16,
        paddingBottom: 40,
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: theme.colors.text.primary,
        marginBottom: 12,
    },
    inputGroup: {
        marginBottom: 8,
    },
    quickOptionsContainer: {
        flexDirection: 'row',
        gap: 8,
        marginTop: -12,
        marginBottom: 16,
        paddingHorizontal: 4,
    },
    quickOptionChip: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        backgroundColor: '#f3f4f6',
        borderWidth: 1,
        borderColor: '#e5e7eb',
    },
    quickOptionChipActive: {
        backgroundColor: theme.colors.primary.light || '#EBF5FF',
        borderColor: theme.colors.primary.default,
    },
    quickOptionText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#6b7280',
    },
    quickOptionTextActive: {
        color: theme.colors.primary.default,
    },

    // === Autocomplete styles ===
    autocompleteContainer: {
        position: 'relative',
    },
    inputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: theme.colors.border,
        borderRadius: 10,
        paddingHorizontal: 12,
    },
    inputIconLeft: {
        marginRight: 8,
    },
    autocompleteInput: {
        flex: 1,
        height: 48,
        fontSize: 15,
        color: theme.colors.text.primary,
    },
    selectedInput: {
        color: theme.colors.primary.default,
        fontWeight: '500',
    },
    clearButton: {
        padding: 4,
        marginLeft: 4,
    },
    dropdownToggle: {
        padding: 6,
        marginLeft: 4,
    },
    selectedBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 6,
        gap: 4,
    },
    selectedBadgeText: {
        fontSize: 12,
        color: theme.colors.primary.default,
        fontWeight: '500',
    },

    // === Dropdown styles ===
    dropdown: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#e5e7eb',
        borderRadius: 10,
        marginTop: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.12,
        shadowRadius: 8,
        elevation: 6,
        overflow: 'hidden',
    },
    dropdownScroll: {
        maxHeight: 250,
    },
    dropdownItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 14,
        borderBottomWidth: 1,
        borderBottomColor: '#f3f4f6',
    },
    dropdownItemIcon: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: theme.colors.primary.light || '#EBF5FF',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    dropdownItemContent: {
        flex: 1,
    },
    dropdownItemName: {
        fontSize: 15,
        fontWeight: '500',
        color: theme.colors.text.primary,
    },
    dropdownItemSub: {
        fontSize: 13,
        color: '#6b7280',
        marginTop: 2,
    },
    dropdownLoading: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        gap: 8,
    },
    dropdownLoadingText: {
        fontSize: 14,
        color: '#6b7280',
    },
    dropdownEmpty: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        gap: 8,
    },
    dropdownEmptyText: {
        fontSize: 14,
        color: '#9ca3af',
        fontStyle: 'italic',
    },

    // === Other styles ===
    summaryBox: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: theme.colors.border,
        paddingTop: 16,
        marginTop: 8,
    },
    summaryLabel: {
        fontSize: 14,
        color: theme.colors.text.secondary,
    },
    summaryValue: {
        fontSize: 20,
        fontWeight: 'bold',
        color: theme.colors.text.primary,
    },
    negativeValue: {
        color: '#ef4444',
    },
    footer: {
        padding: 16,
        backgroundColor: theme.colors.surface.light,
        borderTopWidth: 1,
        borderTopColor: theme.colors.border,
        paddingBottom: 32,
    },

    // Tax styles
    taxSection: {
        marginTop: 8,
    },
    taxLabel: {
        fontSize: 14,
        color: theme.colors.text.secondary,
        marginBottom: 8,
        fontWeight: '500',
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
        borderColor: theme.colors.border,
        borderRadius: 10,
        paddingHorizontal: 14,
        height: 44,
    },
    taxInput: {
        width: 50,
        height: 44,
        fontSize: 16,
        color: theme.colors.text.primary,
        textAlign: 'right',
        paddingVertical: 0,
    },
    taxPercent: {
        fontSize: 16,
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
        backgroundColor: theme.colors.primary.light || '#EBF5FF',
        borderColor: theme.colors.primary.default,
    },
    taxChipText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#6b7280',
    },
    taxChipTextActive: {
        color: theme.colors.primary.default,
    },
    taxAmount: {
        marginLeft: 12,
        fontSize: 14,
        color: theme.colors.primary.default,
        fontWeight: '600',
    },
});
