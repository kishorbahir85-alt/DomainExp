import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Radius, Spacing, Typography } from '../../constants/theme';
import { useTheme } from '../../store/theme-context';
import { fetchAlertsList, acknowledgeAlert } from '../../services/monitoring';
import type { AlertItem } from '../../types';

export default function AlertsScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();

  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<'All' | 'Critical' | 'Warning' | 'Resolved'>('All');
  const [refreshing, setRefreshing] = useState(false);

  const loadAlerts = useCallback(async () => {
    const list = await fetchAlertsList();
    setAlerts(list);
  }, []);

  useEffect(() => {
    loadAlerts();
  }, [loadAlerts]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAlerts();
    setRefreshing(false);
  };

  const handleAcknowledge = async (id: string) => {
    await acknowledgeAlert(id);
    setAlerts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: 'acknowledged' } : a)),
    );
  };

  const filteredAlerts = useMemo(() => {
    return alerts.filter((a) => {
      if (selectedFilter === 'Critical') return a.severity === 'critical';
      if (selectedFilter === 'Warning') return a.severity === 'warning';
      if (selectedFilter === 'Resolved') return a.status === 'resolved' || a.status === 'acknowledged';
      return true;
    });
  }, [alerts, selectedFilter]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      {/* Header Bar */}
      <View style={[styles.headerBar, { borderBottomColor: colors.borderSubtle }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Alerts</Text>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filtersSection}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
          {(['All', 'Critical', 'Warning', 'Resolved'] as const).map((filter) => {
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

      {/* Alerts List */}
      <ScrollView
        contentContainerStyle={styles.scrollList}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        {filteredAlerts.length === 0 ? (
          <View style={[styles.emptyBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No alerts</Text>
            <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
              All monitored domains and servers are currently healthy.
            </Text>
          </View>
        ) : (
          filteredAlerts.map((alert) => (
            <View
              key={alert.id}
              style={[
                styles.alertCard,
                { backgroundColor: colors.surface, borderColor: colors.border },
                alert.status === 'acknowledged' && styles.alertCardAcked,
              ]}
            >
              {/* Card Header Row */}
              <View style={styles.cardTopRow}>
                <View style={styles.topRowLeft}>
                  <View
                    style={[
                      styles.alertIconDot,
                      {
                        backgroundColor:
                          alert.severity === 'critical'
                            ? colors.roseMuted
                            : alert.severity === 'warning'
                            ? colors.amberMuted
                            : colors.emeraldMuted,
                      },
                    ]}
                  >
                    <Text style={styles.alertIconGlyph}>
                      {alert.severity === 'critical' ? '🔴' : alert.severity === 'warning' ? '🟠' : '🟢'}
                    </Text>
                  </View>
                  <View>
                    <Text style={[styles.alertTitleText, { color: colors.text }]}>{alert.title}</Text>
                    <Text style={[styles.domainSubtext, { color: colors.textMuted }]}>
                      {alert.domainName}
                    </Text>
                  </View>
                </View>

                <View
                  style={[
                    styles.severityBadge,
                    {
                      backgroundColor:
                        alert.severity === 'critical'
                          ? colors.roseMuted
                          : alert.severity === 'warning'
                          ? colors.amberMuted
                          : colors.emeraldMuted,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.severityBadgeText,
                      {
                        color:
                          alert.severity === 'critical'
                            ? colors.rose
                            : alert.severity === 'warning'
                            ? colors.amber
                            : colors.emerald,
                      },
                    ]}
                  >
                    {alert.severity === 'critical' ? 'Critical' : alert.severity === 'warning' ? 'Warning' : 'Info'}
                  </Text>
                </View>
              </View>

              {/* Detail Text if available */}
              {alert.detail ? (
                <Text style={[styles.detailBody, { color: colors.textSecondary }]}>
                  {alert.detail}
                </Text>
              ) : null}

              {/* Footer Row */}
              <View style={[styles.cardFooter, { borderTopColor: colors.borderSubtle }]}>
                <View
                  style={[
                    styles.timeframePill,
                    {
                      backgroundColor:
                        alert.severity === 'critical' ? colors.roseMuted : colors.surfaceHighlight,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.timeframeText,
                      {
                        color: alert.severity === 'critical' ? colors.rose : colors.textSecondary,
                      },
                    ]}
                  >
                    {alert.timeframeBadge || 'Active notice'}
                  </Text>
                </View>

                <View style={styles.footerRight}>
                  <Text style={[styles.timeAgoText, { color: colors.textMuted }]}>
                    {alert.timeAgo || 'Recently'}
                  </Text>

                  {alert.status === 'active' && (
                    <TouchableOpacity
                      style={[styles.ackBtn, { backgroundColor: colors.surfaceHighlight }]}
                      onPress={() => handleAcknowledge(alert.id)}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.ackBtnText, { color: colors.text }]}>Ack</Text>
                    </TouchableOpacity>
                  )}
                </View>
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
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
  },
  headerTitle: {
    ...Typography.titleLarge,
    fontSize: 24,
    fontWeight: '800',
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
    gap: Spacing.md,
  },
  alertCard: {
    padding: Spacing.lg,
    borderRadius: Radius.xl,
    borderWidth: 1,
  },
  alertCardAcked: {
    opacity: 0.65,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  topRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    flex: 1,
  },
  alertIconDot: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  alertIconGlyph: {
    fontSize: 16,
  },
  alertTitleText: {
    ...Typography.bodyLarge,
    fontWeight: '700',
  },
  domainSubtext: {
    ...Typography.caption,
    marginTop: 2,
  },
  severityBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  severityBadgeText: {
    ...Typography.caption,
    fontWeight: '700',
  },
  detailBody: {
    ...Typography.bodyMedium,
    lineHeight: 19,
    marginVertical: Spacing.sm,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    paddingTop: Spacing.sm,
    marginTop: Spacing.sm,
  },
  timeframePill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.sm,
  },
  timeframeText: {
    ...Typography.caption,
    fontWeight: '700',
  },
  footerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  timeAgoText: {
    ...Typography.caption,
  },
  ackBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.sm,
  },
  ackBtnText: {
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
