import React from 'react';
import { Tabs } from 'expo-router';
import { View, Text, StyleSheet } from 'react-native';
import { Radius, Typography } from '../../constants/theme';
import { useTheme } from '../../store/theme-context';

function TabIcon({ name, focused, activeColor }: { name: string; focused: boolean; activeColor: string }) {
  const getIconGlyph = () => {
    switch (name) {
      case 'dashboard':
        return '🏠';
      case 'domains':
        return '🌐';
      case 'servers':
        return '🖥️';
      case 'alerts':
        return '🔔';
      case 'more':
        return '⋯';
      default:
        return '•';
    }
  };

  return (
    <View style={[styles.iconContainer, focused && { backgroundColor: `${activeColor}15` }]}>
      <Text style={[styles.iconGlyph, focused && { color: activeColor, transform: [{ scale: 1.1 }] }]}>
        {getIconGlyph()}
      </Text>
    </View>
  );
}

export default function TabsLayout() {
  const { colors } = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.tabBarBackground,
          borderTopColor: colors.tabBarBorder,
          borderTopWidth: 1,
          height: 64,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: {
          ...Typography.caption,
          fontWeight: '600',
        },
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Home',
          tabBarIcon: ({ focused }) => (
            <TabIcon name="dashboard" focused={focused} activeColor={colors.primary} />
          ),
        }}
      />
      <Tabs.Screen
        name="domains"
        options={{
          title: 'Domains',
          tabBarIcon: ({ focused }) => (
            <TabIcon name="domains" focused={focused} activeColor={colors.primary} />
          ),
        }}
      />
      <Tabs.Screen
        name="servers"
        options={{
          title: 'Servers',
          tabBarIcon: ({ focused }) => (
            <TabIcon name="servers" focused={focused} activeColor={colors.primary} />
          ),
        }}
      />
      <Tabs.Screen
        name="alerts"
        options={{
          title: 'Alerts',
          tabBarIcon: ({ focused }) => (
            <TabIcon name="alerts" focused={focused} activeColor={colors.primary} />
          ),
        }}
      />
      <Tabs.Screen
        name="more"
        options={{
          title: 'More',
          tabBarIcon: ({ focused }) => (
            <TabIcon name="more" focused={focused} activeColor={colors.primary} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconGlyph: {
    fontSize: 18,
    opacity: 0.75,
  },
});
