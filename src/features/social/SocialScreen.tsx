import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { COLORS, SPACING } from '../../constants/Theme';

export default function SocialScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.message}>Who's Going launches May 13 — come back once you've downloaded the update.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  message: {
    fontSize: 18,
    textAlign: 'center',
    color: COLORS.textSecondary,
    lineHeight: 28,
  },
});
