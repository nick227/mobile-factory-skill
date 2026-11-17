import React, { useState } from 'react';
import { View } from 'react-native';
import { LiveActivityCard, Stack, Text, Surface } from '@factory/ui';

export function LiveActivityCardShowcase() {
  const [expanded, setExpanded] = useState(false);

  return (
    <Stack gap="lg">
      <Surface outlined>
        <Stack gap="md">
          <Text variant="heading">Live Activities & Island Glance</Text>
          <LiveActivityCard
            title="Shinkansen Nozomi 42"
            subtitle="Kyoto → Tokyo · On Schedule"
            leadingIcon={<Text style={{ fontSize: 20 }}>🚄</Text>}
            trailingMetric="42 min"
            progress={0.68}
            statusTone="live"
            actionLabel="View Ticket"
            onAction={() => {}}
            expanded={expanded}
            onToggleExpand={() => setExpanded(!expanded)}
            expandedContent={
              <Stack gap="xs">
                <Text variant="small">Car 7 · Seat 12-A (Window)</Text>
                <Text variant="small" muted>Next station: Shin-Yokohama (18 min)</Text>
              </Stack>
            }
          />

          <LiveActivityCard
            title="Focus Session"
            subtitle="Zen Mode · Do Not Disturb"
            leadingIcon={<Text style={{ fontSize: 20 }}>🧘</Text>}
            trailingMetric="18:42"
            progress={0.4}
            statusTone="calm"
          />
        </Stack>
      </Surface>
    </Stack>
  );
}
