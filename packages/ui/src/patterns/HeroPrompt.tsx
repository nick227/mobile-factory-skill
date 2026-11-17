import React from 'react';
import { View, StyleSheet, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../foundation/theme';
import { Text } from '../primitives/Text';
import { Button } from '../controls/Button';
import { Badge } from '../controls/Badge';

export interface HeroPromptAction {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
}

export interface HeroPromptProps {
  title: string;
  subtitle: string;
  primaryAction: HeroPromptAction;
  secondaryAction?: HeroPromptAction & { variant?: 'ghost' | 'outline' };
  badge?: string;
  illustration?: React.ReactNode;
  align?: 'left' | 'center';
  docked?: boolean;
  fullScreen?: boolean;
  style?: ViewStyle;
}

export function HeroPrompt({
  title,
  subtitle,
  primaryAction,
  secondaryAction,
  badge,
  illustration,
  align = 'center',
  docked = true,
  fullScreen = false,
  style,
}: HeroPromptProps) {
  const { colors, tokens } = useTheme();
  const insets = useSafeAreaInsets();

  const isCenter = align === 'center';
  const alignment = isCenter ? 'center' : 'flex-start';

  const content = (
    <View
      style={[
        styles.container,
        {
          alignItems: alignment,
          gap: tokens.spacing.md,
          paddingHorizontal: tokens.spacing.lg,
        },
        fullScreen && {
          flex: 1,
          justifyContent: docked ? 'space-between' : 'center',
          paddingTop: Math.max(insets.top, tokens.spacing.xl),
          paddingBottom: Math.max(insets.bottom, tokens.spacing.lg),
          backgroundColor: colors.background,
        },
        style,
      ]}
    >
      {/* Top / Main Body */}
      <View
        style={[
          styles.body,
          {
            alignItems: alignment,
            gap: tokens.spacing.md,
            justifyContent: fullScreen && docked ? 'center' : 'flex-start',
            flex: fullScreen && docked ? 1 : 0,
          },
        ]}
      >
        {illustration && (
          <View style={[styles.illustrationSlot, { marginBottom: tokens.spacing.xs }]}>
            {illustration}
          </View>
        )}

        {badge && (
          <Badge
            label={badge}
            tone="accent"
            style={{ marginBottom: tokens.spacing.xs }}
          />
        )}

        {/* Huge Simple Headline */}
        <Text
          style={[
            styles.monumentalTitle,
            {
              color: colors.text,
              fontSize: tokens.typography.display * 1.35,
              textAlign: isCenter ? 'center' : 'left',
              lineHeight: tokens.typography.display * 1.5,
            },
          ]}
        >
          {title}
        </Text>

        {/* Calm Legible Subtitle */}
        <Text
          muted
          style={[
            styles.subtitle,
            {
              fontSize: tokens.typography.body * 1.1,
              textAlign: isCenter ? 'center' : 'left',
              lineHeight: 26,
              maxWidth: 380,
            },
          ]}
        >
          {subtitle}
        </Text>
      </View>

      {/* Button Cluster (1 or 2 buttons) */}
      <View
        style={[
          styles.actionCluster,
          {
            gap: tokens.spacing.sm,
            width: '100%',
            maxWidth: 420,
            marginTop: docked ? 0 : tokens.spacing.lg,
          },
        ]}
      >
        <Button
          label={primaryAction.label}
          onPress={primaryAction.onPress}
          loading={primaryAction.loading}
          disabled={primaryAction.disabled}
          icon={primaryAction.icon}
          fullWidth
          size="lg"
        />

        {secondaryAction && (
          <Button
            label={secondaryAction.label}
            variant={secondaryAction.variant ?? 'ghost'}
            onPress={secondaryAction.onPress}
            loading={secondaryAction.loading}
            disabled={secondaryAction.disabled}
            icon={secondaryAction.icon}
            fullWidth
            size="md"
          />
        )}
      </View>
    </View>
  );

  return content;
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  body: {
    width: '100%',
  },
  illustrationSlot: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  monumentalTitle: {
    fontWeight: '800',
    letterSpacing: -1.2,
  },
  subtitle: {
    fontWeight: '400',
  },
  actionCluster: {
    alignItems: 'stretch',
  },
});
