import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View, Platform } from 'react-native';
import { COLORS } from '../constants/Theme';

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
        const isLast = index === options.length - 1;
        return (
          <TouchableOpacity
            key={option}
            style={[styles.segment, isSelected && styles.selectedSegment, !isLast && styles.segmentBorder]}
            onPress={() => onChange(index)}
            activeOpacity={0.7}
          >
            <Text style={[styles.text, isSelected ? styles.selectedText : styles.unselectedText]}>
              {option.toUpperCase()}
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
    backgroundColor: '#000',
    borderWidth: 1,
    borderColor: COLORS.acid,
    alignSelf: 'flex-start',
  },
  segment: {
    paddingHorizontal: 18,
    paddingVertical: 8,
  },
  segmentBorder: {
    borderRightWidth: 1,
    borderRightColor: 'rgba(204,255,0,0.35)',
  },
  selectedSegment: {
    backgroundColor: COLORS.acid,
  },
  text: {
    fontSize: 11,
    letterSpacing: 2,
    fontFamily: Platform.OS === 'web' ? "'Share Tech Mono', monospace" : undefined,
    fontWeight: '700',
  },
  selectedText: {
    color: '#000',
  },
  unselectedText: {
    color: COLORS.acid,
  },
});
