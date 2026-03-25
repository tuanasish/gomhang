import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView, ActivityIndicator, Alert, Platform, TextInput, Modal } from 'react-native';
import * as Sharing from 'expo-sharing';
import ViewShot, { captureRef } from 'react-native-view-shot';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../theme/theme';
import Button from '../../components/common/Button';
import { getOrderByIdAPI, updateOrderAPI, deleteOrderAPI } from '../../api/orders';
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

const OrderDetailScreen = () => {
    const navigation = useNavigation();
    const route = useRoute();
    const { orderId } = route.params || {};

    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isExportingImage, setIsExportingImage] = useState(false);
    const [showPreview, setShowPreview] = useState(false);
    const invoiceRef = React.useRef();
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [editForm, setEditForm] = useState({
        tienHang: 0,
        tienHoaHong: 0,
        tienCongGom: 0,
        phiDongHang: 0,
        tienThem: 0,
        loaiTienThem: '',
    });
    const [isDeleting, setIsDeleting] = useState(false);

    const [thueStr, setThueStr] = useState('');
    const currentTienHang = Number(editForm.tienHang) || 0;
    const currentTienCongGom = Number(editForm.tienCongGom) || 0;
    const thuePhanTram = thueStr ? parseFloat(thueStr.replace(',', '.')) : 0;
    const tienThue = !isNaN(thuePhanTram) && !isNaN(currentTienHang) && !isNaN(currentTienCongGom) ? Math.round((currentTienHang + currentTienCongGom) * thuePhanTram / 100) : 0;

    const formatNumberInput = (num) => {
        if (num === null || num === undefined || num === '') return '';
        return String(num).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    };

    useEffect(() => {
        loadOrder();
    }, [orderId]);

    const loadOrder = async () => {
        if (!orderId) {
            setError('Không tìm thấy mã đơn hàng');
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);
        try {
            const response = await getOrderByIdAPI(orderId);
            if (response && response.success && response.data) {
                setOrder(response.data);
            } else {
                setError('Không tìm thấy đơn hàng');
            }
        } catch (err) {
            console.error('Load order detail error:', err);
            setError('Không tìm thấy đơn hàng');
        } finally {
            setLoading(false);
        }
    };

    const formatDateTime = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        const dateStr = date.toLocaleDateString('vi-VN');
        const timeStr = date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
        return `${timeStr} - ${dateStr}`;
    };

    const formatMoney = (num) => {
        const n = Number(num) || 0;
        return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.') + '\u0111';
    };

    const handleExportImage = async () => {
        if (!order) return;
        setIsExportingImage(true);
        try {
            await new Promise(resolve => setTimeout(resolve, 500));

            if (Platform.OS === 'web') {
                try {
                    const html2canvas = require('html2canvas');
                    const element = document.getElementById('order-invoice-capture');
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
                    const a = document.createElement('a');
                    a.href = uri;
                    a.download = `hoadon_${order.id ? order.id.slice(0, 8) : 'export'}.jpg`;
                    a.click();
                } catch (webErr) {
                    console.error('Web export error:', webErr);
                    // Fallback to captureRef if html2canvas fails
                    const uri = await captureRef(invoiceRef, { format: 'jpg', quality: 0.9 });
                    const a = document.createElement('a');
                    a.href = uri;
                    a.download = `hoadon_${order.id ? order.id.slice(0, 8) : 'export'}.jpg`;
                    a.click();
                }
            } else {
                const uri = await captureRef(invoiceRef, { format: 'jpg', quality: 0.9 });
                if (await Sharing.isAvailableAsync()) {
                    await Sharing.shareAsync(uri, { mimeType: 'image/jpeg', dialogTitle: 'Chia sẻ hóa đơn' });
                } else {
                    Alert.alert('Thành công', 'Đã tạo hóa đơn ảnh.');
                }
            }
        } catch (error) {
            console.error('Error generating Image:', error);
            if (Platform.OS === 'web') {
                window.alert('Có lỗi xảy ra khi tạo Ảnh. Vui lòng thử lại.');
            } else {
                Alert.alert('Lỗi', 'Có lỗi xảy ra khi tạo Ảnh. Vui lòng thử lại.');
            }
        } finally {
            setIsExportingImage(false);
        }
    };

    const handleStartEditing = () => {
        if (!order) return;
        setEditForm({
            customerName: order.customerName || '',
            counterName: order.counterName || '',
            tienHang: order.tienHang || 0,
            tienHoaHong: order.tienHoaHong || 0,
            tienCongGom: order.tienCongGom || 0,
            phiDongHang: order.phiDongHang || 0,
            tienThem: order.tienThem || 0,
            loaiTienThem: order.loaiTienThem || '',
        });

        let initialThue = '';
        if (order.loaiTienThem && order.loaiTienThem.startsWith('Thuế')) {
            const match = order.loaiTienThem.match(/Thuế ([\d.]+)%/);
            if (match) {
                initialThue = match[1];
            }
        }
        setThueStr(initialThue);

        setError(null);
        setIsEditing(true);
    };

    const handleCancelEditing = () => {
        setIsEditing(false);
        setError(null);
    };

    const handleSaveEditing = async () => {
        if (!order) return;

        const tienHang = Number(editForm.tienHang) || 0;
        const tienHoaHong = Number(editForm.tienHoaHong) || 0;
        const tienCongGom = Number(editForm.tienCongGom) || 0;
        const phiDongHang = Number(editForm.phiDongHang) || 0;

        let finalTienThem = Number(editForm.tienThem) || 0;
        let finalLoaiTienThem = editForm.loaiTienThem?.trim() || '';

        // Tự động tính lại thuế nếu có nhập % thuế
        if (tienThue > 0 || thueStr !== '') {
            if (Math.round((tienHang + tienCongGom) * thuePhanTram / 100) > 0) {
                finalTienThem = Math.round((tienHang + tienCongGom) * thuePhanTram / 100);
                finalLoaiTienThem = `Thuế ${thuePhanTram}%`;
            } else if (finalLoaiTienThem.startsWith('Thuế')) {
                finalTienThem = 0;
                finalLoaiTienThem = '';
            }
        }

        if (isNaN(tienHang) || tienHang < 0) {
            setError('Tiền hàng không hợp lệ (phải >= 0)');
            return;
        }

        if (finalTienThem > 0 && !finalLoaiTienThem) {
            if (Platform.OS === 'web') {
                // Trên web mới hỏi confirm, mobile tiếp tục luôn
                // eslint-disable-next-line no-alert
                const shouldContinue = window.confirm('Bạn chưa nhập loại tiền thêm. Bạn có muốn tiếp tục không?');
                if (!shouldContinue) {
                    return;
                }
            }
        }

        setIsSaving(true);
        setError(null);
        try {
            const payload = {
                customerName: editForm.customerName || null,
                counterName: editForm.counterName || null,
                tienHang,
                tienHoaHong,
                tienCongGom,
                phiDongHang,
            };

            if (finalTienThem > 0) {
                payload.tienThem = finalTienThem;
                payload.loaiTienThem = finalLoaiTienThem || null;
            } else {
                payload.tienThem = 0;
                payload.loaiTienThem = null;
            }

            const response = await updateOrderAPI(order.id, payload);

            if (!response?.success || !response?.data) {
                throw new Error(response?.error || 'Lỗi sửa hóa đơn. Vui lòng thử lại.');
            }

            setOrder(response.data);
            setIsEditing(false);
        } catch (e) {
            console.error('Update order error:', e);
            setError(e.message || 'Lỗi sửa hóa đơn. Vui lòng thử lại.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteOrder = () => {
        if (!order) return;

        Alert.alert(
            "Xác nhận xóa",
            "Bạn có chắc chắn muốn xóa đơn hàng này? Thao tác này không thể hoàn tác.",
            [
                { text: "Hủy", style: "cancel" },
                {
                    text: "Xóa",
                    style: "destructive",
                    onPress: async () => {
                        setIsDeleting(true);
                        try {
                            const response = await deleteOrderAPI(order.id);
                            if (response && response.success) {
                                if (Platform.OS === 'web') {
                                    window.alert('Xóa đơn hàng thành công');
                                } else {
                                    Alert.alert('Thành công', 'Đã xóa đơn hàng');
                                }
                                navigation.goBack(); // Quay lại màn hình lịch sử
                            } else {
                                throw new Error(response?.error || 'Không thể xóa đơn hàng');
                            }
                        } catch (err) {
                            console.error('Delete order error:', err);
                            const errMsg = err.message || 'Có lỗi xảy ra khi xóa đơn hàng';
                            if (Platform.OS === 'web') {
                                window.alert(errMsg);
                            } else {
                                Alert.alert('Lỗi', errMsg);
                            }
                        } finally {
                            setIsDeleting(false);
                        }
                    }
                }
            ]
        );
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color={colors.textInfo} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Chi tiết Hóa đơn</Text>
                    <View style={{ width: 24 }} />
                </View>
                <View style={styles.centerContainer}>
                    <ActivityIndicator size="large" color={colors.primary} />
                    <Text style={styles.loadingText}>Đang tải thông tin đơn hàng...</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={colors.textInfo} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Chi tiết Hóa đơn</Text>
                <View style={{ width: 24 }} />
            </View>

            {error ? (
                <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>{error}</Text>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.errorBackBtn}>
                        <Text style={styles.errorBackText}>Quay lại</Text>
                    </TouchableOpacity>
                </View>
            ) : order && (
                <>
                    <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                        {/* General Info */}
                        <View style={styles.cardSection}>
                            <Text style={styles.customerName}>Khách hàng: {order.customerName || 'N/A'}</Text>
                            <View style={styles.metaInfo}>
                                <Text style={styles.metaText}>Mã đơn: #{order.id.slice(0, 8)}</Text>
                                <Text style={styles.metaText}>Quầy: {order.counterName || 'N/A'}</Text>
                                <Text style={styles.metaText}>Tạo lúc: {formatDateTime(order.createdAt)} | NV: {order.staffName || 'N/A'}</Text>
                            </View>
                        </View>

                        {/* Money Details */}
                        <View style={styles.cardSection}>
                            <Text style={styles.sectionTitle}>Chi tiết tiền</Text>

                            <View style={styles.moneyRow}>
                                <Text style={styles.moneyLabel}>Tiền hàng (trả cho quầy)</Text>
                                <Text style={styles.moneyValue}>{formatMoney(order.tienHang)}</Text>
                            </View>

                            {(order.tienHoaHong > 0) && (
                                <View style={styles.moneyRow}>
                                    <Text style={styles.moneyLabel}>Hoa hồng</Text>
                                    <Text style={styles.moneyValue}>{formatMoney(order.tienHoaHong)}</Text>
                                </View>
                            )}

                            <View style={styles.moneyRow}>
                                <Text style={styles.moneyLabel}>Phí gom</Text>
                                <Text style={styles.moneyValue}>{formatMoney(order.tienCongGom)}</Text>
                            </View>

                            <View style={styles.moneyRow}>
                                <Text style={styles.moneyLabel}>Phí đóng hàng</Text>
                                <Text style={styles.moneyValue}>{formatMoney(order.phiDongHang)}</Text>
                            </View>


                            {(order.tienThem !== undefined && order.tienThem !== null && order.tienThem > 0) && (
                                <View style={[styles.moneyRow, styles.borderTop]}>
                                    <Text style={styles.moneyLabel}>{order.loaiTienThem || 'Tiền thêm'}</Text>
                                    <Text style={styles.moneyValue}>{formatMoney(order.tienThem)}</Text>
                                </View>
                            )}

                            <View style={[styles.moneyRow, styles.borderTop, styles.totalRow]}>
                                <Text style={styles.totalLabel}>Tổng tiền hóa đơn</Text>
                                <Text style={styles.totalValue}>{formatMoney(order.tongTienHoaDon)}</Text>
                            </View>

                            {isEditing && (
                                <View style={styles.editSection}>
                                    <Text style={styles.editTitle}>Sửa hóa đơn</Text>

                                    <View style={styles.editFieldGroup}>
                                        <Text style={styles.editLabel}>Tên khách hàng</Text>
                                        <TextInput
                                            value={editForm.customerName}
                                            onChangeText={(text) =>
                                                setEditForm((prev) => ({ ...prev, customerName: text }))
                                            }
                                            style={styles.input}
                                            placeholder="Nhập tên khách hàng"
                                        />
                                    </View>

                                    <View style={styles.editFieldGroup}>
                                        <Text style={styles.editLabel}>Tên quầy</Text>
                                        <TextInput
                                            value={editForm.counterName}
                                            onChangeText={(text) =>
                                                setEditForm((prev) => ({ ...prev, counterName: text }))
                                            }
                                            style={styles.input}
                                            placeholder="Nhập tên quầy"
                                        />
                                    </View>

                                    <View style={styles.editFieldGroup}>
                                        <Text style={styles.editLabel}>Tiền hàng (VNĐ) *</Text>
                                        <TextInput
                                            keyboardType="numeric"
                                            value={formatNumberInput(editForm.tienHang)}
                                            onChangeText={(text) =>
                                                setEditForm((prev) => ({ ...prev, tienHang: text.replace(/\./g, '').replace(/[^0-9]/g, '') }))
                                            }
                                            style={styles.input}
                                        />
                                    </View>

                                    <View style={styles.editFieldGroup}>
                                        <Text style={styles.editLabel}>Hoa hồng (VNĐ)</Text>
                                        <TextInput
                                            keyboardType="numeric"
                                            value={formatNumberInput(editForm.tienHoaHong)}
                                            onChangeText={(text) =>
                                                setEditForm((prev) => ({ ...prev, tienHoaHong: text.replace(/\./g, '').replace(/[^0-9]/g, '') }))
                                            }
                                            style={styles.input}
                                        />
                                    </View>

                                    <View style={styles.editFieldGroup}>
                                        <Text style={styles.editLabel}>Phí gom (VNĐ)</Text>
                                        <TextInput
                                            keyboardType="numeric"
                                            value={formatNumberInput(editForm.tienCongGom)}
                                            onChangeText={(text) =>
                                                setEditForm((prev) => ({ ...prev, tienCongGom: text.replace(/\./g, '').replace(/[^0-9]/g, '') }))
                                            }
                                            style={styles.input}
                                        />
                                    </View>


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

                                    <View style={styles.editButtonsRow}>
                                        <TouchableOpacity
                                            style={[styles.secondaryButton, isSaving && styles.disabledButton]}
                                            onPress={handleCancelEditing}
                                            disabled={isSaving}
                                        >
                                            <Text style={styles.secondaryButtonText}>Hủy</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={[styles.primaryButton, isSaving && styles.disabledButton]}
                                            onPress={handleSaveEditing}
                                            disabled={isSaving}
                                        >
                                            {isSaving ? (
                                                <ActivityIndicator color="#fff" />
                                            ) : (
                                                <Text style={styles.primaryButtonText}>Lưu thay đổi</Text>
                                            )}
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            )}
                        </View>
                    </ScrollView>

                    {/* Bottom Actions */}
                    <View style={styles.bottomActions}>
                        <Button
                            title={isEditing ? 'Đang sửa hóa đơn' : 'Sửa hóa đơn'}
                            onPress={handleStartEditing}
                            loading={isSaving}
                            disabled={isExportingImage || isSaving || !order}
                            variant="outline"
                            style={styles.actionButton}
                        />
                        <Button
                            title="Xóa hóa đơn"
                            onPress={handleDeleteOrder}
                            loading={isDeleting}
                            disabled={isExportingImage || isDeleting || isSaving || isEditing || !order}
                            style={[styles.actionButton, { backgroundColor: '#ef4444' }]}
                        />
                        <Button
                            title="Xem trước hóa đơn"
                            onPress={() => setShowPreview(true)}
                            icon={<Ionicons name="eye-outline" size={20} color="white" />}
                            style={styles.actionButton}
                        />
                    </View>
                </>
            )}

            {/* Hidden Receipt for Image Export */}
            {order && (
                <View style={{ position: 'absolute', top: -10000, left: -10000, zIndex: -1 }} pointerEvents="none" collapsable={false}>
                    <ViewShot ref={invoiceRef} options={{ format: 'jpg', quality: 0.9 }}>
                        <View
                            nativeID="order-invoice-capture"
                            style={{ width: 450, backgroundColor: '#fff', padding: 20, paddingBottom: 48 }}
                            collapsable={false}
                        >
                            <View style={{ alignItems: 'center', marginBottom: 20 }}>
                                <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#000' }}>Gom Hàng Ninh Hiệp</Text>
                                <Text style={{ fontSize: 14, color: '#000', marginTop: 4 }}>Ninh Hiệp, Gia Lâm, Hà Nội - 0922238683</Text>
                                <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#2563eb', marginTop: 15 }}>HÓA ĐƠN BÁN HÀNG</Text>
                            </View>

                            <View style={{ alignItems: 'flex-end', marginBottom: 15 }}>
                                <Text style={{ fontSize: 14, color: '#444' }}>Ngày: {formatDateTime(order.createdAt || order.ngayLamGom)}</Text>
                            </View>

                            <View style={{ marginBottom: 20 }}>
                                <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#2563eb', marginBottom: 8 }}>Thông tin khách hàng</Text>
                                <Text style={{ fontSize: 15, color: '#000', marginBottom: 4 }}><Text style={{ fontWeight: 'bold' }}>Tên:</Text> {order.customerName || 'N/A'}</Text>
                                {order.customerPhone ? <Text style={{ fontSize: 15, color: '#000', marginBottom: 4 }}><Text style={{ fontWeight: 'bold' }}>SĐT:</Text> {order.customerPhone}</Text> : null}
                                {order.counterName ? <Text style={{ fontSize: 15, color: '#000', marginBottom: 4 }}><Text style={{ fontWeight: 'bold' }}>Quầy/Vị trí:</Text> {order.counterName}</Text> : null}
                            </View>

                            <View style={{ borderWidth: 1, borderColor: '#e0e0e0', marginBottom: 20 }}>
                                <View style={{ flexDirection: 'row', backgroundColor: '#f0f4ff', borderBottomWidth: 1, borderColor: '#2563eb', padding: 8 }}>
                                    <Text style={{ flex: 1, fontWeight: 'bold', color: '#1a1a1a' }}>STT</Text>
                                    <Text style={{ flex: 4, fontWeight: 'bold', color: '#1a1a1a' }}>Mô tả</Text>
                                    <Text style={{ flex: 3, fontWeight: 'bold', color: '#1a1a1a', textAlign: 'right' }}>Thành tiền</Text>
                                </View>
                                <View style={{ flexDirection: 'row', padding: 8 }}>
                                    <Text style={{ flex: 1, color: '#000' }}>1</Text>
                                    <Text style={{ flex: 4, color: '#000' }}>Dịch vụ gom hàng</Text>
                                    <Text style={{ flex: 3, color: '#000', textAlign: 'right' }}>{(order.tongTienHoaDon || 0).toLocaleString('vi-VN')}đ</Text>
                                </View>
                            </View>

                            <View style={{ marginBottom: 20 }}>
                                <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#2563eb', marginBottom: 8 }}>Chi tiết thanh toán</Text>

                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                                    <Text style={{ fontSize: 15, fontWeight: '600', color: '#333' }}>Tiền hàng:</Text>
                                    <Text style={{ fontSize: 15, color: '#000' }}>{((order.tienHang || 0) + (order.tienHoaHong || 0)).toLocaleString('vi-VN')}đ</Text>
                                </View>
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                                    <Text style={{ fontSize: 15, fontWeight: '600', color: '#333' }}>Phí gom:</Text>
                                    <Text style={{ fontSize: 15, color: '#000' }}>{(order.tienCongGom || 0).toLocaleString('vi-VN')}đ</Text>
                                </View>
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                                    <Text style={{ fontSize: 15, fontWeight: '600', color: '#333' }}>Phí đóng hàng:</Text>
                                    <Text style={{ fontSize: 15, color: '#000' }}>{(order.phiDongHang || 0).toLocaleString('vi-VN')}đ</Text>
                                </View>
                                {(order.tienThem !== undefined && order.tienThem !== null && order.tienThem > 0) ? (
                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                                        <Text style={{ fontSize: 15, fontWeight: '600', color: '#333' }}>{order.loaiTienThem || 'Tiền thêm'}:</Text>
                                        <Text style={{ fontSize: 15, color: '#000' }}>{(order.tienThem || 0).toLocaleString('vi-VN')}đ</Text>
                                    </View>
                                ) : null}

                                <View style={{ borderBottomWidth: 2, borderColor: '#1a1a1a', marginVertical: 10 }} />

                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginVertical: 8 }}>
                                    <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#2563eb' }}>TỔNG TIỀN:</Text>
                                    <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#2563eb' }}>{(order.tongTienHoaDon || 0).toLocaleString('vi-VN')}đ</Text>
                                </View>
                            </View>

                            <View style={{ alignItems: 'center', marginTop: 20, borderTopWidth: 1, borderColor: '#e0e0e0', paddingTop: 15 }}>
                                <Text style={{ fontSize: 14, color: '#333', marginBottom: 4 }}>Cảm ơn quý khách đã sử dụng dịch vụ!</Text>
                                <Text style={{ fontSize: 14, color: '#333' }}>Hotline hỗ trợ: 0922238683</Text>
                            </View>
                        </View>
                    </ViewShot>
                </View>
            )}
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
                            style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.primary, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 }}
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
                        <View style={{ backgroundColor: '#fff', borderRadius: 12, padding: 20, ...shadows.md }}>
                            <View style={{ alignItems: 'center', marginBottom: 20 }}>
                                <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#000' }}>Gom Hàng Ninh Hiệp</Text>
                                <Text style={{ fontSize: 14, color: '#000', marginTop: 4 }}>Ninh Hiệp, Gia Lâm, Hà Nội - 0922238683</Text>
                                <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#2563eb', marginTop: 15 }}>HÓA ĐƠN BÁN HÀNG</Text>
                            </View>

                            <View style={{ alignItems: 'flex-end', marginBottom: 15 }}>
                                <Text style={{ fontSize: 14, color: '#444' }}>Ngày: {formatDateTime(order?.createdAt || order?.ngayLamGom)}</Text>
                            </View>

                            <View style={{ marginBottom: 20 }}>
                                <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#2563eb', marginBottom: 8 }}>Thông tin khách hàng</Text>
                                <Text style={{ fontSize: 15, color: '#000', marginBottom: 4 }}><Text style={{ fontWeight: 'bold' }}>Tên:</Text> {order?.customerName || 'N/A'}</Text>
                                {order?.customerPhone ? <Text style={{ fontSize: 15, color: '#000', marginBottom: 4 }}><Text style={{ fontWeight: 'bold' }}>SĐT:</Text> {order?.customerPhone}</Text> : null}
                                {order?.counterName ? <Text style={{ fontSize: 15, color: '#000', marginBottom: 4 }}><Text style={{ fontWeight: 'bold' }}>Quầy/Vị trí:</Text> {order?.counterName}</Text> : null}
                            </View>

                            <View style={{ borderWidth: 1, borderColor: '#e0e0e0', marginBottom: 20 }}>
                                <View style={{ flexDirection: 'row', backgroundColor: '#f0f4ff', borderBottomWidth: 1, borderColor: '#2563eb', padding: 8 }}>
                                    <Text style={{ flex: 1, fontWeight: 'bold', color: '#1a1a1a' }}>STT</Text>
                                    <Text style={{ flex: 4, fontWeight: 'bold', color: '#1a1a1a' }}>Mô tả</Text>
                                    <Text style={{ flex: 3, fontWeight: 'bold', color: '#1a1a1a', textAlign: 'right' }}>Thành tiền</Text>
                                </View>
                                <View style={{ flexDirection: 'row', padding: 8 }}>
                                    <Text style={{ flex: 1, color: '#000' }}>1</Text>
                                    <Text style={{ flex: 4, color: '#000' }}>Dịch vụ gom hàng</Text>
                                    <Text style={{ flex: 3, color: '#000', textAlign: 'right' }}>{(order?.tongTienHoaDon || 0).toLocaleString('vi-VN')}đ</Text>
                                </View>
                            </View>

                            <View style={{ marginBottom: 20 }}>
                                <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#2563eb', marginBottom: 8 }}>Chi tiết thanh toán</Text>

                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                                    <Text style={{ fontSize: 15, fontWeight: '600', color: '#333' }}>Tiền hàng:</Text>
                                    <Text style={{ fontSize: 15, color: '#000' }}>{((order?.tienHang || 0) + (order?.tienHoaHong || 0)).toLocaleString('vi-VN')}đ</Text>
                                </View>
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                                    <Text style={{ fontSize: 15, fontWeight: '600', color: '#333' }}>Phí gom:</Text>
                                    <Text style={{ fontSize: 15, color: '#000' }}>{(order?.tienCongGom || 0).toLocaleString('vi-VN')}đ</Text>
                                </View>
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                                    <Text style={{ fontSize: 15, fontWeight: '600', color: '#333' }}>Phí đóng hàng:</Text>
                                    <Text style={{ fontSize: 15, color: '#000' }}>{(order?.phiDongHang || 0).toLocaleString('vi-VN')}đ</Text>
                                </View>
                                {(order?.tienThem !== undefined && order?.tienThem !== null && order?.tienThem > 0) ? (
                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                                        <Text style={{ fontSize: 15, fontWeight: '600', color: '#333' }}>{order?.loaiTienThem || 'Tiền thêm'}:</Text>
                                        <Text style={{ fontSize: 15, color: '#000' }}>{(order?.tienThem || 0).toLocaleString('vi-VN')}đ</Text>
                                    </View>
                                ) : null}

                                <View style={{ borderBottomWidth: 2, borderColor: '#1a1a1a', marginVertical: 10 }} />

                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginVertical: 8 }}>
                                    <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#2563eb' }}>TỔNG TIỀN:</Text>
                                    <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#2563eb' }}>{(order?.tongTienHoaDon || 0).toLocaleString('vi-VN')}đ</Text>
                                </View>
                            </View>

                            <View style={{ alignItems: 'center', marginTop: 20, borderTopWidth: 1, borderColor: '#e0e0e0', paddingTop: 15 }}>
                                <Text style={{ fontSize: 14, color: '#333', marginBottom: 4 }}>Cảm ơn quý khách đã sử dụng dịch vụ!</Text>
                                <Text style={{ fontSize: 14, color: '#333' }}>Hotline hỗ trợ: 0922238683</Text>
                            </View>
                        </View>
                    </ScrollView>
                </View>
            </Modal>
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
    centerContainer: {
        flex: 1,
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
        marginBottom: spacing.md,
    },
    errorBackText: {
        color: colors.error,
        textAlign: 'center',
        textDecorationLine: 'underline',
    },
    scrollContent: {
        flex: 1,
    },
    cardSection: {
        backgroundColor: '#fff',
        padding: spacing.lg,
        marginBottom: spacing.sm,
        borderBottomWidth: 1,
        borderBottomColor: colors.gray200,
    },
    customerName: {
        fontSize: typography.sizes.xl,
        fontWeight: typography.weights.bold,
        color: colors.gray900,
        marginBottom: spacing.sm,
    },
    metaInfo: {
        gap: 4,
    },
    metaText: {
        fontSize: typography.sizes.sm,
        color: colors.gray500,
    },
    sectionTitle: {
        fontSize: typography.sizes.md,
        fontWeight: typography.weights.semibold,
        color: colors.gray900,
        marginBottom: spacing.md,
    },
    moneyRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: spacing.sm,
    },
    borderTop: {
        borderTopWidth: 1,
        borderTopColor: colors.gray200,
        marginTop: spacing.xs,
        paddingTop: spacing.sm,
    },
    totalRow: {
        marginTop: spacing.md,
        paddingTop: spacing.md,
    },
    moneyLabel: {
        fontSize: typography.sizes.md,
        color: colors.gray600,
    },
    moneyValue: {
        fontSize: typography.sizes.md,
        color: colors.gray900,
    },
    totalLabel: {
        fontSize: typography.sizes.md,
        fontWeight: typography.weights.bold,
        color: colors.gray600,
    },
    totalValue: {
        fontSize: typography.sizes.lg,
        fontWeight: typography.weights.bold,
        color: colors.gray900,
    },
    bottomActions: {
        backgroundColor: '#fff',
        padding: spacing.lg,
        borderTopWidth: 1,
        borderTopColor: colors.gray200,
        gap: spacing.sm,
        ...shadows.md,
    },
    actionButton: {
        // marginBottom: spacing.sm,
    },
    editSection: {
        marginTop: spacing.lg,
        borderTopWidth: 1,
        borderTopColor: colors.gray200,
        paddingTop: spacing.lg,
        gap: spacing.sm,
    },
    editTitle: {
        fontSize: typography.sizes.md,
        fontWeight: typography.weights.semibold,
        color: colors.gray900,
        marginBottom: spacing.sm,
    },
    editFieldGroup: {
        marginBottom: spacing.sm,
    },
    editLabel: {
        fontSize: typography.sizes.sm,
        color: colors.gray600,
        marginBottom: spacing.xs,
    },
    input: {
        borderWidth: 1,
        borderColor: colors.gray200,
        borderRadius: borderRadius.md,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        fontSize: typography.sizes.md,
        color: colors.gray900,
        backgroundColor: '#fff',
    },
    editButtonsRow: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        marginTop: spacing.md,
        gap: spacing.sm,
    },
    secondaryButton: {
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderRadius: borderRadius.md,
        borderWidth: 1,
        borderColor: colors.gray300,
        backgroundColor: '#fff',
    },
    secondaryButtonText: {
        color: colors.gray700,
        fontSize: typography.sizes.sm,
        fontWeight: typography.weights.semibold,
    },
    primaryButton: {
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderRadius: borderRadius.md,
        backgroundColor: colors.primary,
    },
    primaryButtonText: {
        color: '#fff',
        fontSize: typography.sizes.sm,
        fontWeight: typography.weights.semibold,
    },
    disabledButton: {
        opacity: 0.6,
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

export default OrderDetailScreen;
