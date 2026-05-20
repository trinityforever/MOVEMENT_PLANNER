import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { COLORS, SPACING, BORDER_RADIUS } from '../constants/Theme';

interface BadgeProps {
  label: string;
  variant?: 'afterparty' | 'dayParty' | 'sunrise' | 'festival' | 'surface' | 'default';
  style?: ViewStyle;
}

export const Badge: React.FC<BadgeProps> = ({
  label,
  variant = 'default',
  style,
}) => {
  const getVariantStyle = () => {
    switch (variant) {
      case 'afterparty':
        return { backgroundColor: COLORS.afterparty };
      case 'dayParty':
        return { backgroundColor: COLORS.dayParty };
      case 'sunrise':
        return { backgroundColor: COLORS.sunrise };
      case 'festival':
        return { backgroundColor: COLORS.festival };
      case 'surface':
        return { backgroundColor: COLORS.surface };
      case 'default':
      default:
        return { backgroundColor: COLORS.textSecondary };
    }
  };

  return (
    <View style={[styles.container, getVariantStyle(), style]}>
      <Text style={styles.text}>{label.toUpperCase()}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.sm,
    alignSelf: 'flex-start',
  },
  text: {
    color: COLORS.textPrimary,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});
