const fs = require('fs');
const path = require('path');

const targetPath = path.join(__dirname, 'src', 'screens', 'manager', 'CustomerDetailScreen.js');

try {
    let content = fs.readFileSync(targetPath, 'utf8');

    // 1. Replace imports
    content = content.replace(
        `import * as Print from 'expo-print';\nimport * as Sharing from 'expo-sharing';\nimport * as FileSystem from 'expo-file-system/legacy';`,
        `import ViewShot from "react-native-view-shot";\nimport * as Sharing from 'expo-sharing';`
    );

    // 2. Replace state variable
    content = content.replace(
        `const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);`,
        `const [isExportingImage, setIsExportingImage] = useState(false);\n    const invoiceRef = useRef();`
    );

    // 3. Replace handleExportAllOrders function
    const oldFunctionStart = `const handleExportAllOrders = async () => {`;
    const nextFunctionStart = `const renderDateSelector = () => (`;

    if (content.includes(oldFunctionStart) && content.includes(nextFunctionStart)) {
        const startIndex = content.indexOf(oldFunctionStart);
        const endIndex = content.indexOf(nextFunctionStart);

        const imageExportCode = `const handleExportImage = async () => {
        if (!customer || orders.length === 0) return;
        
        try {
            setIsExportingImage(true);
            
            setTimeout(async () => {
                try {
                    if (!invoiceRef.current) {
                        setIsExportingImage(false);
                        return;
                    }
                    
                    const uri = await invoiceRef.current.capture();
                    
                    if (Platform.OS === 'web') {
                        const link = document.createElement('a');
                        link.href = uri;
                        link.download = \`TongHopHoaDon_\${customer?.name || 'Customer'}.jpg\`;
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                    } else {
                        if (await Sharing.isAvailableAsync()) {
                            await Sharing.shareAsync(uri, {
                                mimeType: 'image/jpeg',
                                dialogTitle: 'Chia sẻ ảnh hóa đơn',
                            });
                        } else {
                            Alert.alert('Thành công', 'Đã lưu ảnh hóa đơn.');
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

    `;

        content = content.substring(0, startIndex) + imageExportCode + content.substring(endIndex);
    }

    // 4. Replace Export Button
    const oldButton = `TouchableOpacity
                                    style={[styles.exportButton, isGeneratingPDF && { opacity: 0.6 }]}
                                    onPress={handleExportAllOrders}
                                    disabled={isGeneratingPDF}
                                >
                                    {isGeneratingPDF ? (
                                        <ActivityIndicator size="small" color="#FFF" />
                                    ) : (
                                        <Ionicons name="receipt-outline" size={20} color="#FFF" />
                                    )}
                                    <Text style={styles.exportButtonText}>
                                        {isGeneratingPDF ? 'Đang tạo PDF...' : 'Xuất hóa đơn PDF'}
                                    </Text>
                                </TouchableOpacity>`;

    const newButton = `TouchableOpacity
                                    style={[styles.exportButton, isExportingImage && { opacity: 0.6 }]}
                                    onPress={handleExportImage}
                                    disabled={isExportingImage}
                                >
                                    {isExportingImage ? (
                                        <ActivityIndicator size="small" color="#FFF" />
                                    ) : (
                                        <Ionicons name="image-outline" size={20} color="#FFF" />
                                    )}
                                    <Text style={styles.exportButtonText}>
                                        {isExportingImage ? 'Đang tạo ảnh...' : 'Lưu / Chia sẻ ảnh'}
                                    </Text>
                                </TouchableOpacity>`;

    content = content.replace(oldButton, newButton);


    // 5. Add hidden ViewShot
    const hiddenViewShot = `

            {/* Hidden Receipt for Image Export */}
            {(customer && orders.length > 0) && (
                <View style={{ position: 'absolute', top: -10000, left: -10000 }} collapsable={false}>
                    <ViewShot ref={invoiceRef} options={{ format: 'jpg', quality: 0.9 }}>
                        <View style={{ width: 600, backgroundColor: '#fff', padding: 24 }} collapsable={false}>
                            {/* Header */}
                            <View style={{ alignItems: 'center', marginBottom: 20, paddingBottom: 16, borderBottomWidth: 2, borderBottomColor: '#2563eb' }}>
                                <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#2563eb', marginBottom: 4 }}>Gom Hàng Ninh Hiệp</Text>
                                <Text style={{ fontSize: 14, color: '#4b5563', marginBottom: 2 }}>Ninh Hiệp, Gia Lâm, Hà Nội</Text>
                                <Text style={{ fontSize: 14, color: '#4b5563', marginBottom: 8 }}>0922238683</Text>
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
                            <View style={{ flexDirection: 'row', backgroundColor: '#f0f4ff', paddingVertical: 10, paddingHorizontal: 8, borderBottomWidth: 2, borderBottomColor: '#2563eb' }}>
                                <Text style={{ flex: 0.5, fontWeight: 'bold', fontSize: 13, color: '#111827', textAlign: 'center' }}>STT</Text>
                                <Text style={{ flex: 1.5, fontWeight: 'bold', fontSize: 13, color: '#111827' }}>Quầy</Text>
                                <Text style={{ flex: 1, fontWeight: 'bold', fontSize: 13, color: '#111827', textAlign: 'center' }}>Giờ</Text>
                                <Text style={{ flex: 1.5, fontWeight: 'bold', fontSize: 13, color: '#111827', textAlign: 'right' }}>Tiền hàng</Text>
                                <Text style={{ flex: 1.2, fontWeight: 'bold', fontSize: 13, color: '#111827', textAlign: 'right' }}>Công gom</Text>
                                <Text style={{ flex: 1.2, fontWeight: 'bold', fontSize: 13, color: '#111827', textAlign: 'right' }}>Thuế phí</Text>
                                <Text style={{ flex: 1.5, fontWeight: 'bold', fontSize: 13, color: '#111827', textAlign: 'right' }}>Tổng</Text>
                            </View>

                            {/* Table Rows */}
                            {orders.map((order, index) => {
                                const orderDate = new Date(order.createdAt);
                                const timeStr = \`\${orderDate.getHours().toString().padStart(2, '0')}:\${orderDate.getMinutes().toString().padStart(2, '0')}\`;
                                const totalPhi = (order.phiDongHang || 0) + (order.tienHoaHong || 0);

                                return (
                                    <View key={index} style={{ flexDirection: 'row', paddingVertical: 12, paddingHorizontal: 8, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' }}>
                                        <Text style={{ flex: 0.5, fontSize: 13, color: '#374151', textAlign: 'center' }}>{index + 1}</Text>
                                        <Text style={{ flex: 1.5, fontSize: 13, color: '#374151' }}>{order.counterName || 'N/A'}</Text>
                                        <Text style={{ flex: 1, fontSize: 13, color: '#374151', textAlign: 'center' }}>{timeStr}</Text>
                                        <Text style={{ flex: 1.5, fontSize: 13, color: '#374151', textAlign: 'right' }}>{formatCurrency(order.tienHang || 0)}</Text>
                                        <Text style={{ flex: 1.2, fontSize: 13, color: '#374151', textAlign: 'right' }}>{formatCurrency(order.tienCongGom || 0)}</Text>
                                        <Text style={{ flex: 1.2, fontSize: 13, color: '#374151', textAlign: 'right' }}>{formatCurrency(totalPhi)}</Text>
                                        <Text style={{ flex: 1.5, fontSize: 13, fontWeight: '500', color: '#2563eb', textAlign: 'right' }}>{formatCurrency(order.tongTienHoaDon || 0)}</Text>
                                    </View>
                                );
                            })}

                            {/* Table Footer */}
                            <View style={{ flexDirection: 'row', paddingVertical: 14, paddingHorizontal: 8, backgroundColor: '#f8fafc', borderTopWidth: 2, borderTopColor: '#2563eb', marginTop: 8 }}>
                                <Text style={{ flex: 2, fontWeight: 'bold', fontSize: 14, color: '#111827' }}>TỔNG CỘNG</Text>
                                <Text style={{ flex: 1, fontWeight: '500', fontSize: 13, color: '#374151', textAlign: 'center' }}>{orders.length} đơn</Text>
                                <Text style={{ flex: 1.5, fontWeight: '500', fontSize: 13, color: '#374151', textAlign: 'right' }}>{formatCurrency(orders.reduce((s, o) => s + (o.tienHang || 0), 0))}</Text>
                                <Text style={{ flex: 1.2, fontWeight: '500', fontSize: 13, color: '#374151', textAlign: 'right' }}>{formatCurrency(orders.reduce((s, o) => s + (o.tienCongGom || 0), 0))}</Text>
                                <Text style={{ flex: 1.2, fontWeight: '500', fontSize: 13, color: '#374151', textAlign: 'right' }}>{formatCurrency(orders.reduce((s, o) => s + ((o.phiDongHang || 0) + (o.tienHoaHong || 0)), 0))}</Text>
                                <Text style={{ flex: 1.5, fontWeight: 'bold', fontSize: 14, color: '#2563eb', textAlign: 'right' }}>{formatCurrency(orders.reduce((s, o) => s + (o.tongTienHoaDon || 0), 0))}</Text>
                            </View>

                            {/* Grand Total */}
                            <View style={{ alignItems: 'flex-end', marginTop: 16, marginBottom: 32 }}>
                                <Text style={{ fontSize: 24, fontWeight: '900', color: '#2563eb' }}>
                                    TỔNG TIỀN: {formatCurrency(orders.reduce((s, o) => s + (o.tongTienHoaDon || 0), 0))}
                                </Text>
                            </View>

                            {/* Footer */}
                            <View style={{ alignItems: 'center', paddingTop: 16, borderTopWidth: 1, borderTopColor: '#e5e7eb' }}>
                                <Text style={{ fontSize: 13, color: '#6b7280', fontStyle: 'italic', marginBottom: 4 }}>Cảm ơn quý khách đã sử dụng dịch vụ!</Text>
                                <Text style={{ fontSize: 13, color: '#6b7280' }}>Powered by Gom Hàng Pro</Text>
                            </View>
                        </View>
                    </ViewShot>
                </View>
            )}
        </View>
    );`;

    content = content.replace(`        </View>\n    );\n}`, hiddenViewShot + `\n}`);

    fs.writeFileSync(targetPath, content, 'utf8');
    console.log('Successfully updated CustomerDetailScreen.js to use image export.');
} catch (error) {
    console.error('Error updating CustomerDetailScreen.js:', error);
}
