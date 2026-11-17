import React, { useState } from 'react';
import { View } from 'react-native';
import { ControlTile, Stack, Row, Text, Surface } from '@factory/ui';

export function ControlTileShowcase() {
  const [focus, setFocus] = useState(true);
  const [audio, setAudio] = useState(false);
  const [shield, setShield] = useState(true);

  return (
    <Stack gap="lg">
      <Surface outlined>
        <Stack gap="md">
          <Text variant="heading">Control Center Tactile Tiles</Text>
          <Row style={{ gap: 12 }}>
            <ControlTile
              label="Deep Focus"
              subtitle="Until 11:00 AM"
              icon={<Text style={{ fontSize: 20 }}>🌙</Text>}
              active={focus}
              onPress={() => setFocus(!focus)}
            />
            <ControlTile
              label="Spatial Audio"
              subtitle="Head Tracked"
              icon={<Text style={{ fontSize: 20 }}>🎧</Text>}
              active={audio}
              onPress={() => setAudio(!audio)}
            />
          </Row>

          <ControlTile
            label="Hardware Security Key"
            subtitle="Encrypted & Armed"
            badge="ACTIVE"
            aspect="wide"
            icon={<Text style={{ fontSize: 20 }}>🛡️</Text>}
            active={shield}
            onPress={() => setShield(!shield)}
          />
        </Stack>
      </Surface>
    </Stack>
  );
}
