import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Radius, Spacing, Typography } from '../constants/theme';
import { useTheme } from '../store/theme-context';
import { fetchApplicationsList } from '../services/applications';
import type { ApplicationItem } from '../types';

export default function ApplicationsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();

  const [apps, setApps] = useState<ApplicationItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const loadApps = useCallback(async () => {
    const list = await fetchApplicationsList();
    setApps(list);
  }, []);

  useEffect(() => {
    loadApps();
  }, [loadApps]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadApps();
    setRefreshing(false);
  };

  const filteredApps = useMemo(() => {
    return apps.filter((a) =>
      a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.environment.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }, [apps, searchQuery]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      {/* Header Bar */}
      <View style={[styles.headerBar, { borderBottomColor: colors.borderSubtle }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton} activeOpacity={0.7}>
          <Text style={[styles.backArrow, { color: colors.text }]}>‹</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Applications</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Search Bar */}
      <View style={styles.searchSection}>
        <View style={[styles.searchBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search applications..."
            placeholderTextColor={colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
          />
        </View>
      </View>

      {/* Applications List */}
      <ScrollView
        contentContainerStyle={styles.scrollList}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        {filteredApps.length === 0 ? (
          <View style={[styles.emptyBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No applications tracked</Text>
            <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
              {searchQuery ? `No matches for "${searchQuery}"` : 'Connect microservices or web apps.'}
            </Text>
          </View>
        ) : (
          filteredApps.map((app) => (
            <View
              key={app.id}
              style={[styles.appCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
            >
              <View style={styles.appLeft}>
                <View style={[styles.appIconBox, { backgroundColor: colors.surfaceElevated }]}>
                  <Text style={styles.appIconGlyph}>📦</Text>
                </View>
                <View>
                  <Text style={[styles.appName, { color: colors.text }]}>{app.name}</Text>
                  <Text style={[styles.envLabel, { color: colors.textMuted }]}>{app.environment}</Text>
                </View>
              </View>

              <View
                style={[
                  styles.statusBadge,
                  {
                    backgroundColor:
                      app.status === 'healthy'
                        ? colors.emeraldMuted
                        : app.status === 'warning'
                        ? colors.amberMuted
                        : colors.roseMuted,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.statusText,
                    {
                      color:
                        app.status === 'healthy'
                          ? colors.emerald
                          : app.status === 'warning'
                          ? colors.amber
                          : colors.rose,
                    },
                  ]}
                >
                  ● {app.status === 'healthy' ? 'Healthy' : app.status === 'warning' ? 'Warning' : 'Error'}
                </Text>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backArrow: {
    fontSize: 28,
    fontWeight: '300',
  },
  headerTitle: {
    ...Typography.titleMedium,
    fontWeight: '800',
    fontSize: 20,
  },
  placeholder: {
    width: 32,
  },
  searchSection: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    height: 42,
  },
  searchIcon: {
    fontSize: 14,
    marginRight: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    ...Typography.bodyMedium,
  },
  scrollList: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxxl,
    gap: Spacing.sm,
  },
  appCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: Radius.lg,
    borderWidth: 1,
  },
  appLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  appIconBox: {
    width: 44,
    height: 44,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  appIconGlyph: {
    fontSize: 22,
  },
  appName: {
    ...Typography.bodyLarge,
    fontWeight: '700',
  },
  envLabel: {
    ...Typography.caption,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: Radius.full,
  },
  statusText: {
    ...Typography.caption,
    fontWeight: '700',
  },
  emptyBox: {
    padding: Spacing.xxl,
    borderRadius: Radius.lg,
    borderWidth: 1,
    alignItems: 'center',
    marginTop: Spacing.lg,
  },
  emptyTitle: {
    ...Typography.titleSmall,
    fontWeight: '700',
  },
  emptySubtitle: {
    ...Typography.bodyMedium,
    marginTop: 4,
  },
});
