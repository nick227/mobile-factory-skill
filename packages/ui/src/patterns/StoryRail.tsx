import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  type ViewStyle,
} from 'react-native';
import { useTheme } from '../foundation/theme';
import { tokens } from '../foundation/tokens';
import { Avatar } from '../composites/Avatar';

export interface StoryItem {
  id: string;
  name: string;
  avatarUri?: string;
  hasUnread?: boolean;
  isLive?: boolean;
}

export interface StoryRailProps {
  stories: StoryItem[];
  onPressStory: (storyId: string) => void;
  onPressAdd?: () => void;
  addLabel?: string;
  size?: number;
  style?: ViewStyle;
}

export function StoryRail({
  stories,
  onPressStory,
  onPressAdd,
  addLabel = 'Your story',
  size = 64,
  style,
}: StoryRailProps) {
  const { colors } = useTheme();

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={[styles.scrollContent, style]}
    >
      {onPressAdd && (
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel={addLabel}
          onPress={onPressAdd}
          style={styles.storyButton}
        >
          <View
            style={[
              styles.avatarRing,
              {
                width: size + 8,
                height: size + 8,
                borderRadius: (size + 8) / 2,
                borderColor: colors.border,
                borderStyle: 'dashed',
                backgroundColor: colors.surface,
              },
            ]}
          >
            <Text style={[styles.addIcon, { color: colors.primary, fontSize: size * 0.45 }]}>
              +
            </Text>
          </View>
          <Text
            numberOfLines={1}
            style={[styles.nameText, { color: colors.text }]}
          >
            {addLabel}
          </Text>
        </TouchableOpacity>
      )}

      {stories.map((story) => {
        const hasRing = story.hasUnread || story.isLive;
        const ringColor = story.isLive
          ? colors.danger
          : story.hasUnread
          ? colors.primary
          : colors.border;

        const accessibilityLabel = `${story.name}, ${
          story.isLive ? 'live now' : story.hasUnread ? 'unseen story' : 'seen story'
        }`;

        return (
          <TouchableOpacity
            key={story.id}
            accessibilityRole="button"
            accessibilityLabel={accessibilityLabel}
            onPress={() => onPressStory(story.id)}
            style={styles.storyButton}
          >
            <View
              style={[
                styles.avatarRing,
                {
                  width: size + 8,
                  height: size + 8,
                  borderRadius: (size + 8) / 2,
                  borderColor: ringColor,
                  borderWidth: hasRing ? 2 : 1,
                  padding: 2,
                },
              ]}
            >
              <Avatar name={story.name} uri={story.avatarUri} size={size} />
              {story.isLive && (
                <View style={[styles.liveBadge, { backgroundColor: colors.danger }]}>
                  <Text style={[styles.liveText, { color: colors.onPrimary }]}>
                    LIVE
                  </Text>
                </View>
              )}
            </View>
            <Text
              numberOfLines={1}
              style={[
                styles.nameText,
                {
                  color: story.hasUnread ? colors.text : colors.muted,
                  fontWeight: story.hasUnread ? '600' : '400',
                },
              ]}
            >
              {story.name}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: tokens.spacing.md,
    gap: tokens.spacing.md,
    alignItems: 'center',
    paddingVertical: tokens.spacing.sm,
  },
  storyButton: {
    alignItems: 'center',
    width: 76,
  },
  avatarRing: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  addIcon: {
    fontWeight: '300',
    marginTop: -2,
  },
  nameText: {
    fontSize: tokens.typography.caption,
    marginTop: tokens.spacing.xs,
    textAlign: 'center',
  },
  liveBadge: {
    position: 'absolute',
    bottom: -4,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: tokens.radius.sm,
    alignSelf: 'center',
  },
  liveText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});
