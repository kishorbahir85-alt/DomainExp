import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ImageBackground,
  Dimensions,
  Animated,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../store/theme-context';
import { useAuth } from '../store/auth-context';
import { Spacing, Typography } from '../constants/theme';
import { BrandLogo } from '../components/ui/BrandLogo';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function SplashScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { isAuthenticated, isLoading } = useAuth();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.92)).current;

  const hasNavigated = useRef(false);

  const handleContinue = () => {
    if (hasNavigated.current) return;
    hasNavigated.current = true;
    if (isAuthenticated) {
      router.replace('/(tabs)/dashboard');
    } else {
      router.replace('/(auth)/login');
    }
  };

  useEffect(() => {
    // Smooth entrance animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 900,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 6,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();

    if (!isLoading && !hasNavigated.current) {
      const timer = setTimeout(() => {
        handleContinue();
      }, 2400);
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, isLoading]);

  return (
    <ImageBackground
      source={require('../../assets/images/splash-bg.png')}
      style={styles.backgroundImage}
      resizeMode="cover"
    >
      <TouchableOpacity
        style={[
          styles.container,
          {
            paddingTop: Math.max(insets.top + 60, 90),
            paddingBottom: insets.bottom + 20,
          },
        ]}
        onPress={handleContinue}
        activeOpacity={0.95}
      >
        {/* Brand Section with smooth animated entrance */}
        <Animated.View
          style={[
            styles.brandSection,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <View style={styles.logoHalo}>
            <BrandLogo size={84} />
          </View>
          <Text style={styles.brandTitle}>DomainPulse</Text>
        </Animated.View>
      </TouchableOpacity>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
  container: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
  },
  brandSection: {
    alignItems: 'center',
    marginTop: 20,
  },
  logoHalo: {
    padding: 16,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.65)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.85)',
    shadowColor: '#1877F2',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 6,
    marginBottom: 20,
  },
  brandTitle: {
    ...Typography.titleLarge,
    fontSize: 34,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.8,
  },
});
