import React, { useEffect } from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Platform } from 'react-native';

export default function RootLayout() {
  useEffect(() => {
    if (Platform.OS === 'web') {
      // Inject Google Fonts
      const link = document.createElement('link');
      link.href =
        'https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Share+Tech+Mono&family=Barlow+Condensed:wght@400;700;900&display=swap';
      link.rel = 'stylesheet';
      document.head.appendChild(link);

      // Inject global acid-rave CSS: scanlines + CRT vignette
      const style = document.createElement('style');
      style.textContent = `
        body, html { background: #000 !important; }
        body::before {
          content: '';
          position: fixed;
          top: 0; left: 0;
          width: 100%; height: 100%;
          background: repeating-linear-gradient(
            0deg,
            transparent,
            transparent 2px,
            rgba(0,0,0,0.15) 2px,
            rgba(0,0,0,0.15) 4px
          );
          pointer-events: none;
          z-index: 9000;
          animation: scanroll 8s linear infinite;
        }
        @keyframes scanroll {
          0%   { background-position: 0 0; }
          100% { background-position: 0 100px; }
        }
        body::after {
          content: '';
          position: fixed;
          top: 0; left: 0; width: 100%; height: 100%;
          background: radial-gradient(ellipse at center, transparent 60%, rgba(0,0,0,0.65) 100%);
          pointer-events: none;
          z-index: 8999;
        }
      `;
      document.head.appendChild(style);
    }
  }, []);

  const monoFont = Platform.OS === 'web' ? "'Share Tech Mono', monospace" : undefined;
  const displayFont = Platform.OS === 'web' ? "'Bebas Neue', sans-serif" : undefined;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#CCFF00',
        tabBarInactiveTintColor: 'rgba(204,255,0,0.3)',
        headerStyle: {
          backgroundColor: '#000',
          borderBottomWidth: 1,
          borderBottomColor: '#CCFF00',
        } as any,
        headerTintColor: '#CCFF00',
        headerTitleStyle: {
          fontFamily: displayFont,
          fontSize: 20,
          letterSpacing: 3,
        },
        tabBarStyle: {
          backgroundColor: '#000',
          borderTopWidth: 1,
          borderTopColor: 'rgba(204,255,0,0.25)',
        },
        tabBarLabelStyle: {
          fontFamily: monoFont,
          fontSize: 9,
          letterSpacing: 1,
          textTransform: 'uppercase',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Schedule',
          tabBarIcon: ({ color }) => <Ionicons name="calendar" size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="plan"
        options={{
          title: 'My Plan',
          tabBarIcon: ({ color }) => <Ionicons name="list" size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="social"
        options={{ href: null }}
      />
      <Tabs.Screen
        name="map"
        options={{
          title: 'Map',
          tabBarIcon: ({ color }) => <Ionicons name="map" size={22} color={color} />,
        }}
      />
    </Tabs>
  );
}
