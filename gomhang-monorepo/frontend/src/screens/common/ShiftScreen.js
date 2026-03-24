import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { theme } from '../../theme/theme';
import { Ionicons } from '@expo/vector-icons';
import Loading from '../../components/common/Loading';

export default function ShiftScreen() {
    const [shifts, setShifts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setTimeout(() => {
            setShifts([
                { id: '1', date: '02/03/2026', worker: 'Nguyễn Văn A', status: 'Đang làm', tienGiao: 5000000 },
                { id: '2', date: '01/03/2026', worker: 'Trần Thị B', status: 'Đã chốt', tienGiao: 4000000 },
            ]);
            setLoading(false);
        }, 800);
    }, []);

    const renderItem = ({ item }) => (
        <TouchableOpacity style={styles.card}>
            <View style={styles.cardHeader}>
                <Text style={styles.dateText}><Ionicons name="calendar-outline" /> {item.date}</Text>
                <View style={[styles.badge, { backgroundColor: item.status === 'Đang làm' ? theme.colors.warning + '20' : theme.colors.success + '20' }]}>
                    <Text style={[styles.badgeText, { color: item.status === 'Đang làm' ? theme.colors.warning : theme.colors.success }]}>{item.status}</Text>
                </View>
            </View>
            <View style={styles.cardBody}>
                <Text style={styles.workerName}>{item.worker}</Text>
                <Text style={styles.moneyText}>Giao ca: {item.tienGiao.toLocaleString('vi-VN')}đ</Text>
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Quản lý Ca làm việc</Text>
            </View>
            {loading ? <Loading fullScreen={false} /> : (
                <FlatList
                    data={shifts}
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
    dateText: { fontSize: 14, color: theme.colors.text.secondary },
    badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
    badgeText: { fontSize: 12, fontWeight: 'bold' },
    cardBody: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    workerName: { fontSize: 16, fontWeight: '500' },
    moneyText: { fontSize: 14, color: theme.colors.text.primary, fontWeight: '500' },
});
