/**
 * @recipe recipe.onboarding-pager
 * @summary Swipeable intro pages with tappable previous/next and a final call to action.
 * @capabilities nav.paging, action.primary
 * @experiences onboarding-paging
 * @uses patterns.swipepager, primitives.stack, primitives.text, controls.button
 * @constraints Do not wrap SwipePager in a padded Screen
 */
import React from 'react';
import { View } from 'react-native';
import { SwipePager, Stack, Text, Button, useTheme } from '@/src/ui';

export function OnboardingPager({ pages, onDone }: { pages: readonly { id: string; title: string; body: string }[]; onDone: () => void }) {
  const { colors } = useTheme();
  return (
    <View style={{ flex: 1, justifyContent: 'center', backgroundColor: colors.background }}>
      <SwipePager label="Introduction" items={pages.map((p) => ({ id: p.id, content: <Stack gap="md" style={{ padding: 24 }}><Text variant="title">{p.title}</Text><Text muted>{p.body}</Text></Stack> }))} />
      <View style={{ padding: 24 }}><Button label="Get started" onPress={onDone} fullWidth /></View>
    </View>
  );
}
