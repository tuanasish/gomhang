import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { theme } from '../../theme/theme';

export default function Button({
    title,
    onPress,
    variant = 'primary',
    size = 'md',
    disabled = false,
    loading = false,
    style,
    textStyle
}) {
    const getBackgroundColor = () => {
        if (disabled) return theme.colors.border;
        if (variant === 'primary') return theme.colors.primary.default;
        if (variant === 'outline') return 'transparent';
        if (variant === 'danger') return theme.colors.error;
        return theme.colors.primary.default;
    };

    const getTextColor = () => {
        if (disabled) return theme.colors.text.secondary;
        if (variant === 'outline') return theme.colors.primary.default;
        return theme.colors.text.inverse;
    };

    return (
        <TouchableOpacity
            style={[
                styles.button,
                styles[`size_${size}`],
                {
                    backgroundColor: getBackgroundColor(),
                    borderWidth: variant === 'outline' ? 1 : 0,
                    borderColor: variant === 'outline' ? theme.colors.primary.default : 'transparent',
                },
                style
            ]}
            onPress={onPress}
            disabled={disabled || loading}
            activeOpacity={0.7}
        >
            {loading ? (
                <ActivityIndicator color={getTextColor()} />
            ) : (
                <Text style={[
                    styles.text,
                    { color: getTextColor() },
                    textStyle
                ]}>
                    {title}
                </Text>
            )}
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    button: {
        borderRadius: theme.borderRadius.md,
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'row',
    },
    size_sm: {
        paddingVertical: theme.spacing.sm,
        paddingHorizontal: theme.spacing.md,
    },
    size_md: {
        paddingVertical: theme.spacing.md,
        paddingHorizontal: theme.spacing.lg,
    },
    size_lg: {
        paddingVertical: theme.spacing.lg,
        paddingHorizontal: theme.spacing.xl,
    },
    text: {
        fontFamily: theme.typography.fontFamily,
        fontSize: theme.typography.sizes.base,
        fontWeight: theme.typography.weights.semibold,
    }
});
