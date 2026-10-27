import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Radius, Spacing, Typography } from '../../constants/theme';
import { useTheme } from '../../store/theme-context';
import { fetchDomainsList } from '../../services/domains';
import type { DomainItem } from '../../types';

export default function DomainDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();

  const [domain, setDomain] = useState<DomainItem | null>(null);

  useEffect(() => {
    async function loadDomain() {
      const list = await fetchDomainsList();
      const found = list.find((d) => d.id === id) || {
        id: id || 'dom-1',
        name: 'example.com',
        tld: '.com',
        registrar: 'GoDaddy',
        autoRenew: true,
        registrationDate: '14 Oct 2025',
        expiresAt: '14 Oct 2026',
        daysRemaining: 19,
        renewalPrice: 14.99,
        currency: '$',
        status: 'safe',
        dnsProvider: 'Healthy',
        sslStatus: 'active',
        httpStatus: '200 OK',
        rdapStatus: 'Synchronized',
      };
      setDomain(found as DomainItem);
    }
    loadDomain();
  }, [id]);

  if (!domain) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading domain details...</Text>
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
        <Text style={[styles.headerTitle, { color: colors.text }]}>{domain.name}</Text>
        <TouchableOpacity style={styles.moreButton} activeOpacity={0.7}>
          <Text style={[styles.moreDots, { color: colors.textMuted }]}>⋯</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Banner Card */}
        <View style={[styles.bannerCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Image
            source={require('../../../assets/images/empty-domains.jpg')}
            style={styles.bannerImage}
            resizeMode="cover"
          />
        </View>

        {/* Status Bar */}
        <View style={styles.statusRow}>
          <View style={[styles.statusPill, { backgroundColor: colors.emeraldMuted, borderColor: colors.emerald }]}>
            <View style={[styles.statusDot, { backgroundColor: colors.emerald }]} />
            <Text style={[styles.statusText, { color: colors.emerald }]}>
              {domain.status === 'safe' ? 'Healthy' : 'Needs Attention'}
            </Text>
          </View>

          <View style={styles.expiryRow}>
            <Text style={[styles.clockIcon, { color: colors.emerald }]}>⏱</Text>
            <Text style={[styles.expiryText, { color: colors.emerald }]}>
              {domain.daysRemaining} days left
            </Text>
          </View>
        </View>

        {/* Registration Spec Table */}
        <View style={[styles.specCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.specRow}>
            <Text style={[styles.specLabel, { color: colors.textSecondary }]}>Registrar</Text>
            <Text style={[styles.specValue, { color: colors.text }]}>{domain.registrar}</Text>
          </View>
          <View style={[styles.rowDivider, { backgroundColor: colors.borderSubtle }]} />

          <View style={styles.specRow}>
            <Text style={[styles.specLabel, { color: colors.textSecondary }]}>Registration Date</Text>
            <Text style={[styles.specValue, { color: colors.text }]}>
              {domain.registrationDate || '14 Oct 2025'}
            </Text>
          </View>
          <View style={[styles.rowDivider, { backgroundColor: colors.borderSubtle }]} />

          <View style={styles.specRow}>
            <Text style={[styles.specLabel, { color: colors.textSecondary }]}>Expiration Date</Text>
            <Text style={[styles.specValue, { color: colors.text }]}>
              {domain.expiresAt ? new Date(domain.expiresAt).toLocaleDateString() : '14 Oct 2026'}
            </Text>
          </View>
          <View style={[styles.rowDivider, { backgroundColor: colors.borderSubtle }]} />

          <View style={styles.specRow}>
            <Text style={[styles.specLabel, { color: colors.textSecondary }]}>Auto Renewal</Text>
            <Text style={[styles.specValue, { color: colors.emerald }]}>
              {domain.autoRenew ? 'Enabled' : 'Disabled'}
            </Text>
          </View>
        </View>

        {/* Health Check Diagnostics List */}
        <View style={styles.diagnosticsList}>
          {/* DNS Card */}
          <View style={[styles.diagCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.diagLeft}>
              <View style={[styles.diagIconBox, { backgroundColor: colors.emeraldMuted }]}>
                <Text style={styles.diagIcon}>🛡️</Text>
              </View>
              <Text style={[styles.diagTitle, { color: colors.text }]}>DNS</Text>
            </View>
            <View style={[styles.diagStatusPill, { backgroundColor: colors.emeraldMuted }]}>
              <Text style={[styles.diagStatusText, { color: colors.emerald }]}>Healthy</Text>
            </View>
          </View>

          {/* SSL Card */}
          <View style={[styles.diagCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.diagLeft}>
              <View style={[styles.diagIconBox, { backgroundColor: colors.emeraldMuted }]}>
                <Text style={styles.diagIcon}>🔒</Text>
              </View>
              <Text style={[styles.diagTitle, { color: colors.text }]}>SSL</Text>
            </View>
            <View style={[styles.diagStatusPill, { backgroundColor: colors.emeraldMuted }]}>
              <Text style={[styles.diagStatusText, { color: colors.emerald }]}>Valid</Text>
            </View>
          </View>

          {/* HTTP Card */}
          <View style={[styles.diagCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.diagLeft}>
              <View style={[styles.diagIconBox, { backgroundColor: colors.emeraldMuted }]}>
                <Text style={styles.diagIcon}>🌐</Text>
              </View>
              <Text style={[styles.diagTitle, { color: colors.text }]}>HTTP</Text>
            </View>
            <View style={[styles.diagStatusPill, { backgroundColor: colors.emeraldMuted }]}>
              <Text style={[styles.diagStatusText, { color: colors.emerald }]}>200 OK</Text>
            </View>
          </View>

          {/* RDAP Card */}
          <View style={[styles.diagCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.diagLeft}>
              <View style={[styles.diagIconBox, { backgroundColor: colors.primaryMuted }]}>
                <Text style={styles.diagIcon}>ℹ️</Text>
              </View>
              <Text style={[styles.diagTitle, { color: colors.text }]}>RDAP</Text>
            </View>
            <TouchableOpacity activeOpacity={0.7}>
              <Text style={[styles.rdapLink, { color: colors.primary }]}>View Details ›</Text>
            </TouchableOpacity>
          </View>
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
    ...Typography.bodyMedium,
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
    lineHeight: 30,
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
  bannerCard: {
    borderRadius: Radius.xl,
    overflow: 'hidden',
    height: 140,
    borderWidth: 1,
  },
  bannerImage: {
    width: '100%',
    height: '100%',
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.full,
    borderWidth: 1,
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    ...Typography.bodySmall,
    fontWeight: '700',
  },
  expiryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  clockIcon: {
    fontSize: 14,
  },
  expiryText: {
    ...Typography.bodySmall,
    fontWeight: '700',
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
  rowDivider: {
    height: 1,
  },
  diagnosticsList: {
    gap: Spacing.sm,
  },
  diagCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: Radius.lg,
    borderWidth: 1,
  },
  diagLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  diagIconBox: {
    width: 36,
    height: 36,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  diagIcon: {
    fontSize: 18,
  },
  diagTitle: {
    ...Typography.bodyLarge,
    fontWeight: '700',
  },
  diagStatusPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.md,
  },
  diagStatusText: {
    ...Typography.caption,
    fontWeight: '700',
  },
  rdapLink: {
    ...Typography.caption,
    fontWeight: '700',
  },
});
