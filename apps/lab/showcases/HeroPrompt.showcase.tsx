import React, { useState } from 'react';
import { View } from 'react-native';
import { HeroPrompt, Stack, Text, Surface } from '@factory/ui';

export function HeroPromptShowcase() {
  const [state, setState] = useState<'prompt' | 'started'>('prompt');

  if (state === 'started') {
    return (
      <HeroPrompt
        badge="ACTIVE SESSION"
        title="Session in Progress"
        subtitle="Your environment is primed. Breathe deeply and focus on your singular task."
        primaryAction={{
          label: 'Complete Session',
          onPress: () => setState('prompt'),
        }}
        secondaryAction={{
          label: 'Take 5m Pause',
          variant: 'outline',
          onPress: () => {},
        }}
      />
    );
  }

  return (
    <Stack gap="lg">
      <Surface outlined>
        <HeroPrompt
          illustration={<Text style={{ fontSize: 44 }}>🧘</Text>}
          badge="ZEN FALLBACK"
          title="Clear Your Mind"
          subtitle="One dominant intention. No notifications, no clutter, no cognitive overload."
          primaryAction={{
            label: 'Begin 20m Breathwork',
            onPress: () => setState('started'),
          }}
          secondaryAction={{
            label: 'Remind Me Later',
            onPress: () => {},
          }}
          docked={false}
        />
      </Surface>
    </Stack>
  );
}
