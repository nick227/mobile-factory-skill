import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  type ViewStyle,
} from 'react-native';
import { useTheme } from '../foundation/theme';
import { tokens } from '../foundation/tokens';
import { Avatar } from '../composites/Avatar';
import { Button } from '../controls/Button';

export interface IdentityStat {
  label: string;
  value: string | number;
}

export interface IdentityHeaderProps {
  name: string;
  avatarUri?: string;
  verified?: boolean;
  handle?: string;
  bio?: string;
  stats?: IdentityStat[];
  primaryAction?: {
    label: string;
    onPress: () => void;
    variant?: 'primary' | 'secondary' | 'outline';
  };
  secondaryAction?: {
    label: string;
    onPress: () => void;
  };
  style?: ViewStyle;
}

export function IdentityHeader({
  name,
  avatarUri,
  verified = false,
  handle,
  bio,
  stats,
  primaryAction,
  secondaryAction,
  style,
}: IdentityHeaderProps) {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }, style]}>
      {/* Top profile identity row */}
      <View style={styles.topRow}>
        <View style={styles.avatarWrapper}>
          <Avatar name={name} uri={avatarUri} size={72} />
          {verified && (
            <View style={[styles.verifiedBadge, { backgroundColor: colors.primary, borderColor: colors.background }]}>
              <Text style={[styles.verifiedIcon, { color: colors.onPrimary }]}>✓</Text>
            </View>
          )}
        </View>

        {/* Stats block */}
        {stats && stats.length > 0 && (
          <View style={styles.statsContainer}>
            {stats.map((stat, index) => (
              <View key={index} style={styles.statItem}>
                <Text
                  style={[
                    styles.statValue,
                    { color: colors.text, fontVariant: ['tabular-nums'] },
                  ]}
                >
                  {stat.value}
                </Text>
                <Text style={[styles.statLabel, { color: colors.muted }]}>
                  {stat.label}
                </Text>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Info: Name, Handle, Bio */}
      <View style={styles.infoBlock}>
        <View style={styles.nameRow}>
          <Text style={[styles.name, { color: colors.text }]}>{name}</Text>
        </View>
        {handle && (
          <Text style={[styles.handle, { color: colors.muted }]}>{handle}</Text>
        )}
        {bio && (
          <Text style={[styles.bio, { color: colors.text }]}>{bio}</Text>
        )}
      </View>

      {/* Actions */}
      {(primaryAction || secondaryAction) && (
        <View style={styles.actionRow}>
          {primaryAction && (
            <View style={styles.actionFlex}>
              <Button
                label={primaryAction.label}
                onPress={primaryAction.onPress}
                variant={primaryAction.variant || 'primary'}
                fullWidth
              />
            </View>
          )}
          {secondaryAction && (
            <View style={styles.actionFlex}>
              <Button
                label={secondaryAction.label}
                onPress={secondaryAction.onPress}
                variant="outline"
                fullWidth
              />
            </View>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: tokens.spacing.md,
    paddingVertical: tokens.spacing.lg,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: tokens.spacing.md,
  },
  avatarWrapper: {
    position: 'relative',
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  verifiedIcon: {
    fontSize: 12,
    fontWeight: '800',
  },
  statsContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginLeft: tokens.spacing.lg,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: tokens.typography.heading,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: tokens.typography.caption,
    marginTop: 2,
  },
  infoBlock: {
    marginBottom: tokens.spacing.md,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing.xs,
  },
  name: {
    fontSize: tokens.typography.title,
    fontWeight: '700',
  },
  handle: {
    fontSize: tokens.typography.small,
    marginTop: 2,
  },
  bio: {
    fontSize: tokens.typography.body,
    marginTop: tokens.spacing.sm,
    lineHeight: 22,
  },
  actionRow: {
    flexDirection: 'row',
    gap: tokens.spacing.sm,
  },
  actionFlex: {
    flex: 1,
  },
});
