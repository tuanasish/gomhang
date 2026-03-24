import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, TextInput, Alert, ActivityIndicator, ScrollView, Keyboard, TouchableWithoutFeedback, KeyboardAvoidingView, Platform } from 'react-native';
import { showError, showValidationError } from '../../utils/errorHelper';
import { theme } from '../../theme/theme';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import Button from '../../components/common/Button';

import { getStaffListAPI, createStaffAPI, updateStaffAPI, deleteStaffAPI } from '../../api/staff';

export default function AdminStaffScreen() {
    const navigation = useNavigation();
    const [staffList, setStaffList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingStaff, setEditingStaff] = useState(null);
    const [formData, setFormData] = useState({ name: '', email: '', phone: '', password: '' });

    useEffect(() => {
        loadStaff();
    }, []);

    const loadStaff = async () => {
        setLoading(true);
        try {
            const data = await getStaffListAPI();
            setStaffList(data);
        } catch (error) {
            console.error('Lỗi khi lấy danh sách nhân sự:', error);
            showError(error, 'tải danh sách nhân sự');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateOrUpdate = async () => {
        if (!formData.name || !formData.email) {
            showValidationError('Vui lòng nhập Tên và Email');
            return;
        }

        if (!editingStaff && (!formData.password || formData.password.length < 6)) {
            showValidationError('Mật khẩu phải có ít nhất 6 ký tự');
            return;
        }

        setLoading(true);
        try {
            const staffPayload = {
                name: formData.name,
                email: formData.email,
                phone: formData.phone,
            };
            // Only set role when creating new staff; when editing, preserve existing role
            if (!editingStaff) {
                staffPayload.role = 'worker';
            }
            if (formData.password) {
                staffPayload.password = formData.password;
            }

            if (editingStaff) {
                // Update
                const updatedItem = await updateStaffAPI(editingStaff.id, staffPayload);
                setStaffList(prev => prev.map(s => s.id === editingStaff.id ? updatedItem : s));
            } else {
                // Create
                const newItem = await createStaffAPI(staffPayload);
                setStaffList(prev => [newItem, ...prev]);
            }
            closeModal();
        } catch (error) {
            console.error('Lỗi khi lưu nhân sự:', error);
            showError(error, 'lưu thông tin nhân sự');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = (id, name) => {
        Alert.alert(
            'Xác nhận xóa',
            `Bạn có chắc chắn muốn xóa nhân viên "${name}"?`,
            [
                { text: 'Hủy', style: 'cancel' },
                {
                    text: 'Xóa',
                    style: 'destructive',
                    onPress: async () => {
                        setLoading(true);
                        try {
                            await deleteStaffAPI(id);
                            setStaffList(prev => prev.filter(s => s.id !== id));
                        } catch (error) {
                            console.error('Lỗi khi xóa nhân sự:', error);
                            showError(error, 'xóa nhân viên');
                        } finally {
                            setLoading(false);
                        }
                    }
                }
            ]
        );
    };

    const openCreateModal = () => {
        setEditingStaff(null);
        setFormData({ name: '', email: '', phone: '', password: '' });
        setShowModal(true);
    };

    const openEditModal = (staff) => {
        setEditingStaff(staff);
        setFormData({ name: staff.name, email: staff.email, phone: staff.phone || '', password: '' });
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
    };

    const renderItem = ({ item }) => (
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <View style={styles.cardInfo}>
                    <Text style={styles.staffName}>{item.name}</Text>
                    <Text style={styles.staffEmail}>{item.email}</Text>
                    {item.phone ? <Text style={styles.staffPhone}>{item.phone}</Text> : null}
                </View>
                <View style={styles.roleBadgeContainer}>
                    <View style={[styles.roleBadge, item.role === 'admin' ? styles.roleAdmin : styles.roleWorker]}>
                        <Text style={[styles.roleText, item.role === 'admin' ? styles.roleAdminText : styles.roleWorkerText]}>
                            {item.role === 'admin' ? 'Quản lý' : 'Nhân viên'}
                        </Text>
                    </View>
                </View>
            </View>

            <View style={styles.cardFooter}>
                <Text style={styles.dateText}>Ngày tạo: {new Date(item.createdAt).toLocaleDateString('vi-VN')}</Text>
                <View style={styles.actions}>
                    <TouchableOpacity onPress={() => openEditModal(item)} style={styles.actionButton}>
                        <Ionicons name="create-outline" size={20} color={theme.colors.primary.default} />
                        <Text style={styles.actionTextEdit}>Sửa</Text>
                    </TouchableOpacity>
                    {item.role !== 'admin' && (
                        <TouchableOpacity onPress={() => handleDelete(item.id, item.name)} style={styles.actionButton}>
                            <Ionicons name="trash-outline" size={20} color={theme.colors.error} />
                            <Text style={styles.actionTextDelete}>Xóa</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        </View>
    );

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={theme.colors.text.primary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Nhân sự</Text>
                <TouchableOpacity onPress={openCreateModal} style={styles.addButton}>
                    <Ionicons name="add" size={24} color={theme.colors.primary.default} />
                </TouchableOpacity>
            </View>

            {loading ? (
                <View style={styles.centerContainer}>
                    <ActivityIndicator size="large" color={theme.colors.primary.default} />
                </View>
            ) : (
                <FlatList
                    data={staffList}
                    keyExtractor={(item) => item.id}
                    renderItem={renderItem}
                    contentContainerStyle={styles.listContainer}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyText}>Không có dữ liệu nhân viên</Text>
                        </View>
                    }
                />
            )}

            {/* Modal */}
            <Modal visible={showModal} animationType="slide" transparent>
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={{ flex: 1 }}
                >
                    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                        <View style={styles.modalOverlay}>
                            <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
                                <View style={styles.modalContent}>
                                    <View style={styles.modalHeader}>
                                        <Text style={styles.modalTitle}>{editingStaff ? 'Sửa nhân viên' : 'Thêm nhân viên'}</Text>
                                        <TouchableOpacity onPress={closeModal}>
                                            <Ionicons name="close" size={24} color={theme.colors.text.secondary} />
                                        </TouchableOpacity>
                                    </View>

                                    <ScrollView style={styles.formContainer} showsVerticalScrollIndicator={false}>
                                        <View style={styles.form}>
                                            <Text style={styles.label}>Tên nhân viên *</Text>
                                            <TextInput
                                                style={styles.input}
                                                placeholder="Nhập tên nhân viên"
                                                placeholderTextColor={theme.colors.text.hint}
                                                value={formData.name}
                                                onChangeText={(t) => setFormData({ ...formData, name: t })}
                                            />

                                            <Text style={styles.label}>Email *</Text>
                                            <TextInput
                                                style={styles.input}
                                                placeholder="Nhập email"
                                                placeholderTextColor={theme.colors.text.hint}
                                                value={formData.email}
                                                onChangeText={(t) => setFormData({ ...formData, email: t })}
                                                keyboardType="email-address"
                                                autoCapitalize="none"
                                            />

                                            <Text style={styles.label}>Số điện thoại</Text>
                                            <TextInput
                                                style={styles.input}
                                                placeholder="Nhập số điện thoại"
                                                placeholderTextColor={theme.colors.text.hint}
                                                value={formData.phone}
                                                onChangeText={(t) => setFormData({ ...formData, phone: t })}
                                                keyboardType="phone-pad"
                                            />

                                            <Text style={styles.label}>{editingStaff ? 'Mật khẩu mới (Tùy chọn)' : 'Mật khẩu *'}</Text>
                                            <TextInput
                                                style={styles.input}
                                                placeholder={editingStaff ? "Bỏ trống nếu không đổi" : "Nhập mật khẩu (ít nhất 6 ký tự)"}
                                                placeholderTextColor={theme.colors.text.hint}
                                                value={formData.password}
                                                onChangeText={(t) => setFormData({ ...formData, password: t })}
                                                secureTextEntry
                                            />

                                            <Button
                                                title={editingStaff ? "Cập nhật" : "Thêm mới"}
                                                onPress={handleCreateOrUpdate}
                                                style={{ marginTop: 16, marginBottom: 24 }}
                                            />
                                        </View>
                                    </ScrollView>
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
    container: { flex: 1, backgroundColor: theme.colors.background.light },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 60, paddingBottom: 16, backgroundColor: theme.colors.surface.light, borderBottomWidth: 1, borderColor: theme.colors.border },
    backButton: { padding: 8, marginLeft: -8 },
    headerTitle: { fontSize: 18, fontWeight: 'bold', color: theme.colors.text.primary },
    addButton: { padding: 8, marginRight: -8 },
    centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    listContainer: { padding: 16 },
    card: { backgroundColor: theme.colors.surface.light, borderRadius: 12, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: theme.colors.border },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
    cardInfo: { flex: 1, paddingRight: 8 },
    staffName: { fontSize: 16, fontWeight: 'bold', color: theme.colors.text.primary, marginBottom: 4 },
    staffEmail: { fontSize: 14, color: theme.colors.text.secondary, marginBottom: 2 },
    staffPhone: { fontSize: 14, color: theme.colors.text.secondary },
    roleBadgeContainer: { marginLeft: 8 },
    roleBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
    roleAdmin: { backgroundColor: theme.colors.warning + '20' },
    roleWorker: { backgroundColor: theme.colors.primary.light },
    roleText: { fontSize: 12, fontWeight: 'bold' },
    roleAdminText: { color: theme.colors.warning },
    roleWorkerText: { color: theme.colors.primary.default },
    cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: theme.colors.border, paddingTop: 12 },
    dateText: { fontSize: 12, color: theme.colors.text.hint },
    actions: { flexDirection: 'row', gap: 16 },
    actionButton: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    actionTextEdit: { fontSize: 14, color: theme.colors.primary.default, fontWeight: '500' },
    actionTextDelete: { fontSize: 14, color: theme.colors.error, fontWeight: '500' },
    emptyContainer: { padding: 24, alignItems: 'center' },
    emptyText: { color: theme.colors.text.secondary },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: theme.colors.surface.light, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, maxHeight: '90%' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    modalTitle: { fontSize: 18, fontWeight: 'bold' },
    formContainer: { maxHeight: '100%' },
    form: { gap: 12 },
    label: { fontSize: 14, fontWeight: '500', color: theme.colors.text.primary, marginBottom: 4 },
    input: { borderWidth: 1, borderColor: theme.colors.border, borderRadius: 8, padding: 12, fontSize: 16 },
});
