import React, { ReactNode } from 'react';
import { StyleSheet, Text, View, Platform } from 'react-native';
import { COLORS } from '../constants/Theme';

interface ScreenLayoutProps {
  title: string;
  children: ReactNode;
}

export default function ScreenLayout({ title, children }: ScreenLayoutProps) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{title.toUpperCase()}</Text>
        <Text style={styles.meta}>DETROIT 2026</Text>
      </View>
      <View style={styles.content}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.acid,
    backgroundColor: COLORS.background,
  },
  title: {
    fontSize: 26,
    color: COLORS.acid,
    fontFamily: Platform.OS === 'web' ? "'Bebas Neue', sans-serif" : undefined,
    fontWeight: Platform.OS !== 'web' ? '900' : undefined,
    letterSpacing: 3,
  },
  meta: {
    fontSize: 9,
    color: COLORS.textSecondary,
    fontFamily: Platform.OS === 'web' ? "'Share Tech Mono', monospace" : undefined,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  content: {
    flex: 1,
  },
});
