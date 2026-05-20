import React from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableOpacityProps,
  ActivityIndicator,
} from 'react-native';
import { COLORS, SPACING, BORDER_RADIUS } from '../constants/Theme';

interface ButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'afterparty' | 'dayParty' | 'sunrise' | 'festival';
  loading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  variant = 'primary',
  loading = false,
  style,
  disabled,
  ...props
}) => {
  const getVariantStyle = () => {
    switch (variant) {
      case 'secondary':
        return styles.secondary;
      case 'outline':
        return styles.outline;
      case 'afterparty':
        return { backgroundColor: COLORS.afterparty };
      case 'dayParty':
        return { backgroundColor: COLORS.dayParty };
      case 'sunrise':
        return { backgroundColor: COLORS.sunrise };
      case 'festival':
        return { backgroundColor: COLORS.festival };
      case 'primary':
      default:
        return styles.primary;
    }
  };

  const getTextStyle = () => {
    if (variant === 'outline') {
      return styles.outlineText;
    }
    return styles.text;
  };

  return (
    <TouchableOpacity
      style={[
        styles.base,
        getVariantStyle(),
        disabled && styles.disabled,
        style,
      ]}
      disabled={disabled || loading}
      activeOpacity={0.8}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'outline' ? COLORS.afterparty : COLORS.textPrimary} />
      ) : (
        <Text style={[getTextStyle()]}>{title}</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  primary: {
    backgroundColor: COLORS.afterparty,
  },
  secondary: {
    backgroundColor: COLORS.surface,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: COLORS.afterparty,
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  outlineText: {
    color: COLORS.afterparty,
    fontSize: 16,
    fontWeight: '700',
  },
});
