import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Radius, Spacing, Typography } from '../../constants/theme';
import { useTheme } from '../../store/theme-context';
import { fetchServersList } from '../../services/servers';
import type { ServerItem } from '../../types';

export default function ServerDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();

  const [server, setServer] = useState<ServerItem | null>(null);
  const [activeTab, setActiveTab] = useState<'Overview' | 'Monitoring' | 'Applications'>('Overview');

  useEffect(() => {
    async function loadServer() {
      const list = await fetchServersList();
      const found = list.find((s) => s.id === id) || {
        id: id || 'srv-1',
        name: 'production-api-01',
        provider: 'Hetzner',
        region: 'Germany',
        ipAddress: '159.69.182.44',
        cpu: '4 vCPU',
        memory: '8 GB',
        os: 'Ubuntu 22.04',
        status: 'healthy',
        uptime: '99.98%',
        cpuUsagePercent: 32,
        memoryUsagePercent: 58,
        diskUsagePercent: 44,
        connectedDomains: ['api.example.com', 'example.com'],
      };
      setServer(found as ServerItem);
    }
    loadServer();
  }, [id]);

  if (!server) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading server details...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      {/* Top Header */}
      <View style={[styles.headerBar, { borderBottomColor: colors.borderSubtle }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton} activeOpacity={0.7}>
          <Text style={[styles.backArrow, { color: colors.text }]}>‹</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>{server.name}</Text>
        <TouchableOpacity style={styles.moreButton} activeOpacity={0.7}>
          <Text style={[styles.moreDots, { color: colors.textMuted }]}>⋯</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Server Status Header */}
        <View style={styles.statusRow}>
          <View style={styles.statusLeft}>
            <View style={[styles.serverGlyphBox, { backgroundColor: colors.surfaceElevated }]}>
              <Text style={styles.serverGlyph}>🖥️</Text>
            </View>
            <View style={[styles.statusPill, { backgroundColor: colors.emeraldMuted }]}>
              <View style={[styles.dot, { backgroundColor: colors.emerald }]} />
              <Text style={[styles.statusText, { color: colors.emerald }]}>Healthy</Text>
            </View>
          </View>
          <Text style={[styles.uptimeText, { color: colors.textSecondary }]}>
            Uptime {server.uptime || '99.98%'}
          </Text>
        </View>

        {/* Navigation Tabs */}
        <View style={[styles.tabsRow, { borderBottomColor: colors.borderSubtle }]}>
          {(['Overview', 'Monitoring', 'Applications'] as const).map((tab) => {
            const isSelected = activeTab === tab;
            return (
              <TouchableOpacity
                key={tab}
                style={[
                  styles.tabItem,
                  isSelected && [styles.tabItemActive, { borderBottomColor: colors.primary }],
                ]}
                onPress={() => setActiveTab(tab)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.tabItemText,
                    { color: colors.textSecondary },
                    isSelected && { color: colors.primary, fontWeight: '700' },
                  ]}
                >
                  {tab}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Spec Overview Card */}
        <View style={[styles.specCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.specRow}>
            <Text style={[styles.specLabel, { color: colors.textSecondary }]}>Provider</Text>
            <Text style={[styles.specValue, { color: colors.text }]}>{server.provider}</Text>
          </View>
          <View style={[styles.divider, { backgroundColor: colors.borderSubtle }]} />

          <View style={styles.specRow}>
            <Text style={[styles.specLabel, { color: colors.textSecondary }]}>Region</Text>
            <Text style={[styles.specValue, { color: colors.text }]}>{server.region || 'Germany'}</Text>
          </View>
          <View style={[styles.divider, { backgroundColor: colors.borderSubtle }]} />

          <View style={styles.specRow}>
            <Text style={[styles.specLabel, { color: colors.textSecondary }]}>IP Address</Text>
            <View style={styles.ipGroup}>
              <Text style={[styles.specValue, { color: colors.text }]}>
                {server.ipAddress || '159.69.182.44'}
              </Text>
              <Text style={[styles.copyIcon, { color: colors.primary }]}> 📋</Text>
            </View>
          </View>
          <View style={[styles.divider, { backgroundColor: colors.borderSubtle }]} />

          <View style={styles.specRow}>
            <Text style={[styles.specLabel, { color: colors.textSecondary }]}>CPU</Text>
            <Text style={[styles.specValue, { color: colors.text }]}>{server.cpu || '4 vCPU'}</Text>
          </View>
          <View style={[styles.divider, { backgroundColor: colors.borderSubtle }]} />

          <View style={styles.specRow}>
            <Text style={[styles.specLabel, { color: colors.textSecondary }]}>Memory</Text>
            <Text style={[styles.specValue, { color: colors.text }]}>{server.memory || '8 GB'}</Text>
          </View>
          <View style={[styles.divider, { backgroundColor: colors.borderSubtle }]} />

          <View style={styles.specRow}>
            <Text style={[styles.specLabel, { color: colors.textSecondary }]}>OS</Text>
            <Text style={[styles.specValue, { color: colors.text }]}>{server.os || 'Ubuntu 22.04'}</Text>
          </View>
        </View>

        {/* Resource Usage Section */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Resource Usage</Text>
        </View>

        <View style={[styles.usageCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {/* CPU Usage */}
          <View style={styles.usageRow}>
            <Text style={[styles.usageLabel, { color: colors.textSecondary }]}>CPU</Text>
            <View style={[styles.progressBarTrack, { backgroundColor: colors.surfaceHighlight }]}>
              <View
                style={[
                  styles.progressBarFill,
                  {
                    backgroundColor: colors.primary,
                    width: `${server.cpuUsagePercent ?? 32}%`,
                  },
                ]}
              />
            </View>
            <Text style={[styles.usagePercent, { color: colors.text }]}>{server.cpuUsagePercent ?? 32}%</Text>
          </View>

          {/* Memory Usage */}
          <View style={styles.usageRow}>
            <Text style={[styles.usageLabel, { color: colors.textSecondary }]}>Memory</Text>
            <View style={[styles.progressBarTrack, { backgroundColor: colors.surfaceHighlight }]}>
              <View
                style={[
                  styles.progressBarFill,
                  {
                    backgroundColor: colors.primary,
                    width: `${server.memoryUsagePercent ?? 58}%`,
                  },
                ]}
              />
            </View>
            <Text style={[styles.usagePercent, { color: colors.text }]}>{server.memoryUsagePercent ?? 58}%</Text>
          </View>

          {/* Disk Usage */}
          <View style={styles.usageRow}>
            <Text style={[styles.usageLabel, { color: colors.textSecondary }]}>Disk</Text>
            <View style={[styles.progressBarTrack, { backgroundColor: colors.surfaceHighlight }]}>
              <View
                style={[
                  styles.progressBarFill,
                  {
                    backgroundColor: colors.primary,
                    width: `${server.diskUsagePercent ?? 44}%`,
                  },
                ]}
              />
            </View>
            <Text style={[styles.usagePercent, { color: colors.text }]}>{server.diskUsagePercent ?? 44}%</Text>
          </View>
        </View>

        {/* Connected Domains */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Connected Domains</Text>
        </View>

        <View style={[styles.connectedCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {(server.connectedDomains && server.connectedDomains.length > 0
            ? server.connectedDomains
            : ['api.example.com', 'example.com']
          ).map((domain) => (
            <View key={domain} style={styles.connectedRow}>
              <View style={styles.connectedLeft}>
                <Text style={[styles.plusIcon, { color: colors.primary }]}>🔗</Text>
                <Text style={[styles.connectedDomainText, { color: colors.primary }]}>{domain}</Text>
              </View>
              <Text style={[styles.externalLinkIcon, { color: colors.textMuted }]}>↗</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingText: {
    padding: Spacing.xl,
    textAlign: 'center',
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
    fontSize: 18,
  },
  moreButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moreDots: {
    fontSize: 20,
    fontWeight: '700',
  },
  scrollContent: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxxl,
    gap: Spacing.md,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  serverGlyphBox: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  serverGlyph: {
    fontSize: 20,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.full,
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    ...Typography.caption,
    fontWeight: '700',
  },
  uptimeText: {
    ...Typography.bodySmall,
    fontWeight: '600',
  },
  tabsRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
  },
  tabItem: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabItemActive: {
    borderBottomWidth: 2,
  },
  tabItemText: {
    ...Typography.bodyMedium,
    fontWeight: '600',
  },
  specCard: {
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    gap: Spacing.sm,
  },
  specRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  specLabel: {
    ...Typography.bodyMedium,
  },
  specValue: {
    ...Typography.bodyMedium,
    fontWeight: '700',
  },
  ipGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  copyIcon: {
    fontSize: 14,
  },
  divider: {
    height: 1,
  },
  sectionHeader: {
    marginTop: Spacing.xs,
  },
  sectionTitle: {
    ...Typography.titleSmall,
    fontWeight: '800',
  },
  usageCard: {
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    gap: Spacing.md,
  },
  usageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.md,
  },
  usageLabel: {
    width: 60,
    ...Typography.bodyMedium,
    fontWeight: '600',
  },
  progressBarTrack: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  usagePercent: {
    width: 40,
    textAlign: 'right',
    ...Typography.bodySmall,
    fontWeight: '700',
  },
  connectedCard: {
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    gap: Spacing.md,
  },
  connectedRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  connectedLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  plusIcon: {
    fontSize: 16,
  },
  connectedDomainText: {
    ...Typography.bodyMedium,
    fontWeight: '700',
  },
  externalLinkIcon: {
    fontSize: 16,
  },
});
