import React, { useState, useEffect, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
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
    Keyboard,
    TouchableWithoutFeedback,
    KeyboardAvoidingView
} from 'react-native';
import { showError, showValidationError } from '../../utils/errorHelper';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../theme/theme';
import { formatDate } from '../../utils/helpers';
import { useAuth } from '../../context/AuthContext';

import {
    getCountersListAPI,
    createCounterAPI,
    updateCounterAPI,
    deleteCounterAPI
} from '../../api/counters';

export default function AdminCountersScreen({ navigation }) {
    const { userInfo } = useAuth();
    const [counters, setCounters] = useState([]);
    const [loading, setLoading] = useState(true);

    const [modalVisible, setModalVisible] = useState(false);
    const [editingCounter, setEditingCounter] = useState(null);
    const [formData, setFormData] = useState({ name: '', address: '' });
    useFocusEffect(
        useCallback(() => {
            loadData();
            // Không return cleanup function nếu không cần thiết
        }, [])
    );

    const loadData = async () => {
        setLoading(true);
        try {
            const res = await getCountersListAPI();
            if (res.success) {
                setCounters(res.data || []);
            } else {
                Alert.alert('Lỗi', res.message || 'Không thể tải dữ liệu quầy');
            }
        } catch (error) {
            console.error('Error loading counters:', error);
            showError(error, 'tải dữ liệu quầy');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (counter = null) => {
        if (counter) {
            setEditingCounter(counter);
            setFormData({ name: counter.name, address: counter.address });
        } else {
            setEditingCounter(null);
            setFormData({ name: '', address: '' });
        }
        setModalVisible(true);
    };

    const handleCloseModal = () => {
        setModalVisible(false);
        setEditingCounter(null);
        setFormData({ name: '', address: '' });
    };

    const handleSave = async () => {
        if (!formData.name.trim()) {
            showValidationError('Vui lòng nhập tên quầy');
            return;
        }

        try {
            const payload = {
                name: formData.name.trim(),
                address: formData.address ? formData.address.trim() : ''
            };

            if (editingCounter) {
                const res = await updateCounterAPI(editingCounter.id, payload);
                if (res.success) {
                    Alert.alert('Thành công', 'Đã cập nhật quầy');
                    loadData();
                } else {
                    Alert.alert('Lỗi', res.message || 'Không thể cập nhật quầy');
                }
            } else {
                const res = await createCounterAPI(payload);
                if (res.success) {
                    Alert.alert('Thành công', 'Đã thêm quầy mới');
                    loadData();
                } else {
                    Alert.alert('Lỗi', res.message || 'Không thể thêm quầy');
                }
            }
            handleCloseModal();
        } catch (error) {
            console.error('Save counter error:', error);
            showError(error, 'lưu quầy');
        }
    };

    const handleDelete = (id) => {
        Alert.alert('Xác nhận', 'Bạn có chắc chắn muốn xóa quầy này?', [
            { text: 'Hủy', style: 'cancel' },
            {
                text: 'Xóa', style: 'destructive', onPress: async () => {
                    try {
                        const res = await deleteCounterAPI(id);
                        if (res.success) {
                            Alert.alert('Thành công', 'Đã xóa quầy');
                            loadData();
                        } else {
                            Alert.alert('Lỗi', res.message || 'Không thể xóa quầy');
                        }
                    } catch (error) {
                        console.error('Delete counter error:', error);
                        showError(error, 'xóa quầy');
                    }
                }
            }
        ]);
    };

    const renderItem = ({ item }) => (
        <View style={styles.card}>
            <View style={styles.cardContent}>
                <Text style={styles.counterName}>{item.name}</Text>
                {item.address ? <Text style={styles.counterAddress}>{item.address}</Text> : null}
                <Text style={styles.counterDate}>Ngày tạo: {formatDate(item.createdAt)}</Text>
            </View>
            <View style={styles.cardActions}>
                <TouchableOpacity style={styles.actionBtn} onPress={() => handleOpenModal(item)}>
                    <Ionicons name="create-outline" size={22} color={theme?.colors?.primary?.default || '#007AFF'} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionBtn} onPress={() => handleDelete(item.id)}>
                    <Ionicons name="trash-outline" size={22} color="#F44336" />
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Quản lý Quầy</Text>
                <TouchableOpacity style={styles.addButton} onPress={() => handleOpenModal()}>
                    <Ionicons name="add" size={24} color="#FFF" />
                </TouchableOpacity>
            </View>

            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={theme?.colors?.primary?.default || '#007AFF'} />
                </View>
            ) : (
                <FlatList
                    data={counters}
                    keyExtractor={item => item.id}
                    renderItem={renderItem}
                    contentContainerStyle={styles.listContainer}
                    ListEmptyComponent={<Text style={styles.emptyText}>Chưa có quầy nào</Text>}
                />
            )}

            <Modal visible={modalVisible} transparent={true} animationType="fade">
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={{ flex: 1 }}
                >
                    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                        <View style={styles.modalOverlay}>
                            <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
                                <View style={styles.modalContent}>
                                    <View style={styles.modalHeader}>
                                        <Text style={styles.modalTitle}>{editingCounter ? 'Sửa quầy' : 'Thêm quầy mới'}</Text>
                                        <TouchableOpacity onPress={handleCloseModal}>
                                            <Ionicons name="close" size={24} color="#333" />
                                        </TouchableOpacity>
                                    </View>

                                    <Text style={styles.label}>Tên quầy *</Text>
                                    <TextInput
                                        style={styles.input}
                                        value={formData.name}
                                        onChangeText={t => setFormData({ ...formData, name: t })}
                                        placeholder="Nhập tên quầy"
                                        placeholderTextColor={theme.colors.text.hint}
                                    />

                                    <Text style={styles.label}>Địa chỉ</Text>
                                    <TextInput
                                        style={styles.input}
                                        value={formData.address}
                                        onChangeText={t => setFormData({ ...formData, address: t })}
                                        placeholder="Nhập địa chỉ quầy"
                                        placeholderTextColor={theme.colors.text.hint}
                                    />

                                    <TouchableOpacity style={styles.submitBtn} onPress={handleSave}>
                                        <Text style={styles.submitBtnText}>{editingCounter ? 'Cập nhật' : 'Thêm'}</Text>
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
    container: { flex: 1, backgroundColor: '#F2F2F7' },
    header: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        paddingHorizontal: 16, paddingTop: 60, paddingBottom: 15,
        backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#E5E5EA'
    },
    title: { fontSize: 22, fontWeight: 'bold', color: '#000' },
    addButton: {
        backgroundColor: theme?.colors?.primary?.default || '#007AFF',
        width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center'
    },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    listContainer: { padding: 16, paddingBottom: 100 },
    card: {
        flexDirection: 'row', backgroundColor: '#FFF', borderRadius: 12, padding: 16, marginBottom: 12,
        shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 2
    },
    cardContent: { flex: 1 },
    counterName: { fontSize: 16, fontWeight: 'bold', color: '#000', marginBottom: 4 },
    counterAddress: { fontSize: 14, color: '#666', marginBottom: 6 },
    counterDate: { fontSize: 13, color: '#999' },
    cardActions: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    actionBtn: { padding: 6, backgroundColor: '#F2F2F7', borderRadius: 8 },
    emptyText: { textAlign: 'center', color: '#8E8E93', marginTop: 40, fontSize: 16 },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
    modalContent: { backgroundColor: '#FFF', borderRadius: 16, padding: 20 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    modalTitle: { fontSize: 18, fontWeight: 'bold' },
    label: { fontSize: 14, fontWeight: '500', marginBottom: 8, color: '#333' },
    input: {
        borderWidth: 1, borderColor: '#E5E5EA', borderRadius: 8, padding: 12, fontSize: 15, marginBottom: 16, backgroundColor: '#FFF'
    },
    submitBtn: {
        backgroundColor: theme?.colors?.primary?.default || '#007AFF', borderRadius: 8, padding: 14, alignItems: 'center', marginTop: 10
    },
    submitBtnText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' }
});
