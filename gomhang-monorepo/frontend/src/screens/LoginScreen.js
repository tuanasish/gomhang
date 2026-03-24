import React, { useState, useContext } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, SafeAreaView, Keyboard, TouchableWithoutFeedback, KeyboardAvoidingView, Platform } from 'react-native';
import { AuthContext } from '../context/AuthContext';
import { theme } from '../theme/theme';
const LoginScreen = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const { login, isLoading } = useContext(AuthContext);

    const handleLogin = async () => {
        if (!email || !password) {
            Alert.alert('Lỗi', 'Vui lòng nhập Email và Mật khẩu.');
            return;
        }

        try {
            await login(email, password);
        } catch (error) {
            let title = 'Đăng nhập thất bại';
            let message = 'Đã có lỗi xảy ra. Vui lòng thử lại.';

            if (error?.message === 'Network Error' || error?.code === 'ERR_NETWORK') {
                title = '⚠️ Lỗi kết nối mạng';
                message = 'Không thể kết nối tới máy chủ.\n\n' +
                    '• Kiểm tra WiFi/3G/4G đã bật chưa\n' +
                    '• Đảm bảo điện thoại cùng mạng WiFi với máy chủ\n' +
                    '• Thử tắt/bật lại WiFi';
            } else if (error?.response?.status === 401) {
                title = '🔐 Sai thông tin đăng nhập';
                message = 'Email hoặc mật khẩu không đúng.\n\n' +
                    '• Kiểm tra lại email và mật khẩu\n' +
                    '• Lưu ý phân biệt chữ HOA/thường\n' +
                    '• Liên hệ quản lý nếu quên mật khẩu';
            } else if (error?.response?.status === 403) {
                title = '🚫 Tài khoản bị khóa';
                message = 'Tài khoản của bạn đã bị khóa hoặc chưa kích hoạt.\n\nVui lòng liên hệ quản lý để được hỗ trợ.';
            } else if (error?.response?.status === 404) {
                title = '❌ Không tìm thấy tài khoản';
                message = 'Email này chưa được đăng ký trong hệ thống.\n\nVui lòng kiểm tra lại hoặc liên hệ quản lý.';
            } else if (error?.response?.status === 500) {
                title = '🔧 Lỗi máy chủ';
                message = 'Hệ thống đang gặp sự cố.\n\nVui lòng thử lại sau vài phút hoặc liên hệ bộ phận kỹ thuật.';
            } else if (error?.code === 'ECONNABORTED') {
                title = '⏱️ Hết thời gian kết nối';
                message = 'Kết nối quá chậm hoặc máy chủ không phản hồi.\n\n' +
                    '• Kiểm tra kết nối mạng\n' +
                    '• Thử lại sau vài giây';
            } else if (error?.response?.data?.error) {
                message = error.response.data.error;
            } else if (error?.message) {
                message = error.message;
            }

            Alert.alert(title, message);
        }
    };

    const FormContent = (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={{ flex: 1, justifyContent: 'center' }}
        >
            <View style={styles.formContainer}>
                <Text style={styles.title}>Gom Hàng Ninh Hiệp</Text>
                <Text style={styles.subtitle}>Ứng dụng nội bộ</Text>

                <TextInput
                    style={styles.input}
                    placeholder="Email nội bộ"
                    placeholderTextColor={theme.colors.text.hint}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={email}
                    onChangeText={setEmail}
                />

                <TextInput
                    style={styles.input}
                    placeholder="Mật khẩu"
                    placeholderTextColor={theme.colors.text.hint}
                    secureTextEntry
                    value={password}
                    onChangeText={setPassword}
                />

                <TouchableOpacity
                    style={styles.button}
                    onPress={handleLogin}
                    disabled={isLoading}
                >
                    {isLoading ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={styles.buttonText}>Đăng nhập</Text>
                    )}
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    );

    return (
        <SafeAreaView style={styles.container}>
            {Platform.OS === 'web' ? (
                FormContent
            ) : (
                <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                    {FormContent}
                </TouchableWithoutFeedback>
            )}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f7fa',
        justifyContent: 'center',
    },
    formContainer: {
        paddingHorizontal: 20,
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#1e3a8a',
        textAlign: 'center',
        marginBottom: 5,
    },
    subtitle: {
        fontSize: 16,
        color: '#64748b',
        textAlign: 'center',
        marginBottom: 30,
    },
    input: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#cbd5e1',
        borderRadius: 8,
        padding: 15,
        marginBottom: 15,
        fontSize: 16,
    },
    button: {
        backgroundColor: '#1e40af',
        padding: 15,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 10,
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
});

export default LoginScreen;
