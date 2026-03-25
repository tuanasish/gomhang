import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { theme } from '../../theme/theme';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Loading from '../../components/common/Loading';
import { getCurrentShiftAPI } from '../../api/shifts';
import { getOrdersByShiftAPI } from '../../api/orders';

export default function WorkerHomeScreen() {
    const navigation = useNavigation();
    const { userInfo } = useAuth();
    const [loading, setLoading] = useState(true);
    const [shift, setShift] = useState(null);
    const [orders, setOrders] = useState([]);

    const loadData = async (isRefresh = false) => {
        if (isRefresh) {
            setLoading(true); // Dùng cho RefreshControl
        } else if (!shift) {
            // Chỉ hiện loading xoay giữa màn hình nếu chưa có dữ liệu ca
            setLoading(true);
        }

        try {
            const shiftRes = await getCurrentShiftAPI();
            if (shiftRes && shiftRes.success && shiftRes.data) {
                const currentShift = shiftRes.data;
                setShift(currentShift);

                // Lấy danh sách hóa đơn của ca này
                const ordersRes = await getOrdersByShiftAPI(currentShift.id);
                if (ordersRes && ordersRes.success && ordersRes.data) {
                    setOrders([...ordersRes.data].reverse());
                } else {
                    setOrders([]);
                }
            } else {
                setShift(null);
                setOrders([]);
            }
        } catch (error) {
            console.error('Lỗi tải dữ liệu màn hình chính:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const unsubscribe = navigation.addListener('focus', () => {
            loadData(false); // Fetch ngầm khi focus, không xoay loading toàn màn hình
        });
        loadData(true); // Xoay loading lần đầu tiên truy cập
        return unsubscribe;
    }, [navigation]);

    const formatTime = (isoString) => {
        const d = new Date(isoString);
        return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    };

    const formatCurrency = (amount) => {
        return amount.toLocaleString('vi-VN') + 'đ';
    };

    // Chỉ chặn render toàn màn hình nếu loading và đang CHƯA CÓ dữ liệu
    if (loading && !shift && orders.length === 0) {
        return (
            <View style={styles.centerContainer}>
                <Loading text="Đang tải dữ liệu..." />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerUser}>
                    <View style={styles.avatar}>
                        <Ionicons name="person" size={24} color={theme.colors.primary.dark} />
                    </View>
                    <Text style={styles.userName}>{userInfo?.name || 'Nhân viên'}</Text>
                </View>
            </View>

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                refreshControl={<RefreshControl refreshing={loading} onRefresh={() => loadData(true)} />}
            >
                {shift ? (
                    <>
                        {/* Stats Cards */}
                        <View style={styles.statsContainer}>
                            <Card style={styles.statCard}>
                                <Text style={styles.statLabel}>Giờ bắt đầu ca</Text>
                                <Text style={styles.statValue}>{formatTime(shift.startTime)}</Text>
                            </Card>
                            <Card style={styles.statCard}>
                                <Text style={styles.statLabel}>Tiền giao ca ban đầu</Text>
                                <Text style={styles.statValue}>{formatCurrency(shift.tienGiaoCa)}</Text>
                            </Card>
                            <Card style={styles.statCard}>
                                <Text style={styles.statLabel}>Tổng tiền hàng đã mua</Text>
                                <Text style={styles.statValue}>{formatCurrency(shift.tongTienHangDaTra || 0)}</Text>
                            </Card>
                            <Card style={styles.statCard}>
                                <Text style={styles.statLabel}>Quỹ còn lại</Text>
                                <Text style={[
                                    styles.statValue,
                                    { color: (shift.quyConLai || 0) >= 0 ? theme.colors.success : theme.colors.error }
                                ]}>
                                    {formatCurrency(shift.quyConLai || 0)}
                                </Text>
                            </Card>
                        </View>

                        {/* Action */}
                        <Button
                            title="Tạo hóa đơn mới"
                            onPress={() => navigation.navigate('CreateOrder')}
                            style={styles.actionButton}
                        />

                        {/* Order List */}
                        <Text style={styles.sectionTitle}>Hóa đơn trong ca</Text>
                        {orders.length === 0 ? (
                            <Text style={styles.emptyText}>Chưa có hóa đơn nào trong ca này.</Text>
                        ) : (
                            orders.map((order, index) => (
                                <TouchableOpacity
                                    key={order.id}
                                    style={styles.orderItem}
                                    onPress={() => navigation.navigate('OrderDetail', { orderId: order.id })}
                                >
                                    <View style={styles.orderLeft}>
                                        <View style={styles.orderIndex}>
                                            <Text style={styles.orderIndexText}>{orders.length - index}</Text>
                                        </View>
                                        <View style={styles.orderInfo}>
                                            <Text style={styles.orderCustomer}>Khách: {order.customerName || 'N/A'}</Text>
                                            <Text style={styles.orderTime}>{formatTime(order.createdAt)}</Text>
                                            <Text style={styles.orderDetailText}>
                                                Tổng: <Text style={{ fontWeight: '500' }}>{formatCurrency(order.tongTienHoaDon)}</Text> | Hàng: {formatCurrency(order.tienHang)}
                                            </Text>
                                        </View>
                                    </View>
                                    <View style={[
                                        styles.orderStatusBadge,
                                        { backgroundColor: order.status === 'completed' ? '#dcfce7' : '#fef9c3' }
                                    ]}>
                                        <Text style={[
                                            styles.orderStatusText,
                                            { color: order.status === 'completed' ? '#166534' : '#854d0e' }
                                        ]}>
                                            {order.status === 'completed' ? 'Đã thanh toán' : 'Chờ xử lý'}
                                        </Text>
                                    </View>
                                </TouchableOpacity>
                            ))
                        )}
                    </>
                ) : (
                    <View style={styles.noShiftContainer}>
                        <Ionicons name="time-outline" size={64} color={theme.colors.text.secondary} />
                        <Text style={styles.noShiftTitle}>Chưa có ca làm việc</Text>
                        <Text style={styles.noShiftDesc}>Bạn chưa có ca làm việc hôm nay. Vui lòng liên hệ quản lý để được tạo ca hoặc đợi quản lý tạo ca cho bạn.</Text>
                        <Button
                            title="Xem ca làm việc"
                            onPress={() => navigation.navigate('ShiftsTab')}
                        />
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
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: theme.colors.primary.light,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    avatarText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: theme.colors.primary.dark,
    },
    userName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: theme.colors.text.primary,
    },
    scrollContent: {
        padding: 16,
        paddingBottom: 32,
    },
    statsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    statCard: {
        width: '100%',
        marginBottom: 8,
    },
    statLabel: {
        fontSize: 14,
        color: theme.colors.text.secondary,
        marginBottom: 4,
    },
    statValue: {
        fontSize: 24,
        fontWeight: 'bold',
        color: theme.colors.text.primary,
    },
    infoBox: {
        backgroundColor: '#eff6ff',
        borderRadius: 8,
        padding: 16,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#bfdbfe',
        marginVertical: 12,
    },
    infoLabel: {
        fontSize: 14,
        fontWeight: '500',
        color: '#1e3a8a',
    },
    infoValue: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#1e3a8a',
    },
    actionButton: {
        marginVertical: 12,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: theme.colors.text.primary,
        marginTop: 16,
        marginBottom: 12,
    },
    emptyText: {
        textAlign: 'center',
        color: theme.colors.text.secondary,
        marginTop: 20,
    },
    orderItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: theme.colors.surface.light,
        padding: 16,
        borderRadius: 8,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    orderLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    orderIndex: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: theme.colors.primary.light,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    orderIndexText: {
        color: theme.colors.primary.default,
        fontWeight: 'bold',
    },
    orderInfo: {
        flex: 1,
    },
    orderCustomer: {
        fontSize: 16,
        fontWeight: '500',
        color: theme.colors.text.primary,
    },
    orderTime: {
        fontSize: 12,
        color: theme.colors.text.secondary,
        marginBottom: 4,
    },
    orderDetailText: {
        fontSize: 13,
        color: theme.colors.text.secondary,
    },
    orderStatusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    orderStatusText: {
        fontSize: 12,
        fontWeight: '500',
    },
    noShiftContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 40,
    },
    noShiftTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: theme.colors.text.primary,
        marginTop: 16,
        marginBottom: 8,
    },
    noShiftDesc: {
        textAlign: 'center',
        color: theme.colors.text.secondary,
        marginBottom: 24,
        lineHeight: 20,
    }
});
