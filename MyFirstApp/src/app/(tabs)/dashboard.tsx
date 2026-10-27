import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  Image,
  ImageBackground,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Radius, Spacing, Typography } from '../../constants/theme';
import { useTheme } from '../../store/theme-context';
import { useAuth } from '../../store/auth-context';
import { BrandLogo } from '../../components/ui/BrandLogo';
import { fetchInventorySummary } from '../../services/monitoring';
import { fetchDomainsList } from '../../services/domains';
import { fetchServersList } from '../../services/servers';
import { fetchApplicationsList } from '../../services/applications';
import { fetchAlertsList } from '../../services/monitoring';
import type { InventorySummary, DomainItem, ServerItem, ApplicationItem, AlertItem } from '../../types';

// Micro vertical bar-chart component matching the mockup UI
function MicroBarChart({ color = '#3b82f6' }: { color?: string }) {
  const bars = [0.35, 0.55, 0.75, 0.45, 0.95];
  return (
    <View style={styles.chartContainer}>
      {bars.map((heightFraction, idx) => (
        <View
          key={idx}
          style={[
            styles.chartBar,
            {
              height: 22 * heightFraction,
              backgroundColor: color,
              opacity: 0.3 + heightFraction * 0.7,
            },
          ]}
        />
      ))}
    </View>
  );
}

function formatRelativeTime(dateStr?: string): string {
  if (!dateStr) return 'Just now';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function DashboardScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { user } = useAuth();

  const [summary, setSummary] = useState<InventorySummary | null>(null);
  const [domains, setDomains] = useState<DomainItem[]>([]);
  const [servers, setServers] = useState<ServerItem[]>([]);
  const [apps, setApps] = useState<ApplicationItem[]>([]);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [sumData, domList, srvList, appList, altList] = await Promise.all([
        fetchInventorySummary(),
        fetchDomainsList(),
        fetchServersList(),
        fetchApplicationsList(),
        fetchAlertsList(),
      ]);
      setSummary(sumData);
      setDomains(domList);
      setServers(srvList);
      setApps(appList);
      setAlerts(altList);
    } catch {
      // API fallback handles offline gracefully
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  // Time-aware greeting
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return { text: 'Good Morning', icon: '☀️' };
    if (hour >= 12 && hour < 18) return { text: 'Good Afternoon', icon: '🌤️' };
    return { text: 'Good Evening', icon: '🌙' };
  }, []);

  // Real metric counts
  const totalDomains = summary?.domains || domains.length;
  const totalServers = summary?.servers || servers.length;
  const totalApps = summary?.applications || apps.length;
  const totalAlerts = summary?.alerts || alerts.length;

  // Expiring soon domains
  const expiringDomains = useMemo(() => {
    return [...domains]
      .filter((d) => (d.daysRemaining || 999) <= 60)
      .sort((a, b) => (a.daysRemaining || 999) - (b.daysRemaining || 999))
      .slice(0, 4);
  }, [domains]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      {/* Top Header Bar */}
      <View style={[styles.headerBar, { borderBottomColor: colors.borderSubtle }]}>
        <View style={styles.headerLeft}>
          <BrandLogo size={28} />
          <Text style={[styles.brandText, { color: colors.text }]}>DomainPulse</Text>
        </View>

        <View style={styles.headerRight}>
          <TouchableOpacity
            style={[styles.bellButton, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}
            onPress={() => router.push('/(tabs)/alerts')}
            activeOpacity={0.7}
          >
            <Text style={styles.bellIcon}>🔔</Text>
            {totalAlerts > 0 && <View style={styles.unreadDot} />}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.avatarButton, { backgroundColor: '#e0f2fe', borderColor: '#38bdf8' }]}
            onPress={() => router.push('/(tabs)/more')}
            activeOpacity={0.7}
          >
            <Text style={styles.avatarText}>
              {(user?.displayName || user?.email || 'AK').substring(0, 2).toUpperCase()}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Greeting Card */}
        <ImageBackground
          source={require('../../../assets/images/hero-card-bg.png')}
          style={styles.heroCard}
          imageStyle={styles.heroCardImage}
          resizeMode="cover"
        >
          <View style={styles.heroLeft}>
            <Text style={styles.greetingTitle}>
              {greeting.text} {greeting.icon}
            </Text>
            <Text style={styles.heroSubtitle}>
              All infrastructure nodes and domain portfolios are currently synchronized.
            </Text>

            <TouchableOpacity
              style={styles.statusPill}
              onPress={() => router.push('/(tabs)/servers')}
              activeOpacity={0.8}
            >
              <View style={styles.greenPulseDot} />
              <Text style={styles.statusPillText}>All Systems Operational</Text>
              <Text style={styles.statusPillChevron}>›</Text>
            </TouchableOpacity>
          </View>
        </ImageBackground>

        {/* 4 Stat Cards (2x2 Grid) */}
        <View style={styles.statsGrid}>
          {/* Card 1: Domains */}
          <TouchableOpacity
            style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={() => router.push('/(tabs)/domains')}
            activeOpacity={0.85}
          >
            <View style={styles.statCardHeader}>
              <View style={[styles.iconBadge, { backgroundColor: '#e0f2fe' }]}>
                <Text style={styles.iconGlyph}>🌐</Text>
              </View>
              <View style={[styles.arrowCircle, { backgroundColor: '#f0f9ff' }]}>
                <Text style={[styles.arrowCircleText, { color: '#0284c7' }]}>→</Text>
              </View>
            </View>

            <View style={styles.statCardBottom}>
              <View>
                <Text style={[styles.statNumber, { color: colors.text }]}>{totalDomains}</Text>
                <Text style={[styles.statSublabel, { color: colors.textSecondary }]}>Total Domains</Text>
              </View>
              <MicroBarChart color="#0284c7" />
            </View>
          </TouchableOpacity>

          {/* Card 2: Servers */}
          <TouchableOpacity
            style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={() => router.push('/(tabs)/servers')}
            activeOpacity={0.85}
          >
            <View style={styles.statCardHeader}>
              <View style={[styles.iconBadge, { backgroundColor: '#f3e8ff' }]}>
                <Text style={styles.iconGlyph}>🖥️</Text>
              </View>
              <View style={[styles.arrowCircle, { backgroundColor: '#faf5ff' }]}>
                <Text style={[styles.arrowCircleText, { color: '#9333ea' }]}>→</Text>
              </View>
            </View>

            <View style={styles.statCardBottom}>
              <View>
                <Text style={[styles.statNumber, { color: colors.text }]}>{totalServers}</Text>
                <Text style={[styles.statSublabel, { color: colors.textSecondary }]}>Active Servers</Text>
              </View>
              <MicroBarChart color="#9333ea" />
            </View>
          </TouchableOpacity>

          {/* Card 3: Applications */}
          <TouchableOpacity
            style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={() => router.push('/applications')}
            activeOpacity={0.85}
          >
            <View style={styles.statCardHeader}>
              <View style={[styles.iconBadge, { backgroundColor: '#fef3c7' }]}>
                <Text style={styles.iconGlyph}>📦</Text>
              </View>
              <View style={[styles.arrowCircle, { backgroundColor: '#fffbeb' }]}>
                <Text style={[styles.arrowCircleText, { color: '#d97706' }]}>→</Text>
              </View>
            </View>

            <View style={styles.statCardBottom}>
              <View>
                <Text style={[styles.statNumber, { color: colors.text }]}>{totalApps}</Text>
                <Text style={[styles.statSublabel, { color: colors.textSecondary }]}>Total Applications</Text>
              </View>
              <MicroBarChart color="#d97706" />
            </View>
          </TouchableOpacity>

          {/* Card 4: Alerts */}
          <TouchableOpacity
            style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={() => router.push('/(tabs)/alerts')}
            activeOpacity={0.85}
          >
            <View style={styles.statCardHeader}>
              <View style={[styles.iconBadge, { backgroundColor: '#ffe4e6' }]}>
                <Text style={styles.iconGlyph}>🔔</Text>
              </View>
              <View style={[styles.arrowCircle, { backgroundColor: '#fff1f2' }]}>
                <Text style={[styles.arrowCircleText, { color: '#e11d48' }]}>→</Text>
              </View>
            </View>

            <View style={styles.statCardBottom}>
              <View>
                <Text style={[styles.statNumber, { color: colors.text }]}>{totalAlerts}</Text>
                <Text style={[styles.statSublabel, { color: colors.textSecondary }]}>Open Alerts</Text>
              </View>
              <MicroBarChart color="#e11d48" />
            </View>
          </TouchableOpacity>
        </View>

        {/* Expiring Soon Section */}
        <View style={styles.sectionHeader}>
          <View style={styles.sectionHeaderLeft}>
            <Text style={styles.sectionIcon}>🕒</Text>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Expiring Soon</Text>
          </View>
          <TouchableOpacity onPress={() => router.push('/(tabs)/domains')} activeOpacity={0.7}>
            <Text style={[styles.viewAllLink, { color: colors.primary }]}>View All →</Text>
          </TouchableOpacity>
        </View>

        {expiringDomains.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.emptyIconBox}>
              <Text style={styles.emptyIcon}>🔍</Text>
            </View>
            <View style={styles.emptyTextBox}>
              <Text style={[styles.emptyTitle, { color: colors.text }]}>
                No upcoming domain expirations detected.
              </Text>
              <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
                You're all up to date! 🎉
              </Text>
            </View>
          </View>
        ) : (
          expiringDomains.map((domain) => (
            <TouchableOpacity
              key={domain.id}
              style={[styles.expiringRow, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={() => router.push(`/domain/${domain.id}` as any)}
              activeOpacity={0.8}
            >
              <View style={styles.expiringLeft}>
                <View style={[styles.domainIconBadge, { backgroundColor: colors.primaryMuted }]}>
                  <Text style={styles.domainIconGlyph}>🌐</Text>
                </View>
                <View>
                  <Text style={[styles.domainName, { color: colors.text }]}>{domain.name}</Text>
                  <Text
                    style={[
                      styles.expiryTag,
                      { color: (domain.daysRemaining || 99) <= 7 ? '#e11d48' : '#10b981' },
                    ]}
                  >
                    Expires in {domain.daysRemaining} days
                  </Text>
                </View>
              </View>
              <Text style={[styles.chevronArrow, { color: colors.textMuted }]}>›</Text>
            </TouchableOpacity>
          ))
        )}

        {/* Recent Activity Section */}
        <View style={[styles.sectionHeader, { marginTop: Spacing.xl }]}>
          <View style={styles.sectionHeaderLeft}>
            <Text style={styles.sectionIcon}>📈</Text>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Recent Activity</Text>
          </View>
          <TouchableOpacity onPress={() => router.push('/(tabs)/alerts')} activeOpacity={0.7}>
            <Text style={[styles.viewAllLink, { color: colors.primary }]}>View All →</Text>
          </TouchableOpacity>
        </View>

        {alerts.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={[styles.emptyIconBox, { backgroundColor: '#f0fdf4' }]}>
              <Text style={styles.emptyIcon}>⚡</Text>
            </View>
            <View style={styles.emptyTextBox}>
              <Text style={[styles.emptyTitle, { color: colors.text }]}>
                No recent activity recorded.
              </Text>
              <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
                Infrastructure events and system alerts will appear here in real-time.
              </Text>
            </View>
          </View>
        ) : (
          <View style={[styles.activityCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            {alerts.slice(0, 5).map((item, idx) => (
              <React.Fragment key={item.id}>
                {idx > 0 && <View style={[styles.activityDivider, { backgroundColor: colors.borderSubtle }]} />}
                <TouchableOpacity
                  style={styles.activityItem}
                  onPress={() => router.push('/(tabs)/alerts')}
                  activeOpacity={0.7}
                >
                  <View
                    style={[
                      styles.activityIconBox,
                      {
                        backgroundColor:
                          item.severity === 'critical'
                            ? '#ffe4e6'
                            : item.severity === 'warning'
                            ? '#fef3c7'
                            : '#e0f2fe',
                      },
                    ]}
                  >
                    <Text style={styles.activityGlyph}>
                      {item.severity === 'critical' ? '🚨' : item.severity === 'warning' ? '⚠️' : '🔔'}
                    </Text>
                  </View>
                  <View style={styles.activityCenter}>
                    <Text style={[styles.activityTitle, { color: colors.text }]} numberOfLines={1}>
                      {item.title}
                    </Text>
                    {item.detail ? (
                      <Text style={[styles.activitySubtitle, { color: colors.textSecondary }]} numberOfLines={1}>
                        {item.detail}
                      </Text>
                    ) : null}
                  </View>
                  <Text style={[styles.activityTime, { color: colors.textMuted }]}>
                    {formatRelativeTime(item.createdAt)}
                  </Text>
                </TouchableOpacity>
              </React.Fragment>
            ))}
          </View>
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
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  brandText: {
    ...Typography.titleMedium,
    fontWeight: '800',
    fontSize: 21,
    letterSpacing: -0.4,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  bellButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  bellIcon: {
    fontSize: 18,
  },
  unreadDot: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ef4444',
  },
  avatarButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    ...Typography.caption,
    color: '#0284c7',
    fontWeight: '800',
    fontSize: 13,
  },
  scrollContent: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxxl,
  },
  heroCard: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#bae6fd',
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    minHeight: 145,
    overflow: 'hidden',
    justifyContent: 'center',
    shadowColor: '#38bdf8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
  },
  heroCardImage: {
    borderRadius: 20,
  },
  heroLeft: {
    maxWidth: '65%',
    zIndex: 2,
  },
  greetingTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.3,
  },
  heroSubtitle: {
    fontSize: 13,
    color: '#334155',
    lineHeight: 18,
    marginTop: 6,
    marginBottom: 14,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.full,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.8)',
    gap: 6,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  greenPulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10b981',
  },
  statusPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0f172a',
  },
  statusPillChevron: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '700',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  statCard: {
    width: '47.5%',
    borderRadius: 18,
    borderWidth: 1,
    padding: Spacing.md,
    justifyContent: 'space-between',
    minHeight: 115,
  },
  statCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  iconBadge: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconGlyph: {
    fontSize: 19,
  },
  arrowCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowCircleText: {
    fontSize: 13,
    fontWeight: '800',
  },
  statCardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: Spacing.md,
  },
  statNumber: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  statSublabel: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  chartContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 2.5,
    paddingBottom: 2,
  },
  chartBar: {
    width: 3.5,
    borderRadius: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sectionIcon: {
    fontSize: 18,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  viewAllLink: {
    fontSize: 13,
    fontWeight: '700',
  },
  emptyCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  emptyIconBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyIcon: {
    fontSize: 24,
  },
  emptyTextBox: {
    flex: 1,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  emptySubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  expiringRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: Spacing.sm,
  },
  expiringLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  domainIconBadge: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  domainIconGlyph: {
    fontSize: 18,
  },
  domainName: {
    fontSize: 15,
    fontWeight: '700',
  },
  expiryTag: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  chevronArrow: {
    fontSize: 22,
    fontWeight: '300',
  },
  activityCard: {
    borderRadius: 18,
    borderWidth: 1,
    paddingVertical: Spacing.xs,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: 12,
    gap: Spacing.md,
  },
  activityIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityGlyph: {
    fontSize: 16,
  },
  activityCenter: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  activitySubtitle: {
    fontSize: 11,
    marginTop: 1,
  },
  activityTime: {
    fontSize: 11,
    fontWeight: '500',
  },
  activityDivider: {
    height: 1,
    marginHorizontal: Spacing.lg,
  },
});
