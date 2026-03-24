import React from 'react';
import { View, StyleSheet } from 'react-native';
import { theme } from '../../theme/theme';

export default function Card({ children, style }) {
    return (
        <View style={[styles.card, style]}>
            {children}
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: theme.colors.surface.light,
        borderRadius: theme.borderRadius.lg,
        padding: theme.spacing.md,
        marginVertical: theme.spacing.sm,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 3.84,
        elevation: 3, // For Android
        borderWidth: 1,
        borderColor: theme.colors.border,
    }
});
