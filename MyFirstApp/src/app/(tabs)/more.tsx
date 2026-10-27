import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  Switch,
  Alert,
  Keyboard,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Radius, Spacing, Typography } from '../../constants/theme';
import { useTheme } from '../../store/theme-context';
import { useAuth } from '../../store/auth-context';
import { useSettings } from '../../store/settings-context';

type ModalType =
  | 'profile'
  | 'providers'
  | 'import_export'
  | 'settings'
  | 'security'
  | 'billing'
  | 'help'
  | 'about'
  | null;

export default function MoreScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { user, logout, updateUser } = useAuth();
  const {
    currency,
    currencySymbol,
    pushAlerts,
    expiryReminders,
    weeklyDigest,
    setCurrency,
    setPushAlerts,
    setExpiryReminders,
    setWeeklyDigest,
  } = useSettings();

  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    const showSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e) => {
        setKeyboardHeight(e.endCoordinates.height);
      }
    );
    const hideSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        setKeyboardHeight(0);
      }
    );
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  // Committed Profile State (Displayed on screen)
  const [profileName, setProfileName] = useState(user?.displayName || user?.email?.split('@')[0] || 'Aditya Kumar');
  const [profileEmail, setProfileEmail] = useState(user?.email || 'admin@domainpulse.com');
  const [profileOrg, setProfileOrg] = useState(user?.organization || 'Pulse Cloud Infrastructure');

  useEffect(() => {
    if (user) {
      if (user.displayName) setProfileName(user.displayName);
      else if (user.email) setProfileName(user.email.split('@')[0]);
      if (user.email) setProfileEmail(user.email);
      if (user.organization) setProfileOrg(user.organization);
    }
  }, [user]);

  // Draft Profile State (Used only while editing in modal)
  const [draftName, setDraftName] = useState(profileName);
  const [draftEmail, setDraftEmail] = useState(profileEmail);
  const [draftOrg, setDraftOrg] = useState(profileOrg);

  // Security State
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(true);
  const [currentPass, setCurrentPass] = useState('');
  const [newPass, setNewPass] = useState('');

  // Support State
  const [supportSubject, setSupportSubject] = useState('');
  const [supportMessage, setSupportMessage] = useState('');

  const handleLogout = () => {
    logout();
    router.replace('/(auth)/login');
  };

  const openProfileModal = () => {
    setDraftName(profileName);
    setDraftEmail(profileEmail);
    setDraftOrg(profileOrg);
    setActiveModal('profile');
  };

  const handleSaveProfile = () => {
    const finalName = draftName.trim();
    const finalEmail = draftEmail.trim().toLowerCase();
    const finalOrg = draftOrg.trim() || 'Pulse Cloud Infrastructure';
    setProfileName(finalName);
    setProfileEmail(finalEmail);
    setProfileOrg(finalOrg);
    setActiveModal(null);
    Alert.alert('Profile Updated', 'Your profile changes have been saved successfully.');
    updateUser({ displayName: finalName, email: finalEmail, organization: finalOrg });
  };

  const handleSavePassword = () => {
    if (!currentPass || !newPass) {
      Alert.alert('Missing Fields', 'Please enter your current and new password.');
      return;
    }
    Alert.alert('Security Updated', 'Your password has been changed successfully.');
    setCurrentPass('');
    setNewPass('');
    setActiveModal(null);
  };

  const handleSendSupport = () => {
    if (!supportSubject || !supportMessage) {
      Alert.alert('Missing Information', 'Please provide a subject and message.');
      return;
    }
    Alert.alert('Ticket Submitted', 'Our support team has received your ticket and will reply within 2 hours.');
    setSupportSubject('');
    setSupportMessage('');
    setActiveModal(null);
  };

  const menuItems = [
    { id: 'profile' as ModalType, icon: '👤', label: 'Profile' },
    { id: 'providers' as ModalType, icon: '🔗', label: 'Provider Connections' },
    { id: 'import_export' as ModalType, icon: '📤', label: 'Import / Export' },
    { id: 'settings' as ModalType, icon: '⚙️', label: 'Settings' },
    { id: 'security' as ModalType, icon: '🛡️', label: 'Security' },
    { id: 'billing' as ModalType, icon: '💳', label: 'Billing' },
    { id: 'help' as ModalType, icon: '❓', label: 'Help & Support' },
    { id: 'about' as ModalType, icon: 'ℹ️', label: 'About DomainPulse' },
  ];

  const providers = [
    { name: 'Cloudflare DNS', status: 'Connected', badge: '#10b981', icon: '⚡' },
    { name: 'Amazon Route 53', status: 'Connected', badge: '#10b981', icon: '☁️' },
    { name: 'GoDaddy API', status: 'Connected', badge: '#10b981', icon: '🌐' },
    { name: 'Namecheap API', status: 'Not Connected', badge: '#64748b', icon: '🏷️' },
    { name: 'DigitalOcean Networking', status: 'Not Connected', badge: '#64748b', icon: '🌊' },
  ];

  const handleMenuPress = (id: ModalType) => {
    if (id === 'profile') {
      openProfileModal();
    } else {
      setActiveModal(id);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      {/* Header Bar */}
      <View style={[styles.headerBar, { borderBottomColor: colors.borderSubtle }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>More</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Profile Card with Quick Settings Gear */}
        <TouchableOpacity
          style={[styles.profileCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={openProfileModal}
          activeOpacity={0.8}
        >
          <View style={styles.profileLeft}>
            <View style={[styles.avatarBox, { backgroundColor: '#e0f2fe' }]}>
              <Text style={[styles.avatarText, { color: '#0284c7' }]}>
                {(profileName || 'AK').substring(0, 2).toUpperCase()}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.profileName, { color: colors.text }]}>{profileName}</Text>
              <Text style={[styles.profileEmail, { color: colors.textMuted }]}>{profileEmail}</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.gearButton}
            onPress={() => setActiveModal('settings')}
            activeOpacity={0.8}
          >
            <Text style={styles.gearIcon}>⚙️</Text>
          </TouchableOpacity>
        </TouchableOpacity>

        {/* Menu Items List */}
        <View style={[styles.menuList, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {menuItems.map((item, index) => (
            <React.Fragment key={item.id}>
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => handleMenuPress(item.id)}
                activeOpacity={0.7}
              >
                <View style={styles.menuLeft}>
                  <Text style={styles.menuIconGlyph}>{item.icon}</Text>
                  <Text style={[styles.menuItemLabel, { color: colors.text }]}>{item.label}</Text>
                </View>
                <Text style={[styles.arrowIcon, { color: colors.textMuted }]}>›</Text>
              </TouchableOpacity>
              {index < menuItems.length - 1 && (
                <View style={[styles.divider, { backgroundColor: colors.borderSubtle }]} />
              )}
            </React.Fragment>
          ))}
        </View>

        {/* Logout Button */}
        <TouchableOpacity
          style={[styles.logoutBtn, { backgroundColor: colors.roseMuted, borderColor: colors.rose }]}
          onPress={handleLogout}
          activeOpacity={0.8}
        >
          <Text style={[styles.logoutText, { color: colors.rose }]}>🚪 Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* ========================================================================= */}
      {/* MODAL DIALOGS FOR EVERY OPTION */}
      {/* ========================================================================= */}
      <Modal
        visible={activeModal !== null}
        animationType="slide"
        transparent
        statusBarTranslucent
        onRequestClose={() => {
          Keyboard.dismiss();
          setActiveModal(null);
        }}
      >
        <View style={[styles.modalOverlay, { paddingBottom: keyboardHeight }]}>
          <TouchableOpacity
            style={styles.backdropTouchable}
            activeOpacity={1}
            onPress={() => {
              Keyboard.dismiss();
              setActiveModal(null);
            }}
          />
          <View
            style={[
              styles.modalSheet,
              {
                backgroundColor: colors.surface,
                paddingBottom: keyboardHeight > 0 ? 16 : Math.max(insets.bottom, 24),
                maxHeight: keyboardHeight > 0 ? '72%' : '88%',
              },
            ]}
          >
              {/* Sheet Header */}
              <View style={[styles.sheetHeader, { borderBottomColor: colors.borderSubtle }]}>
                <Text style={[styles.sheetTitle, { color: colors.text }]}>
                  {activeModal === 'profile' && 'User Profile'}
                  {activeModal === 'providers' && 'Provider Connections'}
                  {activeModal === 'import_export' && 'Import & Export'}
                  {activeModal === 'settings' && 'App Settings'}
                  {activeModal === 'security' && 'Security & Auth'}
                  {activeModal === 'billing' && 'Subscription & Billing'}
                  {activeModal === 'help' && 'Help & Support'}
                  {activeModal === 'about' && 'About DomainPulse'}
                </Text>
                <TouchableOpacity
                  style={styles.closeBtn}
                  onPress={() => setActiveModal(null)}
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                >
                  <Text style={[styles.closeBtnText, { color: colors.textMuted }]}>✕</Text>
                </TouchableOpacity>
              </View>

              <ScrollView
                contentContainerStyle={[
                  styles.sheetBody,
                  { paddingBottom: keyboardHeight > 0 ? 60 : Spacing.xxl },
                ]}
                showsVerticalScrollIndicator={true}
                keyboardShouldPersistTaps="handled"
              >
                {/* 1. PROFILE */}
                {activeModal === 'profile' && (
                  <View style={styles.formGroup}>
                    <Text style={[styles.label, { color: colors.textSecondary }]}>Full Name</Text>
                    <TextInput
                      style={[styles.input, { color: colors.text, borderColor: colors.border }]}
                      value={draftName}
                      onChangeText={setDraftName}
                      placeholder="Your Name"
                      placeholderTextColor={colors.textMuted}
                    />

                    <Text style={[styles.label, { color: colors.textSecondary, marginTop: Spacing.md }]}>
                      Email Address
                    </Text>
                    <TextInput
                      style={[styles.input, { color: colors.text, borderColor: colors.border }]}
                      value={draftEmail}
                      onChangeText={setDraftEmail}
                      placeholder="email@example.com"
                      keyboardType="email-address"
                      autoCapitalize="none"
                      placeholderTextColor={colors.textMuted}
                    />

                    <Text style={[styles.label, { color: colors.textSecondary, marginTop: Spacing.md }]}>
                      Organization / Company
                    </Text>
                    <TextInput
                      style={[styles.input, { color: colors.text, borderColor: colors.border }]}
                      value={draftOrg}
                      onChangeText={setDraftOrg}
                      placeholder="Organization Name"
                      placeholderTextColor={colors.textMuted}
                    />

                    <TouchableOpacity
                      style={[styles.primaryActionBtn, { backgroundColor: colors.primary }]}
                      onPress={handleSaveProfile}
                    >
                      <Text style={styles.primaryActionBtnText}>Save Profile Changes</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {/* 2. PROVIDER CONNECTIONS */}
                {activeModal === 'providers' && (
                  <View>
                    <Text style={[styles.helperText, { color: colors.textSecondary }]}>
                      Manage synced DNS registries and cloud providers to auto-discover domains and servers.
                    </Text>
                    {providers.map((p, idx) => (
                      <View
                        key={idx}
                        style={[styles.providerRow, { borderColor: colors.borderSubtle }]}
                      >
                        <View style={styles.providerLeft}>
                          <Text style={styles.providerIcon}>{p.icon}</Text>
                          <View>
                            <Text style={[styles.providerName, { color: colors.text }]}>{p.name}</Text>
                            <Text style={[styles.providerStatus, { color: p.badge }]}>{p.status}</Text>
                          </View>
                        </View>
                        <TouchableOpacity
                          style={[
                            styles.connectToggleBtn,
                            {
                              backgroundColor:
                                p.status === 'Connected' ? colors.surfaceElevated : colors.primary,
                              borderColor: colors.border,
                            },
                          ]}
                          onPress={() =>
                            Alert.alert(p.name, `Configure synchronization keys for ${p.name}.`)
                          }
                        >
                          <Text
                            style={{
                              color: p.status === 'Connected' ? colors.text : '#ffffff',
                              fontWeight: '700',
                              fontSize: 12,
                            }}
                          >
                            {p.status === 'Connected' ? 'Configure' : 'Connect'}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                )}

                {/* 3. IMPORT / EXPORT */}
                {activeModal === 'import_export' && (
                  <View style={styles.gapVertical}>
                    <View style={[styles.infoCard, { backgroundColor: colors.primaryMuted }]}>
                      <Text style={[styles.infoCardTitle, { color: colors.primary }]}>📥 Import Data</Text>
                      <Text style={[styles.infoCardDesc, { color: colors.textSecondary }]}>
                        Upload CSV domain lists or BIND zone files to sync into your portfolio.
                      </Text>
                      <TouchableOpacity
                        style={[styles.actionOutlineBtn, { borderColor: colors.primary }]}
                        onPress={() => Alert.alert('Import Domains', 'Select a CSV file to import records.')}
                      >
                        <Text style={{ color: colors.primary, fontWeight: '700' }}>Choose CSV / Zone File</Text>
                      </TouchableOpacity>
                    </View>

                    <View style={[styles.infoCard, { backgroundColor: '#f0fdf4' }]}>
                      <Text style={[styles.infoCardTitle, { color: '#16a34a' }]}>📤 Export Portfolio</Text>
                      <Text style={[styles.infoCardDesc, { color: colors.textSecondary }]}>
                        Download your full inventory including expiration dates, SSL health, and DNS records.
                      </Text>
                      <TouchableOpacity
                        style={[styles.actionOutlineBtn, { borderColor: '#16a34a' }]}
                        onPress={() =>
                          Alert.alert('Export Ready', 'Exported domain_pulse_portfolio.csv successfully!')
                        }
                      >
                        <Text style={{ color: '#16a34a', fontWeight: '700' }}>Export as CSV / PDF</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}

                {/* 4. SETTINGS */}
                {activeModal === 'settings' && (
                  <View>
                    <View style={styles.switchRow}>
                      <View style={styles.switchTextCol}>
                        <Text style={[styles.switchTitle, { color: colors.text }]}>Push Notifications</Text>
                        <Text style={[styles.switchSubtitle, { color: colors.textMuted }]}>
                          Instant alerts for domain down-time and DNS drift
                        </Text>
                      </View>
                      <Switch
                        value={pushAlerts}
                        onValueChange={setPushAlerts}
                        trackColor={{ false: '#cbd5e1', true: '#38bdf8' }}
                      />
                    </View>

                    <View style={styles.switchRow}>
                      <View style={styles.switchTextCol}>
                        <Text style={[styles.switchTitle, { color: colors.text }]}>Domain Expiry Reminders</Text>
                        <Text style={[styles.switchSubtitle, { color: colors.textMuted }]}>
                          Receive notices at 60, 30, and 7 days before expiration
                        </Text>
                      </View>
                      <Switch
                        value={expiryReminders}
                        onValueChange={setExpiryReminders}
                        trackColor={{ false: '#cbd5e1', true: '#38bdf8' }}
                      />
                    </View>

                    <View style={styles.switchRow}>
                      <View style={styles.switchTextCol}>
                        <Text style={[styles.switchTitle, { color: colors.text }]}>Weekly Portfolio Digest</Text>
                        <Text style={[styles.switchSubtitle, { color: colors.textMuted }]}>
                          Executive summary of SSL certificates and server uptime
                        </Text>
                      </View>
                      <Switch
                        value={weeklyDigest}
                        onValueChange={setWeeklyDigest}
                        trackColor={{ false: '#cbd5e1', true: '#38bdf8' }}
                      />
                    </View>

                    <Text style={[styles.label, { color: colors.textSecondary, marginTop: Spacing.lg }]}>
                      Display Currency
                    </Text>
                    <View style={styles.currencyRow}>
                      {['$ (USD)', '€ (EUR)', '£ (GBP)', '₹ (INR)'].map((curr) => {
                        const isSelected = currency === curr || (curr.includes('USD') && currency === '$ (USD)');
                        return (
                          <TouchableOpacity
                            key={curr}
                            style={[
                              styles.currencyPill,
                              {
                                backgroundColor: isSelected ? colors.primary : colors.surfaceElevated,
                                borderColor: isSelected ? colors.primary : colors.border,
                              },
                            ]}
                            onPress={() => setCurrency(curr)}
                            activeOpacity={0.7}
                          >
                            <Text
                              style={{
                                color: isSelected ? '#ffffff' : colors.text,
                                fontWeight: '700',
                                fontSize: 13,
                              }}
                            >
                              {curr}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>
                )}

                {/* 5. SECURITY */}
                {activeModal === 'security' && (
                  <View style={styles.formGroup}>
                    <View style={styles.switchRow}>
                      <View style={styles.switchTextCol}>
                        <Text style={[styles.switchTitle, { color: colors.text }]}>Two-Factor Authentication (2FA)</Text>
                        <Text style={[styles.switchSubtitle, { color: colors.textMuted }]}>
                          Require Authenticator code during sign-in
                        </Text>
                      </View>
                      <Switch
                        value={twoFactorEnabled}
                        onValueChange={setTwoFactorEnabled}
                        trackColor={{ false: '#cbd5e1', true: '#10b981' }}
                      />
                    </View>

                    <View style={[styles.divider, { backgroundColor: colors.borderSubtle, marginVertical: Spacing.md }]} />

                    <Text style={[styles.label, { color: colors.textSecondary }]}>Change Password</Text>
                    <TextInput
                      style={[styles.input, { color: colors.text, borderColor: colors.border }]}
                      placeholder="Current Password"
                      secureTextEntry
                      value={currentPass}
                      onChangeText={setCurrentPass}
                      placeholderTextColor={colors.textMuted}
                    />

                    <TextInput
                      style={[styles.input, { color: colors.text, borderColor: colors.border, marginTop: Spacing.sm }]}
                      placeholder="New Password (min 8 characters)"
                      secureTextEntry
                      value={newPass}
                      onChangeText={setNewPass}
                      placeholderTextColor={colors.textMuted}
                    />

                    <TouchableOpacity
                      style={[styles.primaryActionBtn, { backgroundColor: colors.primary }]}
                      onPress={handleSavePassword}
                    >
                      <Text style={styles.primaryActionBtnText}>Update Password</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {/* 6. BILLING */}
                {activeModal === 'billing' && (
                  <View>
                    <View style={[styles.planCard, { borderColor: '#38bdf8', backgroundColor: '#f0f9ff' }]}>
                      <View style={styles.planHeader}>
                        <Text style={[styles.planTitle, { color: '#0369a1' }]}>Enterprise Pro Plan</Text>
                        <View style={styles.activeTag}>
                          <Text style={styles.activeTagText}>ACTIVE</Text>
                        </View>
                      </View>
                      <Text style={styles.planPrice}>
                        {currencySymbol === '₹'
                          ? '₹2,499 / month'
                          : currencySymbol === '€'
                          ? '€27 / month'
                          : currencySymbol === '£'
                          ? '£24 / month'
                          : '$29 / month'}
                      </Text>
                      <Text style={[styles.planFeatures, { color: colors.textSecondary }]}>
                        • Unlimited Monitored Domains{'\n'}• 30-Second Uptime Healthchecks{'\n'}• Automated DNS Failover{'\n'}• Multi-user Team Seats
                      </Text>
                    </View>

                    <TouchableOpacity
                      style={[styles.primaryActionBtn, { backgroundColor: colors.primary, marginTop: Spacing.md }]}
                      onPress={() => Alert.alert('Subscription', 'Redirecting to Stripe Billing Portal...')}
                    >
                      <Text style={styles.primaryActionBtnText}>Manage Payment & Invoices</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {/* 7. HELP & SUPPORT */}
                {activeModal === 'help' && (
                  <View style={styles.formGroup}>
                    <Text style={[styles.helperText, { color: colors.textSecondary }]}>
                      Have a question or running into an issue? Our engineering team is available 24/7.
                    </Text>

                    <Text style={[styles.label, { color: colors.textSecondary }]}>Subject</Text>
                    <TextInput
                      style={[styles.input, { color: colors.text, borderColor: colors.border }]}
                      placeholder="Brief issue title"
                      value={supportSubject}
                      onChangeText={setSupportSubject}
                      placeholderTextColor={colors.textMuted}
                    />

                    <Text style={[styles.label, { color: colors.textSecondary, marginTop: Spacing.md }]}>
                      Message
                    </Text>
                    <TextInput
                      style={[
                        styles.input,
                        { color: colors.text, borderColor: colors.border, height: 90, textAlignVertical: 'top' },
                      ]}
                      placeholder="Describe what you need help with..."
                      multiline
                      numberOfLines={4}
                      value={supportMessage}
                      onChangeText={setSupportMessage}
                      placeholderTextColor={colors.textMuted}
                    />

                    <TouchableOpacity
                      style={[styles.primaryActionBtn, { backgroundColor: colors.primary }]}
                      onPress={handleSendSupport}
                    >
                      <Text style={styles.primaryActionBtnText}>Submit Support Ticket</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {/* 8. ABOUT */}
                {activeModal === 'about' && (
                  <View style={styles.aboutContainer}>
                    <View style={styles.aboutLogoBox}>
                      <Text style={{ fontSize: 40 }}>🌐</Text>
                    </View>
                    <Text style={[styles.aboutTitle, { color: colors.text }]}>DomainPulse</Text>
                    <Text style={[styles.aboutVersion, { color: colors.textMuted }]}>
                      Version 1.0.4 (Build 2026.09.28)
                    </Text>
                    <Text style={[styles.aboutDesc, { color: colors.textSecondary }]}>
                      DomainPulse is an enterprise infrastructure and domain portfolio monitoring suite designed for modern DevOps and site reliability engineers.
                    </Text>
                    <View style={[styles.divider, { backgroundColor: colors.borderSubtle, marginVertical: Spacing.lg }]} />
                    <Text style={[styles.copyrightText, { color: colors.textMuted }]}>
                      © 2026 DomainPulse Inc. All rights reserved.
                    </Text>
                  </View>
                )}
              </ScrollView>
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
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
  },
  headerTitle: {
    ...Typography.titleLarge,
    fontSize: 24,
    fontWeight: '800',
  },
  scrollContent: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxxl,
    gap: Spacing.md,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.lg,
    borderRadius: Radius.xl,
    borderWidth: 1,
  },
  profileLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    flex: 1,
  },
  avatarBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    ...Typography.titleSmall,
    fontWeight: '800',
  },
  profileName: {
    ...Typography.bodyLarge,
    fontWeight: '800',
  },
  profileEmail: {
    ...Typography.caption,
    marginTop: 2,
  },
  gearButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#0284c7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gearIcon: {
    fontSize: 18,
  },
  arrowIcon: {
    fontSize: 24,
    fontWeight: '300',
  },
  menuList: {
    borderRadius: Radius.xl,
    borderWidth: 1,
    paddingVertical: Spacing.xs,
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: 14,
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  menuIconGlyph: {
    fontSize: 18,
    width: 24,
    textAlign: 'center',
  },
  menuItemLabel: {
    ...Typography.bodyLarge,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    marginHorizontal: Spacing.lg,
  },
  logoutBtn: {
    paddingVertical: 14,
    borderRadius: Radius.xl,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.sm,
  },
  logoutText: {
    ...Typography.bodyLarge,
    fontWeight: '700',
  },

  // Modal Sheet Styles
  keyboardAvoid: {
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  backdropTouchable: {
    flex: 1,
  },
  modalSheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '90%',
    width: '100%',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 24,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  closeBtn: {
    padding: 4,
  },
  closeBtnText: {
    fontSize: 18,
    fontWeight: '700',
  },
  sheetBody: {
    padding: Spacing.lg,
  },
  formGroup: {
    gap: Spacing.xs,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
  },
  primaryActionBtn: {
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.lg,
  },
  primaryActionBtnText: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 15,
  },
  helperText: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: Spacing.md,
  },
  providerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  providerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  providerIcon: {
    fontSize: 22,
  },
  providerName: {
    fontSize: 15,
    fontWeight: '700',
  },
  providerStatus: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  connectToggleBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  gapVertical: {
    gap: Spacing.md,
  },
  infoCard: {
    padding: Spacing.lg,
    borderRadius: 16,
    gap: 6,
  },
  infoCardTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  infoCardDesc: {
    fontSize: 13,
    lineHeight: 18,
  },
  actionOutlineBtn: {
    marginTop: 8,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  switchTextCol: {
    flex: 1,
    paddingRight: 12,
  },
  switchTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  switchSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  currencyRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
    marginTop: 6,
  },
  currencyPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  planCard: {
    borderWidth: 2,
    borderRadius: 18,
    padding: Spacing.lg,
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  planTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  activeTag: {
    backgroundColor: '#0284c7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  activeTagText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '800',
  },
  planPrice: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0f172a',
    marginVertical: 6,
  },
  planFeatures: {
    fontSize: 13,
    lineHeight: 20,
  },
  aboutContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.lg,
  },
  aboutLogoBox: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  aboutTitle: {
    fontSize: 22,
    fontWeight: '800',
  },
  aboutVersion: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 4,
    marginBottom: Spacing.md,
  },
  aboutDesc: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 19,
    paddingHorizontal: Spacing.md,
  },
  copyrightText: {
    fontSize: 12,
  },
});
