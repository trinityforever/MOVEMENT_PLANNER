import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View, Animated } from 'react-native';
import { COLORS, SPACING, BORDER_RADIUS } from '../constants/Theme';

interface SegmentedControlProps {
  options: string[];
  selectedIndex: number;
  onChange: (index: number) => void;
}

export const SegmentedControl: React.FC<SegmentedControlProps> = ({
  options,
  selectedIndex,
  onChange,
}) => {
  return (
    <View style={styles.container}>
      {options.map((option, index) => {
        const isSelected = selectedIndex === index;
        return (
          <TouchableOpacity
            key={option}
            style={[
              styles.segment,
              isSelected && styles.selectedSegment,
            ]}
            onPress={() => onChange(index)}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.text,
                isSelected ? styles.selectedText : styles.unselectedText,
              ]}
            >
              {option}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.pill,
    padding: SPACING.xs,
    alignSelf: 'flex-start',
  },
  segment: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.pill,
  },
  selectedSegment: {
    backgroundColor: COLORS.afterparty,
  },
  text: {
    fontSize: 14,
    fontWeight: '600',
  },
  selectedText: {
    color: COLORS.textPrimary,
  },
  unselectedText: {
    color: COLORS.textSecondary,
  },
});
