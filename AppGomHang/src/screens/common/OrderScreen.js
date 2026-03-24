import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { theme } from '../../theme/theme';
import Loading from '../../components/common/Loading';

export default function OrderScreen() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setTimeout(() => {
            setOrders([
                { id: '1', customer: 'Anh Tuấn', counter: 'Quầy 1', total: 1500000, status: 'Hoàn thành' },
                { id: '2', customer: 'Chị Lan', counter: 'Quầy 2', total: 800000, status: 'Chờ xử lý' },
            ]);
            setLoading(false);
        }, 800);
    }, []);

    const renderItem = ({ item }) => (
        <TouchableOpacity style={styles.card}>
            <View style={styles.cardHeader}>
                <Text style={styles.customerConfig}>{item.customer}</Text>
                <Text style={styles.counterText}>{item.counter}</Text>
            </View>
            <View style={styles.cardBody}>
                <Text style={styles.totalText}>{item.total.toLocaleString('vi-VN')}đ</Text>
                <Text style={[styles.statusText, { color: item.status === 'Hoàn thành' ? theme.colors.success : theme.colors.warning }]}>{item.status}</Text>
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Quản lý Đơn hàng</Text>
            </View>
            {loading ? <Loading fullScreen={false} /> : (
                <FlatList
                    data={orders}
                    keyExtractor={item => item.id}
                    renderItem={renderItem}
                    contentContainerStyle={styles.listContainer}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background.light },
    header: { padding: 16, paddingTop: 60, backgroundColor: theme.colors.surface.light, borderBottomWidth: 1, borderColor: theme.colors.border },
    headerTitle: { fontSize: 20, fontWeight: 'bold' },
    listContainer: { padding: 16 },
    card: { backgroundColor: theme.colors.surface.light, padding: 16, borderRadius: 8, marginBottom: 12, borderWidth: 1, borderColor: theme.colors.border },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
    customerConfig: { fontSize: 16, fontWeight: 'bold' },
    counterText: { fontSize: 14, color: theme.colors.text.secondary },
    cardBody: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    totalText: { fontSize: 16, fontWeight: 'bold', color: theme.colors.primary.default },
    statusText: { fontSize: 14, fontWeight: '500' },
});
