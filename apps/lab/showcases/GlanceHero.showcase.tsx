import React from 'react';
import { View } from 'react-native';
import { GlanceHero, Stack, Surface, Button } from '@factory/ui';

export function GlanceHeroShowcase() {
  return (
    <Stack gap="lg">
      <Surface outlined>
        <Stack gap="md">
          <GlanceHero
            value="08:42"
            unit="HRS"
            label="Rest & Recovery"
            status="calm"
            statusText="Optimal physiological readiness"
            delta={{ value: "+45m", positive: true }}
            radialRing={{ value: 88, color: '#10B981' }}
          />
        </Stack>
      </Surface>

      <Surface outlined>
        <Stack gap="md">
          <GlanceHero
            value="¥324,500"
            label="Treasury Balance"
            status="active"
            statusText="Settlement cleared · 4 transactions"
            delta={{ value: "+12.8%", positive: true }}
            align="left"
            actions={<Button label="Transfer Funds" size="sm" />}
          />
        </Stack>
      </Surface>
    </Stack>
  );
}
