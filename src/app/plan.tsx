import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import ScreenLayout from '../components/ScreenLayout';
import { COLORS, SPACING, BORDER_RADIUS } from '../constants/Theme';

export default function PlanScreen() {
  return (
    <ScreenLayout title="Plan">
      <View style={styles.container}>
        <View style={styles.graphicContainer}>
          <View style={styles.outerCircle}>
            <View style={styles.innerCircle}>
              <Text style={styles.emoji}>📅</Text>
            </View>
          </View>
        </View>
        <Text style={styles.message}>
          Coming May 13 — come back once you've downloaded the update.
        </Text>
      </View>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 80,
  },
  graphicContainer: {
    marginBottom: SPACING.xl,
  },
  outerCircle: {
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: COLORS.afterparty,
    shadowColor: COLORS.afterparty,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  innerCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  emoji: {
    fontSize: 72,
  },
  message: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.textPrimary,
    textAlign: 'center',
    lineHeight: 30,
    paddingHorizontal: SPACING.xl,
  },
});
