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
import { Radius, Spacing, Typography } from '../../constants/theme';
import { useTheme } from '../../store/theme-context';
import { fetchServersList } from '../../services/servers';
import type { ServerItem } from '../../types';

export default function ServersScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();

  const [servers, setServers] = useState<ServerItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'All' | 'Healthy' | 'Warning' | 'Offline'>('All');
  const [refreshing, setRefreshing] = useState(false);

  const loadServers = useCallback(async () => {
    const list = await fetchServersList();
    setServers(list);
  }, []);

  useEffect(() => {
    loadServers();
  }, [loadServers]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadServers();
    setRefreshing(false);
  };

  const filteredServers = useMemo(() => {
    return servers.filter((s) => {
      const matchesSearch =
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.provider.toLowerCase().includes(searchQuery.toLowerCase());

      if (selectedFilter === 'Healthy') return matchesSearch && s.status === 'healthy';
      if (selectedFilter === 'Warning') return matchesSearch && s.status === 'warning';
      if (selectedFilter === 'Offline') return matchesSearch && s.status === 'offline';
      return matchesSearch;
    });
  }, [servers, searchQuery, selectedFilter]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      {/* Header Bar */}
      <View style={[styles.headerBar, { borderBottomColor: colors.borderSubtle }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Servers</Text>
        <TouchableOpacity
          style={[styles.appsShortcut, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}
          onPress={() => router.push('/applications')}
          activeOpacity={0.8}
        >
          <Text style={[styles.appsShortcutText, { color: colors.primary }]}>Apps ›</Text>
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchSection}>
        <View style={[styles.searchBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search servers..."
            placeholderTextColor={colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Text style={[styles.clearIcon, { color: colors.textMuted }]}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filtersSection}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
          {(['All', 'Healthy', 'Warning', 'Offline'] as const).map((filter) => {
            const isSelected = selectedFilter === filter;
            return (
              <TouchableOpacity
                key={filter}
                style={[
                  styles.filterPill,
                  { backgroundColor: colors.surface, borderColor: colors.border },
                  isSelected && { backgroundColor: colors.primaryMuted, borderColor: colors.primary },
                ]}
                onPress={() => setSelectedFilter(filter)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.filterPillText,
                    { color: colors.textSecondary },
                    isSelected && { color: colors.primary, fontWeight: '700' },
                  ]}
                >
                  {filter}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Servers List */}
      <ScrollView
        contentContainerStyle={styles.scrollList}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        {filteredServers.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No servers found</Text>
            <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
              {searchQuery ? `No matches for "${searchQuery}"` : 'No connected server nodes.'}
            </Text>
          </View>
        ) : (
          filteredServers.map((server) => (
            <TouchableOpacity
              key={server.id}
              style={[styles.serverCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={() => router.push(`/server/${server.id}` as any)}
              activeOpacity={0.8}
            >
              <View style={styles.serverLeft}>
                <View style={[styles.serverIconBox, { backgroundColor: colors.surfaceElevated }]}>
                  <Text style={styles.serverIconGlyph}>🖥️</Text>
                </View>
                <View>
                  <Text style={[styles.serverName, { color: colors.text }]}>{server.name}</Text>
                  <Text style={[styles.serverSpec, { color: colors.textMuted }]}>
                    {server.provider} • {server.cpu} • {server.memory}
                  </Text>
                </View>
              </View>

              <View
                style={[
                  styles.statusBadge,
                  {
                    backgroundColor:
                      server.status === 'healthy'
                        ? colors.emeraldMuted
                        : server.status === 'warning'
                        ? colors.amberMuted
                        : colors.roseMuted,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.statusBadgeText,
                    {
                      color:
                        server.status === 'healthy'
                          ? colors.emerald
                          : server.status === 'warning'
                          ? colors.amber
                          : colors.rose,
                    },
                  ]}
                >
                  {server.status === 'healthy' ? 'Healthy' : server.status === 'warning' ? 'Warning' : 'Offline'}
                </Text>
              </View>
            </TouchableOpacity>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
  },
  headerTitle: {
    ...Typography.titleLarge,
    fontSize: 24,
    fontWeight: '800',
  },
  appsShortcut: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  appsShortcutText: {
    ...Typography.caption,
    fontWeight: '700',
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
  clearIcon: {
    fontSize: 14,
    padding: 4,
  },
  filtersSection: {
    paddingVertical: Spacing.sm,
  },
  filterScroll: {
    paddingHorizontal: Spacing.lg,
  },
  filterPill: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: 6,
    borderRadius: Radius.full,
    borderWidth: 1,
    marginRight: Spacing.sm,
  },
  filterPillText: {
    ...Typography.caption,
    fontWeight: '600',
  },
  scrollList: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xxxl,
    gap: Spacing.sm,
  },
  serverCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: Radius.lg,
    borderWidth: 1,
  },
  serverLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    flex: 1,
  },
  serverIconBox: {
    width: 44,
    height: 44,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  serverIconGlyph: {
    fontSize: 22,
  },
  serverName: {
    ...Typography.bodyLarge,
    fontWeight: '700',
  },
  serverSpec: {
    ...Typography.caption,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: Radius.full,
  },
  statusBadgeText: {
    ...Typography.caption,
    fontWeight: '700',
  },
  emptyCard: {
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
