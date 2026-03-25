import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    Platform,
    Alert,
    TextInput,
    Modal,
    ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import ViewShot from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import { theme } from '../../theme/theme';
import { formatCurrency, formatDate, getLocalDateString } from '../../utils/helpers';

import { getCustomerByIdAPI, saveCustomerDailyFeeAPI, getCustomerDailyFeeAPI } from '../../api/customers';
import { getOrdersByDateAPI } from '../../api/orders';

export default function CustomerDetailScreen({ route, navigation }) {
    // Nếu có route params, lấy customerId, còn để demo thì dùng static
    const customerId = route?.params?.customerId || '1';

    const [customer, setCustomer] = useState(null);
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    const [selectedDate, setSelectedDate] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [isExportingImage, setIsExportingImage] = useState(false);
    const [showPreview, setShowPreview] = useState(false);
    const invoiceRef = useRef();

    // 4 trường nhập tay trước khi xuất hóa đơn
    const [dongGui, setDongGui] = useState('');
    const [soDuKhach, setSoDuKhach] = useState('');
    const [noKhach, setNoKhach] = useState('');
    const [tongThanhToan, setTongThanhToan] = useState('');
    const [savingDongGui, setSavingDongGui] = useState(false);
    const [dongGuiSaved, setDongGuiSaved] = useState(false);

    // Invoiced status for today
    const [isInvoiced, setIsInvoiced] = useState(false);

    useEffect(() => {
        loadData();
    }, [customerId, selectedDate]);

    const loadData = async () => {
        setLoading(true);
        try {
            const dateStr = getLocalDateString(selectedDate);
            const [customerRes, ordersRes] = await Promise.all([
                getCustomerByIdAPI(customerId),
                getOrdersByDateAPI(dateStr)
            ]);

            if (customerRes.success) {
                setCustomer(customerRes.data);
            }

            if (ordersRes.success) {
                const allOrders = ordersRes.data || [];
                // Filter orders by customerId
                const customerOrders = allOrders.filter(o => o.customerId === customerId && o.status !== 'cancelled');
                setOrders(customerOrders);
            }

            // Load phí đóng gửi đã lưu
            try {
                const feeRes = await getCustomerDailyFeeAPI(customerId, dateStr);
                if (feeRes.success && feeRes.data) {
                    setDongGui(feeRes.data.phiDongGui > 0 ? feeRes.data.phiDongGui.toString() : '');
                    setDongGuiSaved(true);
                    setIsInvoiced(feeRes.data.isInvoiced || false);
                } else {
                    setDongGui('');
                    setDongGuiSaved(false);
                    setIsInvoiced(false);
                }
            } catch (e) {
                // Ignore error loading fees (table might not exist yet)
                setDongGui('');
                setDongGuiSaved(false);
                setIsInvoiced(false);
            }
        } catch (error) {
            console.error('Error loading customer detail:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDateChange = (event, selected) => {
        setShowDatePicker(Platform.OS === 'ios');
        if (selected) {
            setSelectedDate(selected);
        }
    };

    const handleSaveDongGui = async () => {
        if (!dongGui || Number(dongGui) <= 0) {
            Alert.alert('Thông báo', 'Vui lòng nhập phí đóng gửi trước khi lưu');
            return;
        }
        setSavingDongGui(true);
        try {
            const dateStr = getLocalDateString(selectedDate);
            const res = await saveCustomerDailyFeeAPI(customerId, dateStr, Number(dongGui), isInvoiced);
            if (res.success) {
                setDongGuiSaved(true);
                Alert.alert('Thành công', 'Đã lưu phí đóng gửi');
            } else {
                Alert.alert('Lỗi', res.error || 'Không thể lưu phí đóng gửi');
            }
        } catch (error) {
            console.error('Save dong gui error:', error);
            Alert.alert('Lỗi', 'Không thể lưu phí đóng gửi. Vui lòng thử lại.');
        } finally {
            setSavingDongGui(false);
        }
    };

    const stats = {
        count: orders.length,
        totalAmount: orders.reduce((sum, order) => sum + (order.tongTienHoaDon || 0), 0),
        totalTienUng: orders.reduce((sum, order) => sum + (order.tienHang || 0) + (order.tienHoaHong || 0), 0),
        totalPhiGom: orders.reduce((sum, order) => sum + (order.tienCongGom || 0), 0),
        totalThuePhi: orders.reduce((sum, order) => sum + (order.phiDongHang || 0) + (order.tienThem || 0), 0),
    };

    // Auto-calculate tongThanhToan whenever inputs or totalAmount change
    useEffect(() => {
        const totalAmount = stats.totalAmount || 0;
        const fee = Number(dongGui) || 0;
        const balance = Number(soDuKhach) || 0;
        const debt = Number(noKhach) || 0;

        const calculatedTotal = totalAmount + fee - balance + debt;
        setTongThanhToan(calculatedTotal.toString());
    }, [stats.totalAmount, dongGui, soDuKhach, noKhach]);

    const handleExportImage = async () => {
        if (!customer || orders.length === 0) return;

        try {
            setIsExportingImage(true);

            setTimeout(async () => {
                try {
                    if (!invoiceRef.current) {
                        setIsExportingImage(false);
                        return;
                    }

                    if (Platform.OS === 'web') {
                        try {
                            const html2canvas = require('html2canvas');
                            const element = document.getElementById('invoice-to-capture');
                            if (!element) {
                                console.error('Invoice element not found');
                                setIsExportingImage(false);
                                return;
                            }

                            const canvas = await html2canvas(element, {
                                scale: 2,
                                useCORS: true,
                                backgroundColor: '#ffffff',
                                logging: false,
                                windowWidth: element.scrollWidth,
                                windowHeight: element.scrollHeight + 40,
                                width: element.scrollWidth,
                                height: element.scrollHeight + 40
                            });

                            const uri = canvas.toDataURL('image/jpeg', 0.9);
                            const link = document.createElement('a');
                            link.href = uri;
                            link.download = `TongHopHoaDon_${customer?.name || 'Customer'}.jpg`;
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);

                            // Mark as invoiced
                            const dateStr = getLocalDateString(selectedDate);
                            await saveCustomerDailyFeeAPI(customerId, dateStr, Number(dongGui) || 0, true);
                            setIsInvoiced(true);
                        } catch (webErr) {
                            console.error('Web export error:', webErr);
                            // Fallback to basic capture if html2canvas fails or isn't available
                            const uri = await invoiceRef.current.capture();
                            const link = document.createElement('a');
                            link.href = uri;
                            link.download = `TongHopHoaDon_${customer?.name || 'Customer'}.jpg`;
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);
                        }
                    } else {
                        const uri = await invoiceRef.current.capture();
                        if (await Sharing.isAvailableAsync()) {
                            await Sharing.shareAsync(uri, {
                                mimeType: 'image/jpeg',
                                dialogTitle: 'Chia sẻ ảnh hóa đơn',
                            });
                            // Mark as invoiced
                            const dateStr = getLocalDateString(selectedDate);
                            await saveCustomerDailyFeeAPI(customerId, dateStr, Number(dongGui) || 0, true);
                            setIsInvoiced(true);
                        } else {
                            Alert.alert('Thành công', 'Đã lưu ảnh hóa đơn.');
                            const dateStr = getLocalDateString(selectedDate);
                            await saveCustomerDailyFeeAPI(customerId, dateStr, Number(dongGui) || 0, true);
                            setIsInvoiced(true);
                        }
                    }
                } catch (err) {
                    console.error('Error capturing inside timeout:', err);
                    Alert.alert('Lỗi', 'Không thể tạo ảnh hóa đơn.');
                } finally {
                    setIsExportingImage(false);
                }
            }, 500);

        } catch (error) {
            console.error('Error in export image:', error);
            Alert.alert('Lỗi', 'Có lỗi xảy ra khi tạo ảnh. Vui lòng thử lại.');
            setIsExportingImage(false);
        }
    };

    const renderDateSelector = () => (
        <View style={styles.dateSelectorContainer}>
            <Text style={styles.dateLabel}>Chọn ngày để xem hóa đơn:</Text>
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
            <Text style={styles.currentDateText}>Đang xem: <Text style={{ fontWeight: '500' }}>{formatDate(selectedDate)}</Text></Text>
        </View>
    );

    const renderOrderCard = ({ item }) => {
        const orderDate = new Date(item.createdAt);
        const timeStr = `${orderDate.getHours().toString().padStart(2, '0')}:${orderDate.getMinutes().toString().padStart(2, '0')} - ${formatDate(orderDate)}`;

        return (
            <TouchableOpacity 
                style={styles.orderCard} 
                onPress={() => navigation.navigate('OrderDetail', { orderId: item.id })}
            >
                <View style={styles.orderCardHeader}>
                    <View>
                        <Text style={styles.counterName}>{item.counterName || 'Quầy'}</Text>
                        <Text style={styles.orderTime}>{timeStr}</Text>
                    </View>
                    <Text style={styles.orderTotal}>{formatCurrency(item.tongTienHoaDon)}</Text>
                </View>
            </TouchableOpacity>
        );
    };

    if (loading && !customer) {
        return (
            <View style={[styles.container, styles.centerContent]}>
                <ActivityIndicator size="large" color={theme?.colors?.primary?.default || '#007AFF'} />
                <Text style={styles.loadingText}>Đang tải thông tin...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                >
                    <Ionicons name="arrow-back" size={24} color="#000" />
                </TouchableOpacity>
                <Text style={styles.title}>Chi tiết khách hàng</Text>
                <View style={{ width: 40 }} />
            </View>

            <FlatList
                data={orders}
                keyExtractor={(item) => item.id}
                renderItem={renderOrderCard}
                contentContainerStyle={styles.listContainer}
                keyboardShouldPersistTaps="handled"
                ListHeaderComponent={
                    <>
                        {customer && (
                            <View style={styles.customerInfoCard}>
                                <Text style={styles.customerName}>{customer.name}</Text>
                                {customer.phone && (
                                    <Text style={styles.customerDetailText}>
                                        <Text style={{ fontWeight: '500' }}>Số điện thoại:</Text> {customer.phone}
                                    </Text>
                                )}
                                {customer.address && (
                                    <Text style={styles.customerDetailText}>
                                        <Text style={{ fontWeight: '500' }}>Thuế mặc định:</Text> {customer.address}%
                                    </Text>
                                )}
                            </View>
                        )}

                        {renderDateSelector()}

                        <View style={styles.statsCard}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                                <Text style={[styles.statsCardTitle, { marginBottom: 0 }]}>Hóa đơn ngày {formatDate(selectedDate)}</Text>
                                <TouchableOpacity
                                    onPress={async () => {
                                        try {
                                            const dateStr = getLocalDateString(selectedDate);
                                            const newStatus = !isInvoiced;
                                            const res = await saveCustomerDailyFeeAPI(customerId, dateStr, Number(dongGui) || 0, newStatus);
                                            if (res && res.success) {
                                                setIsInvoiced(newStatus);
                                            } else {
                                                Alert.alert('Lỗi', res?.error || 'Không thể cập nhật trạng thái xuất hóa đơn');
                                            }
                                        } catch (e) {
                                            Alert.alert('Lỗi', 'Không thể cập nhật trạng thái xuất hóa đơn');
                                        }
                                    }}
                                    style={{
                                        backgroundColor: isInvoiced ? '#10B981' : '#F3F4F6',
                                        paddingHorizontal: 12,
                                        paddingVertical: 6,
                                        borderRadius: 8,
                                        borderWidth: 1,
                                        borderColor: isInvoiced ? '#10B981' : '#D1D5DB'
                                    }}
                                >
                                    <Text style={{
                                        color: isInvoiced ? '#fff' : '#4B5563',
                                        fontSize: 13,
                                        fontWeight: '600'
                                    }}>
                                        {isInvoiced ? '✓ Đã xuất bill' : 'Đánh dấu xuất bill'}
                                    </Text>
                                </TouchableOpacity>
                            </View>

                            {loading ? (
                                <View style={{ padding: 20 }}>
                                    <ActivityIndicator size="small" color={theme?.colors?.primary?.default || '#007AFF'} />
                                </View>
                            ) : (
                                <>
                                    <View style={styles.statsGrid}>
                                        <View style={styles.statsItem}>
                                            <Text style={styles.statsLabel}>Số lượng hóa đơn</Text>
                                            <Text style={styles.statsValue}>{stats.count}</Text>
                                        </View>
                                        <View style={styles.statsItem}>
                                            <Text style={styles.statsLabel}>Tổng tiền</Text>
                                            <Text style={[styles.statsValue, { color: theme?.colors?.primary?.default || '#007AFF' }]}>
                                                {formatCurrency(stats.totalAmount)}
                                            </Text>
                                        </View>
                                    </View>

                                    {stats.count > 0 && (
                                        <View style={styles.manualFieldsContainer}>
                                            <Text style={styles.manualFieldsTitle}>Thông tin thanh toán bổ sung</Text>
                                            <View style={styles.manualRow}>
                                                <View style={styles.manualField}>
                                                    <Text style={styles.manualLabel}>Đóng gửi (VNĐ)</Text>
                                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                                        <TextInput
                                                            keyboardType="numeric"
                                                            value={dongGui ? dongGui.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".") : ''}
                                                            onChangeText={(t) => { setDongGui(t.replace(/[^0-9]/g, '')); setDongGuiSaved(false); }}
                                                            placeholder="0"
                                                            style={[styles.manualInput, { flex: 1 }]}
                                                        />
                                                        <TouchableOpacity
                                                            style={{
                                                                backgroundColor: dongGuiSaved ? '#10B981' : theme.colors.primary.default,
                                                                paddingHorizontal: 12,
                                                                paddingVertical: 8,
                                                                borderRadius: 8,
                                                                minWidth: 55,
                                                                alignItems: 'center',
                                                            }}
                                                            onPress={handleSaveDongGui}
                                                            disabled={savingDongGui}
                                                        >
                                                            {savingDongGui ? (
                                                                <ActivityIndicator size="small" color="#fff" />
                                                            ) : (
                                                                <Text style={{ color: '#fff', fontSize: 13, fontWeight: '600' }}>
                                                                    {dongGuiSaved ? '✓ Đã lưu' : 'Lưu'}
                                                                </Text>
                                                            )}
                                                        </TouchableOpacity>
                                                    </View>
                                                </View>
                                                <View style={[styles.manualField, styles.manualFieldRight]}>
                                                    <Text style={styles.manualLabel}>Số dư của khách (VNĐ)</Text>
                                                    <TextInput
                                                        keyboardType="numeric"
                                                        value={soDuKhach ? soDuKhach.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".") : ''}
                                                        onChangeText={(t) => setSoDuKhach(t.replace(/[^0-9]/g, ''))}
                                                        placeholder="0"
                                                        style={styles.manualInput}
                                                    />
                                                </View>
                                            </View>
                                            <View style={styles.manualRow}>
                                                <View style={styles.manualField}>
                                                    <Text style={styles.manualLabel}>Nợ của khách (VNĐ)</Text>
                                                    <TextInput
                                                        keyboardType="numeric"
                                                        value={noKhach ? noKhach.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".") : ''}
                                                        onChangeText={(t) => setNoKhach(t.replace(/[^0-9]/g, ''))}
                                                        placeholder="0"
                                                        style={styles.manualInput}
                                                    />
                                                </View>
                                                <View style={[styles.manualField, styles.manualFieldRight]}>
                                                    <Text style={styles.manualLabel}>Tổng cần thanh toán</Text>
                                                    <TextInput
                                                        value={formatCurrency(Number(tongThanhToan) || 0)}
                                                        editable={false}
                                                        style={[styles.manualInput, { backgroundColor: '#F3F4F6', color: '#2563EB', fontWeight: 'bold' }]}
                                                    />
                                                </View>
                                            </View>
                                        </View>
                                    )}
                                </>
                            )}

                            {!loading && stats.count > 0 && (
                                <TouchableOpacity
                                    style={styles.exportButton}
                                    onPress={() => setShowPreview(true)}
                                >
                                    <Ionicons name="eye-outline" size={20} color="#FFF" />
                                    <Text style={styles.exportButtonText}>Xem trước hóa đơn</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                        <Text style={styles.listSectionTitle}>Danh sách hóa đơn</Text>
                    </>
                }
                ListEmptyComponent={
                    !loading && (
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyText}>Không có hóa đơn nào trong ngày này</Text>
                        </View>
                    )
                }
            />

            {/* Hidden Receipt for Image Export */}
            {(customer && orders.length > 0) && (
                <View style={{ position: 'absolute', top: -10000, left: -10000 }} collapsable={false}>
                    <ViewShot ref={invoiceRef} options={{ format: 'jpg', quality: 0.9 }}>
                        <View
                            nativeID="invoice-to-capture"
                            style={{ width: 600, backgroundColor: '#fff', padding: 24, paddingBottom: 48 }}
                            collapsable={false}
                        >
                            {/* Header */}
                            <View style={{ alignItems: 'center', marginBottom: 20, paddingBottom: 16, borderBottomWidth: 2, borderBottomColor: '#2563eb' }}>
                                <Text style={{ fontSize: 32, fontWeight: '900', color: '#2563eb', marginBottom: 4, textTransform: 'uppercase' }}>Quân Gom Ninh Hiệp</Text>
                                <Text style={{ fontSize: 16, color: '#4b5563', marginBottom: 2 }}>Ninh Hiệp, Gia Lâm, Hà Nội</Text>
                                <Text style={{ fontSize: 20, fontWeight: '900', color: '#111827', marginBottom: 8 }}>0922 238 683</Text>
                                <Text style={{ fontSize: 22, fontWeight: 'bold', color: '#111827', marginTop: 8 }}>TỔNG HỢP HÓA ĐƠN</Text>
                            </View>

                            {/* Meta Info */}
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24 }}>
                                <View style={{ backgroundColor: '#f0f4ff', padding: 12, borderRadius: 8, flex: 1, marginRight: 16 }}>
                                    <Text style={{ fontSize: 15, color: '#111827' }}>
                                        <Text style={{ fontWeight: 'bold', color: '#2563eb' }}>Khách hàng:</Text> {customer.name}
                                    </Text>
                                    {customer.phone && (
                                        <Text style={{ fontSize: 14, color: '#4b5563', marginTop: 4 }}>
                                            <Text style={{ fontWeight: 'bold' }}>SĐT:</Text> {customer.phone}
                                        </Text>
                                    )}
                                </View>
                                <View style={{ alignItems: 'flex-end', justifyContent: 'center' }}>
                                    <Text style={{ fontSize: 14, color: '#111827', marginBottom: 4 }}>
                                        <Text style={{ fontWeight: 'bold' }}>Ngày:</Text> {formatDate(selectedDate)}
                                    </Text>
                                    <Text style={{ fontSize: 14, color: '#111827' }}>
                                        <Text style={{ fontWeight: 'bold' }}>Số đơn:</Text> {orders.length}
                                    </Text>
                                </View>
                            </View>

                            {/* Table Header */}
                            <View style={{ flexDirection: 'row', backgroundColor: '#f0f4ff', paddingVertical: 14, paddingHorizontal: 8, borderBottomWidth: 2, borderBottomColor: '#2563eb', alignItems: 'center' }}>
                                <Text style={{ flex: 0.8, fontWeight: 'bold', fontSize: 15, color: '#111827', textAlign: 'center' }}>STT</Text>
                                <Text style={{ flex: 2.2, fontWeight: 'bold', fontSize: 15, color: '#111827', textAlign: 'left', paddingLeft: 4 }}>Quầy</Text>
                                <Text style={{ flex: 1.75, fontWeight: 'bold', fontSize: 15, color: '#111827', textAlign: 'right' }}>Tiền ứng</Text>
                                <Text style={{ flex: 1.75, fontWeight: 'bold', fontSize: 15, color: '#111827', textAlign: 'right' }}>Phí gom</Text>
                                <Text style={{ flex: 1.75, fontWeight: 'bold', fontSize: 15, color: '#111827', textAlign: 'center' }}>Thuế phí{'\n'}(1.5%)</Text>
                                <Text style={{ flex: 1.75, fontWeight: 'bold', fontSize: 15, color: '#111827', textAlign: 'right' }}>Tổng</Text>
                            </View>

                            {orders.map((order, index) => {
                                const orderDate = new Date(order.createdAt);
                                const timeStr = `${orderDate.getHours().toString().padStart(2, '0')}:${orderDate.getMinutes().toString().padStart(2, '0')}`;
                                const totalPhi = (order.phiDongHang || 0) + (order.tienThem || 0);

                                return (
                                    <View key={index} style={{ flexDirection: 'row', paddingVertical: 14, paddingHorizontal: 8, borderBottomWidth: index === orders.length - 1 ? 0 : 1, borderBottomColor: '#e5e7eb', alignItems: 'center' }}>
                                        <Text style={{ flex: 0.8, fontSize: 15, color: '#374151', textAlign: 'center' }}>{index + 1}</Text>
                                        <Text style={{ flex: 2.2, fontSize: 15, color: '#374151', textAlign: 'left', paddingLeft: 4 }}>{order.counterName || 'N/A'}</Text>
                                        <Text style={{ flex: 1.75, fontSize: 15, color: '#374151', textAlign: 'right' }}>{formatCurrency((order.tienHang || 0) + (order.tienHoaHong || 0))}</Text>
                                        <Text style={{ flex: 1.75, fontSize: 15, color: '#374151', textAlign: 'right' }}>{formatCurrency(order.tienCongGom || 0)}</Text>
                                        <Text style={{ flex: 1.75, fontSize: 15, color: '#374151', textAlign: 'center' }}>{formatCurrency(totalPhi)}</Text>
                                        <Text style={{ flex: 1.75, fontSize: 15, fontWeight: '600', color: '#2563eb', textAlign: 'right' }}>{formatCurrency(order.tongTienHoaDon || 0)}</Text>
                                    </View>
                                );
                            })}

                            <View style={{ flexDirection: 'row', paddingVertical: 14, paddingHorizontal: 8, borderBottomWidth: 0, alignItems: 'center', backgroundColor: '#fafafa' }}>
                                <Text style={{ flex: 3, fontWeight: 'bold', fontSize: 16, color: '#111827', textAlign: 'center' }}>TỔNG {orders.length} ĐƠN</Text>
                                <Text style={{ flex: 1.75, fontWeight: 'bold', fontSize: 15, color: '#111827', textAlign: 'right' }}>{formatCurrency(stats.totalTienUng)}</Text>
                                <Text style={{ flex: 1.75, fontWeight: 'bold', fontSize: 15, color: '#111827', textAlign: 'right' }}>{formatCurrency(stats.totalPhiGom)}</Text>
                                <Text style={{ flex: 1.75, fontWeight: 'bold', fontSize: 15, color: '#111827', textAlign: 'center' }}>{formatCurrency(stats.totalThuePhi)}</Text>
                                <Text style={{ flex: 1.75, fontWeight: 'bold', fontSize: 16, color: '#2563eb', textAlign: 'right' }}>{formatCurrency(stats.totalAmount)}</Text>
                            </View>

                            {/* Summary Totals Table */}
                            <View style={{ marginTop: 8, borderTopWidth: 2, borderTopColor: '#2563eb' }}>
                                <View style={{ backgroundColor: '#f8fafc', padding: 12 }}>
                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
                                        <Text style={{ fontSize: 20, color: '#4b5563', fontWeight: '500' }}>Đóng gửi hàng</Text>
                                        <Text style={{ fontSize: 20, fontWeight: '700', color: '#111827' }}>{formatCurrency(Number(dongGui) || 0)}</Text>
                                    </View>
                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
                                        <Text style={{ fontSize: 20, color: '#4b5563', fontWeight: '500' }}>Số dư của khách</Text>
                                        <Text style={{ fontSize: 20, fontWeight: '700', color: '#10b981' }}>{formatCurrency(Number(soDuKhach) || 0)}</Text>
                                    </View>
                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 }}>
                                        <Text style={{ fontSize: 20, color: '#4b5563', fontWeight: '500' }}>Nợ cũ của khách</Text>
                                        <Text style={{ fontSize: 20, fontWeight: '700', color: '#ef4444' }}>{formatCurrency(Number(noKhach) || 0)}</Text>
                                    </View>
                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingTop: 16, borderTopWidth: 2, borderTopColor: '#cbd5e1' }}>
                                        <Text style={{ fontSize: 22, fontWeight: 'bold', color: '#111827', textTransform: 'uppercase' }}>Khách cần thanh toán</Text>
                                        <Text style={{ fontSize: 26, fontWeight: '900', color: '#2563eb' }}>{formatCurrency(Number(tongThanhToan) || 0)}</Text>
                                    </View>
                                </View>
                            </View>

                            {/* Footer */}
                            <View style={{ alignItems: 'center', paddingTop: 16, borderTopWidth: 1, borderTopColor: '#e5e7eb' }}>
                                <Text style={{ fontSize: 13, color: '#6b7280', fontStyle: 'italic', marginBottom: 4 }}>Cảm ơn quý khách đã sử dụng dịch vụ!</Text>
                            </View>
                        </View>
                    </ViewShot>
                </View >
            )
            }

            {/* Preview Modal */}
            <Modal
                visible={showPreview}
                animationType="slide"
                onRequestClose={() => setShowPreview(false)}
            >
                <View style={{ flex: 1, backgroundColor: '#F2F2F7' }}>
                    {/* Modal Header */}
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: 60, paddingBottom: 15, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#E5E5EA' }}>
                        <TouchableOpacity onPress={() => setShowPreview(false)} style={{ width: 40, height: 40, justifyContent: 'center' }}>
                            <Ionicons name="close" size={28} color="#000" />
                        </TouchableOpacity>
                        <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#000' }}>Xem trước hóa đơn</Text>
                        <TouchableOpacity
                            onPress={async () => {
                                setShowPreview(false);
                                await new Promise(r => setTimeout(r, 300));
                                handleExportImage();
                            }}
                            disabled={isExportingImage}
                            style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: theme?.colors?.primary?.default || '#007AFF', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 }}
                        >
                            {isExportingImage ? (
                                <ActivityIndicator size="small" color="#FFF" />
                            ) : (
                                <Ionicons name="share-outline" size={18} color="#FFF" />
                            )}
                            <Text style={{ color: '#FFF', fontWeight: '600', fontSize: 14, marginLeft: 4 }}>Chia sẻ</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Preview Content */}
                    <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
                        <View style={{ backgroundColor: '#fff', borderRadius: 12, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 }}>
                            {/* Header */}
                            <View style={{ alignItems: 'center', marginBottom: 20, paddingBottom: 16, borderBottomWidth: 2, borderBottomColor: '#2563eb' }}>
                                <Text style={{ fontSize: 28, fontWeight: '900', color: '#2563eb', marginBottom: 4, textTransform: 'uppercase' }}>Quân Gom Ninh Hiệp</Text>
                                <Text style={{ fontSize: 13, color: '#4b5563', marginBottom: 2 }}>Ninh Hiệp, Gia Lâm, Hà Nội</Text>
                                <Text style={{ fontSize: 18, fontWeight: '900', color: '#111827', marginBottom: 8 }}>0922 238 683</Text>
                                <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#111827', marginTop: 8 }}>TỔNG HỢP HÓA ĐƠN</Text>
                            </View>

                            {/* Meta Info */}
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24 }}>
                                <View style={{ backgroundColor: '#f0f4ff', padding: 12, borderRadius: 8, flex: 1, marginRight: 16 }}>
                                    <Text style={{ fontSize: 15, color: '#111827' }}>
                                        <Text style={{ fontWeight: 'bold', color: '#2563eb' }}>Khách hàng:</Text> {customer.name}
                                    </Text>
                                    {customer.phone && (
                                        <Text style={{ fontSize: 14, color: '#4b5563', marginTop: 4 }}>
                                            <Text style={{ fontWeight: 'bold' }}>SĐT:</Text> {customer.phone}
                                        </Text>
                                    )}
                                </View>
                                <View style={{ alignItems: 'flex-end', justifyContent: 'center' }}>
                                    <Text style={{ fontSize: 14, color: '#111827', marginBottom: 4 }}>
                                        <Text style={{ fontWeight: 'bold' }}>Ngày:</Text> {formatDate(selectedDate)}
                                    </Text>
                                    <Text style={{ fontSize: 14, color: '#111827' }}>
                                        <Text style={{ fontWeight: 'bold' }}>Số đơn:</Text> {orders.length}
                                    </Text>
                                </View>
                            </View>

                            {/* Table Header */}
                            <View style={{ flexDirection: 'row', backgroundColor: '#f0f4ff', paddingVertical: 10, paddingHorizontal: 8, borderBottomWidth: 2, borderBottomColor: '#2563eb', alignItems: 'center' }}>
                                <Text style={{ flex: 0.8, fontWeight: 'bold', fontSize: 13, color: '#111827', textAlign: 'center' }}>STT</Text>
                                <Text style={{ flex: 2.2, fontWeight: 'bold', fontSize: 13, color: '#111827', textAlign: 'left', paddingLeft: 4 }}>Quầy</Text>
                                <Text style={{ flex: 1.75, fontWeight: 'bold', fontSize: 13, color: '#111827', textAlign: 'right' }}>Tiền ứng</Text>
                                <Text style={{ flex: 1.75, fontWeight: 'bold', fontSize: 13, color: '#111827', textAlign: 'right' }}>Phí gom</Text>
                                <Text style={{ flex: 1.75, fontWeight: 'bold', fontSize: 13, color: '#111827', textAlign: 'center' }}>Thuế phí{'\n'}(1.5%)</Text>
                                <Text style={{ flex: 1.75, fontWeight: 'bold', fontSize: 13, color: '#111827', textAlign: 'right' }}>Tổng</Text>
                            </View>

                            {orders.map((order, index) => {
                                const orderDate = new Date(order.createdAt);
                                const timeStr = `${orderDate.getHours().toString().padStart(2, '0')}:${orderDate.getMinutes().toString().padStart(2, '0')}`;
                                const totalPhi = (order.phiDongHang || 0) + (order.tienThem || 0);

                                return (
                                    <View key={index} style={{ flexDirection: 'row', paddingVertical: 12, paddingHorizontal: 8, borderBottomWidth: index === orders.length - 1 ? 0 : 1, borderBottomColor: '#e5e7eb', alignItems: 'center' }}>
                                        <Text style={{ flex: 0.8, fontSize: 13, color: '#374151', textAlign: 'center' }}>{index + 1}</Text>
                                        <Text style={{ flex: 2.2, fontSize: 13, color: '#374151', textAlign: 'left', paddingLeft: 4 }}>{order.counterName || 'N/A'}</Text>
                                        <Text style={{ flex: 1.75, fontSize: 13, color: '#374151', textAlign: 'right' }}>{formatCurrency((order.tienHang || 0) + (order.tienHoaHong || 0))}</Text>
                                        <Text style={{ flex: 1.75, fontSize: 13, color: '#374151', textAlign: 'right' }}>{formatCurrency(order.tienCongGom || 0)}</Text>
                                        <Text style={{ flex: 1.75, fontSize: 13, color: '#374151', textAlign: 'center' }}>{formatCurrency(totalPhi)}</Text>
                                        <Text style={{ flex: 1.75, fontSize: 13, fontWeight: '600', color: '#2563eb', textAlign: 'right' }}>{formatCurrency(order.tongTienHoaDon || 0)}</Text>
                                    </View>
                                );
                            })}

                            <View style={{ flexDirection: 'row', paddingVertical: 12, paddingHorizontal: 8, borderBottomWidth: 0, alignItems: 'center', backgroundColor: '#fafafa' }}>
                                <Text style={{ flex: 3, fontWeight: 'bold', fontSize: 14, color: '#111827', textAlign: 'center' }}>TỔNG {orders.length} ĐƠN</Text>
                                <Text style={{ flex: 1.75, fontWeight: 'bold', fontSize: 13, color: '#111827', textAlign: 'right' }}>{formatCurrency(stats.totalTienUng)}</Text>
                                <Text style={{ flex: 1.75, fontWeight: 'bold', fontSize: 13, color: '#111827', textAlign: 'right' }}>{formatCurrency(stats.totalPhiGom)}</Text>
                                <Text style={{ flex: 1.75, fontWeight: 'bold', fontSize: 13, color: '#111827', textAlign: 'center' }}>{formatCurrency(stats.totalThuePhi)}</Text>
                                <Text style={{ flex: 1.75, fontWeight: 'bold', fontSize: 14, color: '#2563eb', textAlign: 'right' }}>{formatCurrency(stats.totalAmount)}</Text>
                            </View>

                            {/* Summary Totals Table */}
                            <View style={{ marginTop: 8, borderTopWidth: 2, borderTopColor: '#2563eb' }}>
                                <View style={{ backgroundColor: '#f8fafc', padding: 16 }}>
                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
                                        <Text style={{ fontSize: 16, color: '#4b5563', fontWeight: '500' }}>Đóng gửi hàng</Text>
                                        <Text style={{ fontSize: 16, fontWeight: '700', color: '#111827' }}>{formatCurrency(Number(dongGui) || 0)}</Text>
                                    </View>
                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
                                        <Text style={{ fontSize: 16, color: '#4b5563', fontWeight: '500' }}>Số dư của khách</Text>
                                        <Text style={{ fontSize: 16, fontWeight: '700', color: '#10b981' }}>{formatCurrency(Number(soDuKhach) || 0)}</Text>
                                    </View>
                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 }}>
                                        <Text style={{ fontSize: 16, color: '#4b5563', fontWeight: '500' }}>Nợ cũ của khách</Text>
                                        <Text style={{ fontSize: 16, fontWeight: '700', color: '#ef4444' }}>{formatCurrency(Number(noKhach) || 0)}</Text>
                                    </View>
                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingTop: 16, borderTopWidth: 2, borderTopColor: '#cbd5e1' }}>
                                        <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#111827', textTransform: 'uppercase' }}>Khách cần thanh toán</Text>
                                        <Text style={{ fontSize: 22, fontWeight: '900', color: '#2563eb' }}>{formatCurrency(Number(tongThanhToan) || 0)}</Text>
                                    </View>
                                </View>
                            </View>

                            {/* Footer */}
                            <View style={{ alignItems: 'center', paddingTop: 16, borderTopWidth: 1, borderTopColor: '#e5e7eb' }}>
                                <Text style={{ fontSize: 13, color: '#6b7280', fontStyle: 'italic', marginBottom: 4 }}>Cảm ơn quý khách đã sử dụng dịch vụ!</Text>
                            </View>
                        </View>
                    </ScrollView>
                </View >
            </Modal >
        </View >
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F2F2F7',
    },
    centerContent: {
        justifyContent: 'center',
        alignItems: 'center',
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
    backButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'flex-start',
    },
    title: {
        fontSize: theme?.typography?.sizes?.xl || 20,
        fontWeight: 'bold',
        color: '#000',
    },
    loadingText: {
        marginTop: 10,
        color: '#666',
    },
    listContainer: {
        padding: 16,
        paddingBottom: 40,
    },
    customerInfoCard: {
        backgroundColor: '#FFF',
        borderRadius: 12,
        padding: 20,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    customerName: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#000',
        marginBottom: 12,
    },
    customerDetailText: {
        fontSize: 15,
        color: '#444',
        marginBottom: 8,
    },
    dateSelectorContainer: {
        marginBottom: 16,
    },
    dateLabel: {
        fontSize: 15,
        fontWeight: '500',
        color: '#333',
        marginBottom: 8,
    },
    dateButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF',
        borderWidth: 1,
        borderColor: '#E5E5EA',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 8,
    },
    dateText: {
        marginLeft: 8,
        fontSize: 15,
        color: '#000',
    },
    currentDateText: {
        fontSize: 13,
        color: '#666',
        marginTop: 8,
    },
    statsCard: {
        backgroundColor: '#FFF',
        borderRadius: 12,
        padding: 20,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    statsCardTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#000',
        marginBottom: 16,
    },
    statsGrid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    statsItem: {
        flex: 1,
    },
    statsLabel: {
        fontSize: 13,
        color: '#666',
        marginBottom: 4,
    },
    statsValue: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#000',
    },
    manualFieldsContainer: {
        marginTop: 12,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#E5E5EA',
    },
    manualFieldsTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#111827',
        marginBottom: 8,
    },
    manualRow: {
        flexDirection: 'row',
        marginBottom: 8,
    },
    manualField: {
        flex: 1,
        minWidth: 0,
    },
    manualFieldRight: {
        marginLeft: 8,
    },
    manualLabel: {
        fontSize: 13,
        color: '#4B5563',
        marginBottom: 4,
    },
    manualInput: {
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 8,
        paddingHorizontal: 10,
        paddingVertical: 8,
        fontSize: 14,
        color: '#111827',
        backgroundColor: '#FFF',
    },
    exportButton: {
        flexDirection: 'row',
        backgroundColor: theme?.colors?.primary?.default || '#007AFF',
        borderRadius: 8,
        padding: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    exportButtonText: {
        color: '#FFF',
        fontSize: 15,
        fontWeight: 'bold',
        marginLeft: 8,
    },
    listSectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#000',
        marginBottom: 12,
    },
    orderCard: {
        backgroundColor: '#FFF',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#E5E5EA',
    },
    orderCardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    counterName: {
        fontSize: 15,
        fontWeight: '600',
        color: '#000',
        marginBottom: 4,
    },
    orderTime: {
        fontSize: 13,
        color: '#666',
    },
    orderTotal: {
        fontSize: 16,
        fontWeight: 'bold',
        color: theme?.colors?.primary?.default || '#007AFF',
    },
    emptyContainer: {
        backgroundColor: '#FFF',
        borderRadius: 12,
        padding: 24,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E5E5EA',
    },
    emptyText: {
        fontSize: 15,
        color: '#666',
    },
});
