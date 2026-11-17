import React, { useState } from 'react';
import { View, ScrollView } from 'react-native';
import {
  Text,
  Stack,
  Row,
  Surface,
  Button,
  Badge,
  ScreenHeader,
  RadialProgress,
  GlanceHero,
  ControlTile,
  LiveActivityCard,
  SlideToConfirm,
  useTheme,
} from '@factory/ui';

export function ZenLockscreenScenario() {
  const { colors, tokens } = useTheme();

  const [focusActive, setFocusActive] = useState(true);
  const [shieldActive, setShieldActive] = useState(true);
  const [ambientActive, setAmbientActive] = useState(false);
  const [sleepScore, setSleepScore] = useState(88);
  const [unlocked, setUnlocked] = useState(false);
  const [expandedActivity, setExpandedActivity] = useState(false);

  return (
    <ScrollView
      contentContainerStyle={{ paddingBottom: 60 }}
      showsVerticalScrollIndicator={false}
    >
      <Stack gap="lg">
        <ScreenHeader
          title="Zen Native Lockscreen & Glance"
          subtitle="System-level native design: monumental typography, calm status, and tactile tiles"
        />

        {/* The Native Phone Frame Mockup */}
        <View
          style={{
            backgroundColor: '#090B10',
            borderRadius: 36,
            borderWidth: 1.5,
            borderColor: 'rgba(255, 255, 255, 0.12)',
            padding: 24,
            gap: 20,
            overflow: 'hidden',
          }}
        >
          {/* Status Bar Whisper */}
          <Row style={{ justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: 13, fontWeight: '700' }}>
              Kyoto Telecom 5G
            </Text>
            <Row style={{ gap: 6, alignItems: 'center' }}>
              <Text style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: 13 }}>94%</Text>
              <View
                style={{
                  width: 20,
                  height: 10,
                  borderRadius: 3,
                  borderWidth: 1,
                  borderColor: 'rgba(255, 255, 255, 0.6)',
                  padding: 1.5,
                }}
              >
                <View
                  style={{
                    width: '90%',
                    height: '100%',
                    backgroundColor: '#10B981',
                    borderRadius: 1.5,
                  }}
                />
              </View>
            </Row>
          </Row>

          {/* Monumental Clock & Date */}
          <View style={{ alignItems: 'center', gap: 4, marginTop: 8 }}>
            <Text
              style={{
                fontSize: 14,
                fontWeight: '700',
                color: 'rgba(255, 255, 255, 0.7)',
                textTransform: 'uppercase',
                letterSpacing: 2,
              }}
            >
              Tuesday, November 17
            </Text>
            <Text
              style={{
                fontSize: 76,
                fontWeight: '800',
                color: '#FFFFFF',
                letterSpacing: -2,
                fontVariant: ['tabular-nums'],
                lineHeight: 82,
              }}
            >
              08:42
            </Text>
          </View>

          {/* Glance Hero: Calm Physiological Readiness */}
          <View
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.04)',
              borderRadius: 24,
              borderWidth: 1,
              borderColor: 'rgba(255, 255, 255, 0.08)',
              padding: 18,
            }}
          >
            <GlanceHero
              value={`${sleepScore}%`}
              label="Equilibrium Score"
              status="calm"
              statusText="Optimal parasympathetic recovery"
              delta={{ value: '+6.4%', positive: true }}
              radialRing={{ value: sleepScore, color: '#10B981' }}
            />
          </View>

          {/* Complication Glance Rings */}
          <Row style={{ justifyContent: 'space-between', gap: 10 }}>
            <View
              style={{
                flex: 1,
                backgroundColor: 'rgba(255, 255, 255, 0.04)',
                borderRadius: 20,
                borderWidth: 1,
                borderColor: 'rgba(255, 255, 255, 0.08)',
                padding: 12,
                alignItems: 'center',
                gap: 8,
              }}
            >
              <Text
                style={{
                  fontSize: 10,
                  fontWeight: '700',
                  color: 'rgba(255, 255, 255, 0.5)',
                  textTransform: 'uppercase',
                  letterSpacing: 1,
                }}
              >
                Deep Sleep
              </Text>
              <RadialProgress value={84} size={64} strokeWidth={6} tone="primary" showValue />
              <Text style={{ fontSize: 11, color: 'rgba(255, 255, 255, 0.8)', fontWeight: '600' }}>
                2h 14m
              </Text>
            </View>

            <View
              style={{
                flex: 1,
                backgroundColor: 'rgba(255, 255, 255, 0.04)',
                borderRadius: 20,
                borderWidth: 1,
                borderColor: 'rgba(255, 255, 255, 0.08)',
                padding: 12,
                alignItems: 'center',
                gap: 8,
              }}
            >
              <Text
                style={{
                  fontSize: 10,
                  fontWeight: '700',
                  color: 'rgba(255, 255, 255, 0.5)',
                  textTransform: 'uppercase',
                  letterSpacing: 1,
                }}
              >
                Hydration
              </Text>
              <RadialProgress value={68} size={64} strokeWidth={6} tone="success" showValue />
              <Text style={{ fontSize: 11, color: 'rgba(255, 255, 255, 0.8)', fontWeight: '600' }}>
                1.8 L
              </Text>
            </View>

            <View
              style={{
                flex: 1,
                backgroundColor: 'rgba(255, 255, 255, 0.04)',
                borderRadius: 20,
                borderWidth: 1,
                borderColor: 'rgba(255, 255, 255, 0.08)',
                padding: 12,
                alignItems: 'center',
                gap: 8,
              }}
            >
              <Text
                style={{
                  fontSize: 10,
                  fontWeight: '700',
                  color: 'rgba(255, 255, 255, 0.5)',
                  textTransform: 'uppercase',
                  letterSpacing: 1,
                }}
              >
                Movement
              </Text>
              <RadialProgress value={92} size={64} strokeWidth={6} tone="accent" showValue />
              <Text style={{ fontSize: 11, color: 'rgba(255, 255, 255, 0.8)', fontWeight: '600' }}>
                8,420
              </Text>
            </View>
          </Row>

          {/* Live Activity: Floating Shinkansen transit countdown */}
          <LiveActivityCard
            title="Shinkansen Nozomi 42"
            subtitle="Kyoto → Tokyo · Platform 14"
            leadingIcon={<Text style={{ fontSize: 20 }}>🚄</Text>}
            trailingMetric="18 min"
            progress={0.72}
            statusTone="live"
            actionLabel="Ticket"
            onAction={() => {}}
            expanded={expandedActivity}
            onToggleExpand={() => setExpandedActivity(!expandedActivity)}
            expandedContent={
              <Stack gap="xs">
                <Text style={{ color: '#FFFFFF', fontSize: 13, fontWeight: '600' }}>
                  Car 8 (Green Car) · Seat 11-A (Window)
                </Text>
                <Text style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: 12 }}>
                  Arrival in Tokyo: 10:54 AM · On time
                </Text>
              </Stack>
            }
          />

          {/* Tactile Control Center Bento Tiles */}
          <Stack gap="xs">
            <Text
              style={{
                color: 'rgba(255, 255, 255, 0.5)',
                fontSize: 11,
                fontWeight: '700',
                textTransform: 'uppercase',
                letterSpacing: 1,
              }}
            >
              Control Center Quick Toggles
            </Text>
            <Row style={{ gap: 10 }}>
              <ControlTile
                label="Deep Focus"
                subtitle="Until 11:00 AM"
                icon={<Text style={{ fontSize: 20 }}>🌙</Text>}
                active={focusActive}
                onPress={() => setFocusActive(!focusActive)}
              />
              <ControlTile
                label="Hardware Shield"
                subtitle="Biometrics Armed"
                badge="SECURE"
                icon={<Text style={{ fontSize: 20 }}>🛡️</Text>}
                active={shieldActive}
                onPress={() => setShieldActive(!shieldActive)}
              />
            </Row>
          </Stack>

          {/* Slide to Unlock / Confirm */}
          <Stack gap="xs">
            <SlideToConfirm
              label="Slide to unlock device"
              completedLabel="Device Unlocked"
              confirmed={unlocked}
              onConfirm={() => setUnlocked(true)}
              onReset={() => setUnlocked(false)}
            />
          </Stack>
        </View>

        {/* Narrative & Rationale Card */}
        <Surface outlined>
          <Stack gap="sm">
            <Text variant="heading">The Native Mobile Standard</Text>
            <Text muted style={{ lineHeight: 22 }}>
              Notice the contrast with standard web-form design: there are no gray text input boxes or cluttered tables. Instead, content is communicated through monumental glanceable digits, continuous squircles, concentric progress rings, floating live activities, and tactile thumb tiles.
            </Text>
          </Stack>
        </Surface>
      </Stack>
    </ScrollView>
  );
}
