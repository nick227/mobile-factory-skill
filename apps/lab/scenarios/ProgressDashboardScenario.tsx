import React, { useState } from 'react';
import { View } from 'react-native';
import {
  Text,
  Stack,
  Surface,
  Button,
  Tabs,
  IdentityHeader,
  MetricSpotlight,
  ProgressJourney,
  StatusTracker,
  Accordion,
  useTheme,
} from '@factory/ui';

export function ProgressDashboardScenario() {
  const { colors } = useTheme();
  const [activeTab, setActiveTab] = useState<'overview' | 'milestones' | 'guidelines'>('overview');
  const [expandedGuidelines, setExpandedGuidelines] = useState<string[]>(['rules-1']);

  const tabs = [
    { id: 'overview', label: 'Studio Metrics' },
    { id: 'milestones', label: 'Residency Timeline', badge: 'Active' },
    { id: 'guidelines', label: 'Facilities' },
  ];

  const residencyMilestones = [
    {
      id: 'm1',
      title: 'Residency Proposal Accepted',
      description: 'Panel approved "Contemporary Tea Pavilions" monograph.',
      timestamp: 'Oct 01, 2026',
      status: 'completed' as const,
    },
    {
      id: 'm2',
      title: 'Studio Setup & Material Sourcing',
      description: 'Yoshino cedar lumber and joinery tools arrived.',
      timestamp: 'Oct 15, 2026',
      status: 'completed' as const,
    },
    {
      id: 'm3',
      title: 'Full-Scale Model Construction',
      description: 'Timber framing and interlocking joinery assembly underway.',
      timestamp: 'In Progress (Day 18 of 30)',
      status: 'active' as const,
    },
    {
      id: 'm4',
      title: 'Public Exhibition & Tea Ceremony',
      description: 'Final pavilion unveiling and guest masterclass ceremony.',
      status: 'upcoming' as const,
    },
  ];

  const facilityGuidelines = [
    {
      id: 'rules-1',
      title: 'Heavy Woodworking & Joinery Shop',
      subtitle: 'Table saws, band saws, planers, dust extraction',
      content: (
        <Text muted variant="small">
          Safety induction required prior to first operation. Eye and ear
          protection mandatory. Dust extraction must be switched on before any cut.
        </Text>
      ),
    },
    {
      id: 'rules-2',
      title: 'Ceramic Kiln Firing Schedule',
      subtitle: 'Electric and gas kiln reservation rules',
      content: (
        <Text muted variant="small">
          Firing reservations must be requested 48 hours in advance via the
          Schedule Picker. Ensure all clay bodies are dry to touch before bisquing.
        </Text>
      ),
    },
    {
      id: 'rules-3',
      title: 'Digital Fabrication Lab',
      subtitle: 'CNC routers, 3D printers, laser cutters',
      content: (
        <Text muted variant="small">
          Supported file formats: DXF, STL, SVG. Overnight jobs allowed with fire
          suppression sensor verified.
        </Text>
      ),
    },
  ];

  return (
    <Stack gap="md">
      {/* Identity profile header */}
      <IdentityHeader
        name="Kengo Kuma Studio"
        handle="@kkaa_fellows"
        avatarUri="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80"
        verified
        bio="Architecture, sustainable cedar structures, and ambient tea pavilion prototypes."
        stats={[
          { label: 'Days Active', value: '48' },
          { label: 'Milestones', value: '3/4' },
          { label: 'Exhibitions', value: '2' },
        ]}
      />

      {/* Tabs navigation */}
      <Tabs tabs={tabs} value={activeTab} onValueChange={(t) => setActiveTab(t as any)} scrollable />

      {/* Tab 1: Overview & Metrics */}
      {activeTab === 'overview' && (
        <Stack gap="md">
          <StatusTracker
            title="Pavilion Framing Construction"
            statusLabel="On Schedule"
            tone="success"
            progress={75}
            description="Interlocking joints assembled; roof lattice installation begins tomorrow."
            estimatedTime="Final inspection in 6 days"
          />

          <MetricSpotlight
            label="Studio Hours Logged"
            value="142.5"
            unit="hrs"
            delta={{ value: '+18%', direction: 'up', period: 'vs last residency cycle', tone: 'positive' }}
            sparklineData={[12, 18, 14, 22, 28, 24, 30]}
            description="Workshop tool utilization and assembly time."
          />

          <MetricSpotlight
            label="Material Efficiency"
            value="94.2%"
            delta={{ value: '+3.1%', direction: 'up', period: 'scrap reduction', tone: 'positive' }}
            sparklineData={[80, 82, 85, 88, 91, 94]}
          />
        </Stack>
      )}

      {/* Tab 2: Residency Timeline */}
      {activeTab === 'milestones' && (
        <Surface outlined>
          <Stack gap="sm">
            <Text variant="heading">Residency Roadmap</Text>
            <ProgressJourney steps={residencyMilestones} />
          </Stack>
        </Surface>
      )}

      {/* Tab 3: Facilities & Guidelines */}
      {activeTab === 'guidelines' && (
        <Stack gap="sm">
          <Text variant="heading">Studio Guidelines & Protocols</Text>
          <Accordion
            items={facilityGuidelines}
            expandedIds={expandedGuidelines}
            onToggle={(id) =>
              setExpandedGuidelines((prev) =>
                prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
              )
            }
          />
        </Stack>
      )}
    </Stack>
  );
}
