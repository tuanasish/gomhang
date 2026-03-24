import React from 'react';
import { View, TextInput, Text, StyleSheet } from 'react-native';
import { theme } from '../../theme/theme';
import { Ionicons } from '@expo/vector-icons';

export default function Input({
    label,
    error,
    leftIcon,
    rightIcon,
    onRightIconPress,
    style,
    containerStyle,
    ...props
}) {
    return (
        <View style={[styles.container, containerStyle]}>
            {label && <Text style={styles.label}>{label}</Text>}
            <View style={[
                styles.inputContainer,
                error ? styles.inputError : null,
            ]}>
                {leftIcon && (
                    <Ionicons
                        name={leftIcon}
                        size={20}
                        color={theme.colors.text.secondary}
                        style={styles.leftIcon}
                    />
                )}
                <TextInput
                    style={[styles.input, style]}
                    placeholderTextColor={theme.colors.text.hint}
                    {...props}
                />
                {rightIcon && (
                    <Ionicons
                        name={rightIcon}
                        size={20}
                        color={theme.colors.text.secondary}
                        style={styles.rightIcon}
                        onPress={onRightIconPress}
                    />
                )}
            </View>
            {error && <Text style={styles.errorText}>{error}</Text>}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginBottom: theme.spacing.md,
        width: '100%',
    },
    label: {
        fontSize: theme.typography.sizes.sm,
        fontWeight: theme.typography.weights.medium,
        color: theme.colors.text.primary,
        marginBottom: theme.spacing.xs,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: theme.colors.border,
        borderRadius: theme.borderRadius.md,
        backgroundColor: theme.colors.surface.light,
        minHeight: 48,
    },
    inputError: {
        borderColor: theme.colors.error,
    },
    input: {
        flex: 1,
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.sm,
        fontSize: theme.typography.sizes.base,
        color: theme.colors.text.primary,
    },
    leftIcon: {
        marginLeft: theme.spacing.md,
    },
    rightIcon: {
        marginRight: theme.spacing.md,
    },
    errorText: {
        fontSize: theme.typography.sizes.xs,
        color: theme.colors.error,
        marginTop: theme.spacing.xs,
    }
});
