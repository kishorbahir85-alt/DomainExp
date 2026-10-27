import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Radius, Spacing, Typography } from '../constants/theme';
import { useTheme } from '../store/theme-context';
import { searchMultipleTlds } from '../services/finder';
import type { DomainSearchResult } from '../types';

const FINDER_TLDS = ['.com', '.in', '.ai', '.io', '.dev', '.app', '.tech', '.org'];

export default function DomainFinderScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();

  const [keyword, setKeyword] = useState('');
  const [selectedTlds, setSelectedTlds] = useState<string[]>(['.com', '.in', '.ai', '.dev']);
  const [results, setResults] = useState<DomainSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const toggleTld = (tld: string) => {
    setSelectedTlds((prev) =>
      prev.includes(tld) ? prev.filter((t) => t !== tld) : [...prev, tld],
    );
  };

  const handleSearch = async () => {
    if (!keyword.trim()) return;
    setIsSearching(true);
    setHasSearched(true);
    try {
      const searchResults = await searchMultipleTlds(keyword.trim(), selectedTlds);
      setResults(searchResults);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      {/* Top Header */}
      <View style={[styles.headerBar, { borderBottomColor: colors.borderSubtle }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton} activeOpacity={0.7}>
          <Text style={[styles.backArrow, { color: colors.text }]}>‹</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Find a Domain</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* Search Input */}
        <View style={[styles.searchBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="yourdomain"
            placeholderTextColor={colors.textMuted}
            value={keyword}
            onChangeText={setKeyword}
            autoCapitalize="none"
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
        </View>

        {/* TLD Selector Pills */}
        <View style={styles.tldsGrid}>
          {FINDER_TLDS.map((tld) => {
            const isSelected = selectedTlds.includes(tld);
            return (
              <TouchableOpacity
                key={tld}
                style={[
                  styles.tldPill,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                  },
                  isSelected && {
                    backgroundColor: colors.primary,
                    borderColor: colors.primary,
                  },
                ]}
                onPress={() => toggleTld(tld)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.tldPillText,
                    { color: colors.text },
                    isSelected && { color: colors.textInverse, fontWeight: '700' },
                  ]}
                >
                  {tld}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Big Blue Search Button */}
        <TouchableOpacity
          style={[styles.searchBtn, { backgroundColor: colors.primary }]}
          onPress={handleSearch}
          disabled={isSearching}
          activeOpacity={0.85}
        >
          {isSearching ? (
            <ActivityIndicator color={colors.textInverse} size="small" />
          ) : (
            <Text style={[styles.searchBtnText, { color: colors.textInverse }]}>Search</Text>
          )}
        </TouchableOpacity>

        {/* Results Section */}
        {hasSearched && (
          <View style={styles.resultsSection}>
            <Text style={[styles.resultsTitle, { color: colors.text }]}>Results</Text>

            {results.map((item) => (
              <View
                key={item.domain}
                style={[styles.resultItem, { backgroundColor: colors.surface, borderColor: colors.border }]}
              >
                <View style={styles.resultLeft}>
                  <View style={[styles.resultIconBox, { backgroundColor: colors.surfaceElevated }]}>
                    <Text style={styles.resultIcon}>🌐</Text>
                  </View>
                  <View>
                    <Text style={[styles.domainNameText, { color: colors.text }]}>{item.domain}</Text>
                    <Text
                      style={[
                        styles.availText,
                        { color: item.available ? colors.emerald : colors.rose },
                      ]}
                    >
                      {item.available ? '● Available' : '● Registered'}
                    </Text>
                  </View>
                </View>

                <View style={styles.resultRight}>
                  {item.available && item.price && (
                    <Text style={[styles.priceTag, { color: colors.text }]}>
                      ₹{Math.round(item.price * 85).toLocaleString()}
                    </Text>
                  )}
                  <TouchableOpacity
                    style={[
                      styles.cartBtn,
                      {
                        backgroundColor: item.available ? colors.primary : colors.surfaceElevated,
                        borderColor: colors.border,
                      },
                    ]}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.cartIcon}>{item.available ? '🛒' : 'ℹ️'}</Text>
                  </TouchableOpacity>
                </View>
              </View>
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
  scrollContent: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxxl,
    gap: Spacing.md,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.md,
    height: 48,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    ...Typography.bodyLarge,
  },
  tldsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginVertical: Spacing.xs,
  },
  tldPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  tldPillText: {
    ...Typography.bodyMedium,
    fontWeight: '600',
  },
  searchBtn: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: Spacing.sm,
  },
  searchBtnText: {
    ...Typography.bodyLarge,
    fontWeight: '700',
  },
  resultsSection: {
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  resultsTitle: {
    ...Typography.titleSmall,
    fontWeight: '800',
    marginBottom: Spacing.xs,
  },
  resultItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: Radius.lg,
    borderWidth: 1,
  },
  resultLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  resultIconBox: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultIcon: {
    fontSize: 20,
  },
  domainNameText: {
    ...Typography.bodyLarge,
    fontWeight: '700',
  },
  availText: {
    ...Typography.caption,
    fontWeight: '600',
    marginTop: 2,
  },
  resultRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  priceTag: {
    ...Typography.bodyMedium,
    fontWeight: '700',
  },
  cartBtn: {
    width: 36,
    height: 36,
    borderRadius: Radius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartIcon: {
    fontSize: 16,
  },
});
