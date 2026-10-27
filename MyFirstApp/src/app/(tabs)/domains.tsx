import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Modal,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Radius, Spacing, Typography } from '../../constants/theme';
import { useTheme } from '../../store/theme-context';
import { fetchDomainsList, createDomain } from '../../services/domains';
import type { DomainItem } from '../../types';

export default function DomainsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();

  const [domains, setDomains] = useState<DomainItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'All' | 'Expiring' | 'Healthy' | 'Issues'>('All');
  const [refreshing, setRefreshing] = useState(false);

  // Add Domain Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newDomainName, setNewDomainName] = useState('');
  const [newRegistrar, setNewRegistrar] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const loadDomains = useCallback(async () => {
    const list = await fetchDomainsList();
    setDomains(list);
  }, []);

  useEffect(() => {
    loadDomains();
  }, [loadDomains]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDomains();
    setRefreshing(false);
  };

  const filteredDomains = useMemo(() => {
    return domains.filter((d) => {
      const matchesSearch =
        d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.registrar.toLowerCase().includes(searchQuery.toLowerCase());

      if (selectedFilter === 'Expiring') return matchesSearch && (d.daysRemaining || 99) <= 30;
      if (selectedFilter === 'Healthy') return matchesSearch && (d.daysRemaining || 99) > 30;
      if (selectedFilter === 'Issues') return matchesSearch && d.status === 'critical';
      return matchesSearch;
    });
  }, [domains, searchQuery, selectedFilter]);

  const handleAddDomain = async () => {
    if (!newDomainName.trim()) return;
    setIsAdding(true);
    try {
      const created = await createDomain({
        name: newDomainName.trim(),
        registrar: newRegistrar.trim() || 'GoDaddy',
        autoRenew: true,
      });
      setDomains((prev) => [created, ...prev]);
      setNewDomainName('');
      setNewRegistrar('');
      setIsAddModalOpen(false);
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      {/* Header Bar */}
      <View style={[styles.headerBar, { borderBottomColor: colors.borderSubtle }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Domains</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={[styles.finderButton, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}
            onPress={() => router.push('/finder')}
            activeOpacity={0.8}
          >
            <Text style={styles.finderButtonIcon}>🔍</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.addButtonSquare, { backgroundColor: colors.primary }]}
            onPress={() => setIsAddModalOpen(true)}
            activeOpacity={0.8}
          >
            <Text style={[styles.addButtonIcon, { color: colors.textInverse }]}>+</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Search Input */}
      <View style={styles.searchSection}>
        <View style={[styles.searchBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search domains..."
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
          {(['All', 'Expiring', 'Healthy', 'Issues'] as const).map((filter) => {
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

      {/* Domain Cards List */}
      <ScrollView
        contentContainerStyle={styles.scrollList}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        {filteredDomains.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No domains found</Text>
            <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
              {searchQuery ? `No matches for "${searchQuery}"` : 'Track or register your first domain.'}
            </Text>
            <TouchableOpacity
              style={[styles.emptyActionBtn, { backgroundColor: colors.primary }]}
              onPress={() => setIsAddModalOpen(true)}
              activeOpacity={0.8}
            >
              <Text style={[styles.emptyActionText, { color: colors.textInverse }]}>+ Add Domain</Text>
            </TouchableOpacity>
          </View>
        ) : (
          filteredDomains.map((domain) => (
            <TouchableOpacity
              key={domain.id}
              style={[styles.domainItem, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={() => router.push(`/domain/${domain.id}` as any)}
              activeOpacity={0.8}
            >
              <View style={styles.domainLeft}>
                <View style={[styles.domainThumbBox, { backgroundColor: colors.surfaceElevated }]}>
                  <Text style={styles.domainIconGlyph}>🌐</Text>
                </View>
                <View>
                  <Text style={[styles.domainName, { color: colors.text }]}>{domain.name}</Text>
                  <Text style={[styles.registrarLabel, { color: colors.textMuted }]}>
                    ● {domain.registrar}
                  </Text>
                </View>
              </View>

              <View style={styles.domainRight}>
                <View
                  style={[
                    styles.daysBadge,
                    {
                      backgroundColor:
                        (domain.daysRemaining || 99) <= 7
                          ? colors.roseMuted
                          : (domain.daysRemaining || 99) <= 30
                          ? colors.amberMuted
                          : colors.emeraldMuted,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.daysBadgeText,
                      {
                        color:
                          (domain.daysRemaining || 99) <= 7
                            ? colors.rose
                            : (domain.daysRemaining || 99) <= 30
                            ? colors.amber
                            : colors.emerald,
                      },
                    ]}
                  >
                    {domain.daysRemaining} days
                  </Text>
                </View>
                <Text style={[styles.itemArrow, { color: colors.textMuted }]}>›</Text>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      {/* Add Domain Modal */}
      <Modal visible={isAddModalOpen} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.modalTop}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Add Domain to Portfolio</Text>
              <TouchableOpacity onPress={() => setIsAddModalOpen(false)}>
                <Text style={[styles.modalClose, { color: colors.textMuted }]}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.modalForm}>
              <Text style={[styles.formLabel, { color: colors.textSecondary }]}>Domain Name</Text>
              <TextInput
                style={[
                  styles.formInput,
                  {
                    backgroundColor: colors.surfaceHighlight,
                    borderColor: colors.border,
                    color: colors.text,
                  },
                ]}
                placeholder="example.com"
                placeholderTextColor={colors.textMuted}
                value={newDomainName}
                onChangeText={setNewDomainName}
                autoCapitalize="none"
              />

              <Text style={[styles.formLabel, { color: colors.textSecondary }]}>Registrar</Text>
              <TextInput
                style={[
                  styles.formInput,
                  {
                    backgroundColor: colors.surfaceHighlight,
                    borderColor: colors.border,
                    color: colors.text,
                  },
                ]}
                placeholder="GoDaddy, Cloudflare, Namecheap..."
                placeholderTextColor={colors.textMuted}
                value={newRegistrar}
                onChangeText={setNewRegistrar}
              />

              <TouchableOpacity
                style={[
                  styles.modalSubmit,
                  { backgroundColor: colors.primary },
                  isAdding && styles.btnDisabled,
                ]}
                onPress={handleAddDomain}
                disabled={isAdding}
                activeOpacity={0.8}
              >
                <Text style={[styles.modalSubmitText, { color: colors.textInverse }]}>
                  {isAdding ? 'Adding...' : 'Save Domain'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  finderButton: {
    width: 36,
    height: 36,
    borderRadius: Radius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  finderButtonIcon: {
    fontSize: 16,
  },
  addButtonSquare: {
    width: 36,
    height: 36,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonIcon: {
    fontSize: 22,
    fontWeight: '700',
    lineHeight: 24,
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
  domainItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: Radius.lg,
    borderWidth: 1,
  },
  domainLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  domainThumbBox: {
    width: 44,
    height: 44,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  domainIconGlyph: {
    fontSize: 22,
  },
  domainName: {
    ...Typography.bodyLarge,
    fontWeight: '700',
  },
  registrarLabel: {
    ...Typography.caption,
    marginTop: 2,
  },
  domainRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  daysBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  daysBadgeText: {
    ...Typography.caption,
    fontWeight: '700',
  },
  itemArrow: {
    fontSize: 22,
    fontWeight: '300',
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
    textAlign: 'center',
    marginTop: 4,
    marginBottom: Spacing.lg,
  },
  emptyActionBtn: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: 10,
    borderRadius: Radius.md,
  },
  emptyActionText: {
    ...Typography.bodySmall,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'flex-end',
  },
  modalBox: {
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    padding: Spacing.xl,
    borderTopWidth: 1,
  },
  modalTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  modalTitle: {
    ...Typography.titleMedium,
    fontWeight: '800',
  },
  modalClose: {
    fontSize: 20,
    padding: 4,
  },
  modalForm: {
    gap: Spacing.md,
    paddingBottom: Platform.OS === 'ios' ? 24 : 12,
  },
  formLabel: {
    ...Typography.bodySmall,
    fontWeight: '600',
  },
  formInput: {
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
    ...Typography.bodyMedium,
  },
  modalSubmit: {
    borderRadius: Radius.md,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.sm,
  },
  modalSubmitText: {
    ...Typography.bodyLarge,
    fontWeight: '700',
  },
  btnDisabled: {
    opacity: 0.6,
  },
});
