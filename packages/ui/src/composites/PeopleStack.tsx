import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, type ViewStyle } from 'react-native';
import { useTheme } from '../foundation/theme';
import { tokens } from '../foundation/tokens';
import { Avatar } from './Avatar';

export interface PersonItem {
  id: string;
  name: string;
  uri?: string;
}

export interface PeopleStackProps {
  people: PersonItem[];
  maxVisible?: number;
  size?: number;
  onPress?: () => void;
  style?: ViewStyle;
}

export function PeopleStack({
  people,
  maxVisible = 4,
  size = 36,
  onPress,
  style,
}: PeopleStackProps) {
  const { colors } = useTheme();

  const visiblePeople = people.slice(0, maxVisible);
  const overflowCount = people.length - maxVisible;
  const overlapOffset = Math.round(size * 0.3);

  const namesList = people.map((p) => p.name).join(', ');
  const accessibilityLabel = `Group of ${people.length} people: ${namesList}`;

  const content = (
    <View
      style={[styles.container, style]}
      accessible
      accessibilityLabel={accessibilityLabel}
    >
      {visiblePeople.map((person, index) => (
        <View
          key={person.id}
          style={[
            styles.avatarWrapper,
            {
              marginLeft: index === 0 ? 0 : -overlapOffset,
              zIndex: visiblePeople.length - index,
              borderColor: colors.background,
              borderRadius: size / 2 + 2,
            },
          ]}
        >
          <Avatar name={person.name} uri={person.uri} size={size} />
        </View>
      ))}

      {overflowCount > 0 && (
        <View
          style={[
            styles.overflowBadge,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              marginLeft: -overlapOffset,
              zIndex: 0,
              backgroundColor: colors.surface,
              borderColor: colors.background,
            },
          ]}
        >
          <Text
            style={[
              styles.overflowText,
              { color: colors.text, fontSize: Math.max(10, Math.round(size * 0.32)) },
            ]}
          >
            {`+${overflowCount}`}
          </Text>
        </View>
      )}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        activeOpacity={0.8}
      >
        {content}
      </TouchableOpacity>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarWrapper: {
    borderWidth: 2,
  },
  overflowBadge: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  overflowText: {
    fontWeight: '700',
  },
});
