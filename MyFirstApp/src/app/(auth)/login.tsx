import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../store/auth-context';
import { useTheme } from '../../store/theme-context';
import { Radius, Spacing, Typography } from '../../constants/theme';
import { Card } from '../../components/ui/Card';
import { BrandLogo } from '../../components/ui/BrandLogo';

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

export default function LoginScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { login, isLoading } = useAuth();
  const { colors } = useTheme();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleLogin = async () => {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      setErrorMessage('Please enter your email address.');
      return;
    }
    if (!EMAIL_REGEX.test(cleanEmail)) {
      setErrorMessage('Please enter a valid email address with @ and domain (e.g. name@domain.com).');
      return;
    }
    if (!password) {
      setErrorMessage('Please enter your password.');
      return;
    }
    setErrorMessage(null);
    try {
      await login({ email: cleanEmail, password });
      router.replace('/(tabs)/dashboard');
    } catch (err: any) {
      setErrorMessage(err?.message || 'Login failed. Please verify credentials.');
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.keyboardContainer, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: Math.max(insets.top + 12, 20),
            paddingBottom: 40,
          },
        ]}
        keyboardShouldPersistTaps="always"
        keyboardDismissMode="none"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={styles.logoWrapper}>
            <BrandLogo size={48} />
          </View>
          <Text style={[styles.title, { color: colors.text }]}>Sign in to DomainPulse</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Unified domain & infrastructure management
          </Text>
        </View>

        <Card style={styles.formCard} elevated>
          {errorMessage && (
            <View
              style={[
                styles.errorBanner,
                { backgroundColor: colors.roseMuted, borderColor: colors.rose },
              ]}
            >
              <Text style={[styles.errorText, { color: colors.rose }]}>{errorMessage}</Text>
            </View>
          )}

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Email Address</Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.surfaceHighlight,
                  borderColor: colors.border,
                  color: colors.text,
                },
              ]}
              placeholder="name@domain.com"
              placeholderTextColor={colors.textMuted}
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                if (errorMessage) setErrorMessage(null);
              }}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              textAlignVertical="center"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Password</Text>
            <View
              style={[
                styles.passwordContainer,
                {
                  backgroundColor: colors.surfaceHighlight,
                  borderColor: colors.border,
                },
              ]}
            >
              <TextInput
                style={[
                  styles.passwordInput,
                  {
                    color: colors.text,
                  },
                ]}
                placeholder="••••••••••••"
                placeholderTextColor={colors.textMuted}
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  if (errorMessage) setErrorMessage(null);
                }}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
                textAlignVertical="center"
              />
              <TouchableOpacity
                style={styles.eyeToggleBtn}
                onPress={() => setShowPassword((prev) => !prev)}
                activeOpacity={0.7}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              >
                <Text style={styles.eyeToggleText}>{showPassword ? '👁️' : '👁️‍🗨️'}</Text>
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            style={[
              styles.primaryButton,
              { backgroundColor: colors.primary },
              isLoading && styles.buttonDisabled,
            ]}
            onPress={handleLogin}
            disabled={isLoading}
            activeOpacity={0.8}
          >
            {isLoading ? (
              <ActivityIndicator color={colors.textInverse} />
            ) : (
              <Text style={[styles.primaryButtonText, { color: colors.textInverse }]}>Sign In</Text>
            )}
          </TouchableOpacity>
        </Card>

        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: colors.textSecondary }]}>Don't have an account? </Text>
          <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
            <Text style={[styles.linkText, { color: colors.primary }]}>Create Account</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardContainer: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: Spacing.lg,
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  logoWrapper: {
    marginBottom: Spacing.xs,
  },
  title: {
    ...Typography.titleMedium,
    fontWeight: '800',
    marginBottom: 2,
    textAlign: 'center',
  },
  subtitle: {
    ...Typography.bodySmall,
    textAlign: 'center',
    paddingHorizontal: Spacing.md,
  },
  formCard: {
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  errorBanner: {
    padding: Spacing.sm,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  errorText: {
    ...Typography.caption,
    fontWeight: '600',
  },
  inputGroup: {
    gap: 4,
  },
  label: {
    ...Typography.caption,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontSize: 11,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    maxHeight: 48,
    borderRadius: Radius.md,
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
    overflow: 'hidden',
  },
  passwordInput: {
    flex: 1,
    height: 48,
    fontSize: 15,
    padding: 0,
    margin: 0,
  },
  eyeToggleBtn: {
    paddingLeft: 8,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  eyeToggleText: {
    fontSize: 18,
  },
  input: {
    height: 48,
    maxHeight: 48,
    borderRadius: Radius.md,
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
    fontSize: 15,
  },
  primaryButton: {
    height: 48,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.xs,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  primaryButtonText: {
    ...Typography.bodyMedium,
    fontWeight: '700',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.lg,
  },
  footerText: {
    ...Typography.bodySmall,
  },
  linkText: {
    ...Typography.bodySmall,
    fontWeight: '700',
  },
});
