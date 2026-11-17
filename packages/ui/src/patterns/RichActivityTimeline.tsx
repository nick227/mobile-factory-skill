import React from 'react';
import { View, TouchableOpacity, StyleSheet, type ViewStyle } from 'react-native';
import { Text } from '../primitives/Text';
import { Avatar } from '../composites/Avatar';
import { Badge, type BadgeTone } from '../controls/Badge';
import { Button } from '../controls/Button';
import { useTheme } from '../foundation/theme';
import { tokens } from '../foundation/tokens';

export interface TimelineUser {
  name: string;
  avatarUri?: string;
}

export interface TimelineEvent {
  id: string;
  user: TimelineUser;
  title: string;
  timestamp: string;
  description?: string;
  badge?: string;
  badgeTone?: BadgeTone;
  attachment?: {
    title: string;
    subtitle?: string;
  };
  actions?: Array<{
    label: string;
    onPress: () => void;
  }>;
}

export interface RichActivityTimelineProps {
  events: TimelineEvent[];
  onPressEvent?: (eventId: string) => void;
  style?: ViewStyle;
}

export function RichActivityTimeline({
  events,
  onPressEvent,
  style,
}: RichActivityTimelineProps) {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, style]}>
      {events.map((event, index) => {
        const isLast = index === events.length - 1;

        const content = (
          <View style={styles.eventRow}>
            {/* Left avatar column + connecting timeline stem */}
            <View style={styles.leftColumn}>
              <Avatar name={event.user.name} uri={event.user.avatarUri} size={36} />
              {!isLast && (
                <View
                  style={[
                    styles.verticalStem,
                    { backgroundColor: colors.border },
                  ]}
                />
              )}
            </View>

            {/* Event Content Card */}
            <View
              style={[
                styles.cardContent,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  marginBottom: isLast ? 0 : tokens.spacing.md,
                },
              ]}
            >
              {/* Header: User name, badge, timestamp */}
              <View style={styles.cardHeader}>
                <View style={styles.userTitleRow}>
                  <Text style={{ fontWeight: '700', fontSize: tokens.typography.body }}>
                    {event.user.name}
                  </Text>
                  {event.badge && (
                    <Badge label={event.badge} tone={event.badgeTone || 'neutral'} />
                  )}
                </View>
                <Text muted variant="caption">
                  {event.timestamp}
                </Text>
              </View>

              {/* Event title & description */}
              <Text style={styles.eventTitle}>{event.title}</Text>
              {event.description && (
                <Text muted variant="small" style={{ lineHeight: 18, marginTop: 2 }}>
                  {event.description}
                </Text>
              )}

              {/* Optional Attachment Card */}
              {event.attachment && (
                <View
                  style={[
                    styles.attachmentBox,
                    { backgroundColor: colors.background, borderColor: colors.border },
                  ]}
                >
                  <Text style={{ fontSize: 16 }}>📄</Text>
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text style={{ fontWeight: '600', fontSize: tokens.typography.small }}>
                      {event.attachment.title}
                    </Text>
                    {event.attachment.subtitle && (
                      <Text muted variant="caption">
                        {event.attachment.subtitle}
                      </Text>
                    )}
                  </View>
                </View>
              )}

              {/* Action Buttons */}
              {event.actions && event.actions.length > 0 && (
                <View style={styles.actionsRow}>
                  {event.actions.map((act, actIndex) => (
                    <Button
                      key={actIndex}
                      label={act.label}
                      onPress={act.onPress}
                      variant="outline"
                      size="sm"
                    />
                  ))}
                </View>
              )}
            </View>
          </View>
        );

        if (onPressEvent) {
          return (
            <TouchableOpacity
              key={event.id}
              accessibilityRole="button"
              accessibilityLabel={`${event.user.name}: ${event.title}`}
              onPress={() => onPressEvent(event.id)}
              activeOpacity={0.85}
            >
              {content}
            </TouchableOpacity>
          );
        }

        return <View key={event.id}>{content}</View>;
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: tokens.spacing.xs,
  },
  eventRow: {
    flexDirection: 'row',
  },
  leftColumn: {
    alignItems: 'center',
    width: 44,
    marginRight: tokens.spacing.sm,
  },
  verticalStem: {
    width: 2,
    flex: 1,
    marginTop: tokens.spacing.xs,
    marginBottom: -tokens.spacing.sm,
  },
  cardContent: {
    flex: 1,
    padding: tokens.spacing.md,
    borderRadius: tokens.radius.md,
    borderWidth: 1,
    gap: tokens.spacing.xs,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 2,
  },
  userTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing.xs,
    flexWrap: 'wrap',
  },
  eventTitle: {
    fontSize: tokens.typography.body,
    fontWeight: '600',
  },
  attachmentBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: tokens.spacing.sm,
    borderRadius: tokens.radius.sm,
    borderWidth: 1,
    gap: tokens.spacing.sm,
    marginTop: tokens.spacing.xs,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: tokens.spacing.sm,
    marginTop: tokens.spacing.sm,
  },
});
