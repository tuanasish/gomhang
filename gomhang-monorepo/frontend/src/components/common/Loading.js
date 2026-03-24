import React from 'react';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';
import { theme } from '../../theme/theme';

export default function Loading({ text = 'Đang tải...', fullScreen = false }) {
    if (fullScreen) {
        return (
            <View style={styles.fullScreenContainer}>
                <View style={styles.box}>
                    <ActivityIndicator size="large" color={theme.colors.primary.default} />
                    {text ? <Text style={styles.text}>{text}</Text> : null}
                </View>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <ActivityIndicator size="small" color={theme.colors.primary.default} />
            {text ? <Text style={styles.textSmall}>{text}</Text> : null}
        </View>
    );
}

const styles = StyleSheet.create({
    fullScreenContainer: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.3)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 9999,
    },
    box: {
        backgroundColor: theme.colors.surface.light,
        padding: theme.spacing.lg,
        borderRadius: theme.borderRadius.md,
        alignItems: 'center',
        minWidth: 120,
    },
    container: {
        padding: theme.spacing.md,
        alignItems: 'center',
        justifyContent: 'center',
    },
    text: {
        marginTop: theme.spacing.sm,
        color: theme.colors.text.primary,
        fontSize: theme.typography.sizes.sm,
        fontWeight: theme.typography.weights.medium,
    },
    textSmall: {
        marginTop: theme.spacing.xs,
        color: theme.colors.text.secondary,
        fontSize: theme.typography.sizes.xs,
    }
});
