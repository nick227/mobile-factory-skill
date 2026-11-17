import React, { useState } from 'react';
import { View } from 'react-native';
import { RadialProgress, Stack, Row, Text, Button, Surface } from '@factory/ui';

export function RadialProgressShowcase() {
  const [val, setVal] = useState(72);

  return (
    <Stack gap="lg">
      <Surface outlined>
        <Stack gap="md" align="center">
          <Text variant="heading">Activity & Complication Rings</Text>
          <RadialProgress value={val} size={130} strokeWidth={12} tone="primary" showValue />

          <Row style={{ gap: 8 }}>
            <Button label="-10%" size="sm" variant="outline" onPress={() => setVal(Math.max(0, val - 10))} />
            <Button label="+10%" size="sm" variant="outline" onPress={() => setVal(Math.min(100, val + 10))} />
          </Row>
        </Stack>
      </Surface>

      <Surface outlined>
        <Stack gap="md">
          <Text variant="heading">Concentric Glance Tones</Text>
          <Row style={{ justifyContent: 'space-around', alignItems: 'center' }}>
            <RadialProgress value={88} size={84} strokeWidth={8} tone="success" showValue />
            <RadialProgress value={45} size={84} strokeWidth={8} tone="warning" showValue />
            <RadialProgress value={20} size={84} strokeWidth={8} tone="danger" showValue />
          </Row>
        </Stack>
      </Surface>
    </Stack>
  );
}
