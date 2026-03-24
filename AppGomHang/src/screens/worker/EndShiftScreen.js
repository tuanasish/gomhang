import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { showError } from '../../utils/errorHelper';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../theme/theme';
import Button from '../../components/common/Button';
import Loading from '../../components/common/Loading';
import { getCurrentShiftAPI, endShiftAPI } from '../../api/shifts';

export default function EndShiftScreen() {
    const navigation = useNavigation();
    const [loading, setLoading] = useState(true);
    const [isEnding, setIsEnding] = useState(false);
    const [shift, setShift] = useState(null);

    useEffect(() => {
        const fetchShift = async () => {
            try {
                const currentShift = await getCurrentShiftAPI();
                if (currentShift) {
                    // map backend fields to UI fields if necessary, or pass straight through
                    // backend: tongTienHangDaTra, tienGiaoCa, quyConLai
                    setShift({
                        id: currentShift.id,
                        tienGiaoCaBanDau: currentShift.tienGiaoCa || 0,
                        tongTienHangDaTra: currentShift.tongTienHangDaTra || 0,
                        soDuCuoiCa: currentShift.quyConLai || 0,
                    });
                }
            } catch (error) {
                console.error('Failed to load shift for ending:', error);
                showError(error, 'tải thông tin ca làm việc');
            } finally {
                setLoading(false);
            }
        };
        fetchShift();
    }, []);

    const handleEndShift = () => {
        Alert.alert(
            'Xác nhận kết ca',
            'Bạn có chắc chắn muốn kết thúc ca làm việc này?',
            [
                { text: 'Hủy', style: 'cancel' },
                {
                    text: 'Đồng ý',
                    style: 'destructive',
                    onPress: async () => {
                        setIsEnding(true);
                        try {
                            if (shift && shift.id) {
                                await endShiftAPI(shift.id);
                                Alert.alert('Thành công', 'Đã kết thúc ca làm việc.');
                                navigation.replace('StartShift'); // Quay lại màn hình chờ ca mới (hoặc Home tùy logic)
                            }
                        } catch (error) {
                            showError(error, 'kết thúc ca');
                        } finally {
                            setIsEnding(false);
                        }
                    }
                },
            ]
        );
    };

    if (loading) {
        return (
            <View style={styles.centerContainer}>
                <Loading text="Đang tải dữ liệu..." />
            </View>
        );
    }

    if (!shift) {
        return (
            <View style={styles.centerContainer}>
                <Text style={styles.errorText}>Không tìm thấy ca làm việc. Vui lòng liên hệ quản lý.</Text>
                <Button title="Quay lại" onPress={() => navigation.goBack()} variant="outline" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Báo Cáo và Kết Thúc Ca</Text>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                <Text style={styles.description}>Tóm tắt hiệu suất và dòng tiền trong ca làm việc.</Text>

                <View style={styles.card}>
                    <View style={styles.row}>
                        <Text style={styles.label}>Tiền giao ca ban đầu</Text>
                        <Text style={styles.value}>{shift.tienGiaoCaBanDau.toLocaleString('vi-VN')}đ</Text>
                    </View>

                    <View style={styles.row}>
                        <Text style={styles.label}>Tổng tiền hàng đã trả (đã mua)</Text>
                        <Text style={[styles.value, { color: theme.colors.error }]}>
                            -{shift.tongTienHangDaTra.toLocaleString('vi-VN')}đ
                        </Text>
                    </View>

                    <View style={[styles.row, styles.totalRow]}>
                        <Text style={styles.totalLabel}>Số dư cuối ca</Text>
                        <Text style={styles.totalValue}>{shift.soDuCuoiCa.toLocaleString('vi-VN')}đ</Text>
                    </View>
                </View>

            </ScrollView>

            {/* Footer */}
            <View style={styles.footer}>
                <Button
                    title="Xác nhận kết ca"
                    onPress={handleEndShift}
                    loading={isEnding}
                    disabled={isEnding}
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
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        backgroundColor: theme.colors.background.light,
    },
    header: {
        backgroundColor: theme.colors.surface.light,
        paddingTop: 60,
        paddingBottom: 16,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: theme.colors.text.primary,
    },
    scrollContent: {
        padding: 16,
    },
    description: {
        fontSize: 14,
        color: theme.colors.text.secondary,
        marginBottom: 24,
        textAlign: 'center',
    },
    card: {
        backgroundColor: theme.colors.surface.light,
        borderRadius: theme.borderRadius.lg,
        padding: 16,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 12,
    },
    label: {
        fontSize: 14,
        color: theme.colors.text.secondary,
    },
    value: {
        fontSize: 16,
        fontWeight: '500',
        color: theme.colors.text.primary,
    },
    totalRow: {
        borderTopWidth: 1,
        borderTopColor: theme.colors.border,
        marginTop: 8,
        paddingTop: 16,
    },
    totalLabel: {
        fontSize: 16,
        fontWeight: 'bold',
        color: theme.colors.text.primary,
    },
    totalValue: {
        fontSize: 20,
        fontWeight: 'bold',
        color: theme.colors.text.primary,
    },
    errorText: {
        color: theme.colors.text.secondary,
        marginBottom: 16,
        textAlign: 'center',
    },
    footer: {
        padding: 16,
        backgroundColor: theme.colors.surface.light,
        borderTopWidth: 1,
        borderTopColor: theme.colors.border,
        paddingBottom: 32, // Safe area
    }
});
