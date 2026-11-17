import React from 'react';
import {
  View,
  Pressable,
  StyleSheet,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useTheme } from '../foundation/theme';
import { Text } from '../primitives/Text';
import { Button } from '../controls/Button';

export type NoticeBannerTone = 'info' | 'success' | 'warning' | 'danger';

export interface NoticeBannerProps {
  title: string;
  description?: string;
  tone?: NoticeBannerTone;
  action?: {
    label: string;
    onPress: () => void;
  };
  onDismiss?: () => void;
  icon?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

export function NoticeBanner({
  title,
  description,
  tone = 'info',
  action,
  onDismiss,
  icon,
  style,
}: NoticeBannerProps) {
  const { colors, mode, tokens } = useTheme();

  let toneColor: string = colors.primary;
  let defaultGlyph = 'ℹ';

  if (tone === 'success') {
    toneColor = colors.success;
    defaultGlyph = '✓';
  } else if (tone === 'warning') {
    toneColor = colors.warning;
    defaultGlyph = '!';
  } else if (tone === 'danger') {
    toneColor = colors.danger;
    defaultGlyph = '✕';
  }

  // Background tint: subtle alpha on dark, subtle pastel on light
  const bgOpacity = mode === 'dark' ? '20' : '12';
  const borderOpacity = mode === 'dark' ? '40' : '30';
  const backgroundColor = `${toneColor}${bgOpacity}`;
  const borderColor = `${toneColor}${borderOpacity}`;

  return (
    <View
      style={[
        styles.root,
        {
          backgroundColor,
          borderColor,
          borderRadius: tokens.radius.md,
          padding: tokens.spacing.md,
          gap: tokens.spacing.sm,
        },
        style,
      ]}
      accessibilityRole="alert"
    >
      <View style={styles.contentRow}>
        {/* Leading icon slot */}
        <View
          style={[
            styles.iconBadge,
            { backgroundColor: toneColor },
          ]}
          pointerEvents="none"
        >
          {icon ?? (
            <Text style={styles.iconGlyph}>
              {defaultGlyph}
            </Text>
          )}
        </View>

        {/* Text information */}
        <View style={styles.textSlot}>
          <Text
            style={[
              styles.title,
              { color: colors.text },
            ]}
          >
            {title}
          </Text>
          {description ? (
            <Text
              variant="small"
              style={[
                styles.description,
                { color: colors.muted },
              ]}
            >
              {description}
            </Text>
          ) : null}
        </View>

        {/* Dismiss button */}
        {onDismiss ? (
          <Pressable
            onPress={onDismiss}
            accessibilityRole="button"
            accessibilityLabel="Dismiss notice"
            hitSlop={8}
            style={({ pressed }) => [
              styles.dismissButton,
              { opacity: pressed ? 0.6 : 1 },
            ]}
          >
            <Text style={[styles.dismissGlyph, { color: colors.muted }]}>✕</Text>
          </Pressable>
        ) : null}
      </View>

      {/* Optional action */}
      {action ? (
        <View style={styles.actionRow}>
          <Button
            label={action.label}
            accessibilityLabel={action.label}
            size="sm"
            variant="outline"
            onPress={action.onPress}
          />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    borderWidth: 1,
    padding: 16,
    gap: 8,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  iconBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  iconGlyph: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
    lineHeight: 16,
    textAlign: 'center',
  },
  textSlot: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontWeight: '600',
    fontSize: 16,
    lineHeight: 20,
  },
  description: {
    lineHeight: 18,
  },
  dismissButton: {
    padding: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dismissGlyph: {
    fontSize: 14,
    fontWeight: '700',
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    paddingLeft: 32, // aligns under textSlot
  },
});
