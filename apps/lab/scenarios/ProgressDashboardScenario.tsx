import React, { useReducer } from 'react';
import {
  Text,
  Stack,
  Row,
  Surface,
  Button,
  Badge,
  Tabs,
  IdentityHeader,
  MetricSpotlight,
  ProgressJourney,
  StatusTracker,
  Accordion,
  ScreenHeader,
} from '@factory/ui';
import { scrapRateByWeek } from '../demos/dashboard/fixtures';
import { initialState, reducer, milestoneList, activeMilestone, completedCount, totalHours, hoursDelta, progress, activitiesFor, isComplete } from '../demos/dashboard/model';

const facilityGuidelines = [
  { id: 'rules-1', title: 'Heavy Woodworking & Joinery Shop', subtitle: 'Table saws, band saws, planers, dust extraction', content: <Text muted variant="small">Safety induction required prior to first operation. Eye and ear protection mandatory. Dust extraction must be switched on before any cut.</Text> },
  { id: 'rules-2', title: 'Ceramic Kiln Firing Schedule', subtitle: 'Electric and gas kiln reservation rules', content: <Text muted variant="small">Firing reservations must be requested 48 hours in advance. Ensure all clay bodies are dry to touch before bisquing.</Text> },
  { id: 'rules-3', title: 'Digital Fabrication Lab', subtitle: 'CNC routers, 3D printers, laser cutters', content: <Text muted variant="small">Supported file formats: DXF, STL, SVG. Overnight jobs allowed with fire suppression sensor verified.</Text> },
];

export function ProgressDashboardScenario() {
  const [s, dispatch] = useReducer(reducer, initialState);
  const milestones = milestoneList(s);
  const active = activeMilestone(s);
  const open = milestones.find((m) => m.id === s.openMilestoneId) ?? null;
  const tabs = [
    { id: 'overview', label: 'Studio Metrics' },
    { id: 'milestones', label: 'Residency Timeline', badge: active ? 'Active' : undefined },
    { id: 'guidelines', label: 'Facilities' },
  ];
  const feedback = s.feedback ? (
    <Surface outlined>
      <Row style={{ justifyContent: 'space-between', alignItems: 'center' }}>
        <Text variant="small" accessibilityRole="alert" style={{ flex: 1 }}>{s.feedback}</Text>
        <Button label="Dismiss" variant="ghost" onPress={() => dispatch({ type: 'dismissFeedback' })} />
      </Row>
    </Surface>
  ) : null;

  return (
    <Stack gap="md">
      <IdentityHeader
        name="Kengo Kuma Studio"
        handle="@kkaa_fellows"
        avatarUri="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80"
        verified
        bio="Architecture, sustainable cedar structures, and ambient tea pavilion prototypes."
        stats={[
          { label: 'Hours Logged', value: totalHours(s).toFixed(1) },
          { label: 'Milestones', value: `${completedCount(s)}/${milestones.length}` },
          { label: 'Progress', value: `${progress(s)}%` },
        ]}
      />
      <Tabs tabs={tabs} value={s.tab} onValueChange={(t) => dispatch({ type: 'tab', tab: t as typeof s.tab })} scrollable />
      {feedback}

      {s.tab === 'overview' && (
        <Stack gap="md">
          <StatusTracker
            title={isComplete(s) ? 'Residency Complete' : active!.title}
            statusLabel={isComplete(s) ? 'Complete' : 'In Progress'}
            tone={isComplete(s) ? 'success' : 'info'}
            progress={progress(s)}
            description={isComplete(s) ? 'All four milestones signed off.' : `${completedCount(s)} of ${milestones.length} milestones complete. ${activitiesFor(s, active!.id).length} sessions logged on the current milestone.`}
            primaryAction={active ? { label: 'Open Current Milestone', onPress: () => dispatch({ type: 'openMilestone', id: active.id }) } : undefined}
          />
          <MetricSpotlight
            label="Studio Hours Logged"
            value={totalHours(s).toFixed(1)}
            unit="hrs"
            delta={{ value: hoursDelta(s), direction: 'up', period: 'vs last residency cycle', tone: 'positive' }}
            sparklineData={s.week}
            description="Workshop sessions across the residency. Log a session to update this metric."
            onPress={active ? () => dispatch({ type: 'logHours', hours: 2 }) : undefined}
            actionLabel={active ? 'Log 2 hrs' : undefined}
          />
          <MetricSpotlight
            label="Material Scrap Rate"
            value={`${scrapRateByWeek[scrapRateByWeek.length - 1]}%`}
            delta={{ value: '-3.2 pts', direction: 'down', period: 'vs last week', tone: 'positive' }}
            sparklineData={scrapRateByWeek}
          />
        </Stack>
      )}

      {s.tab === 'milestones' && !open && (
        <Surface outlined>
          <Stack gap="sm">
            <Text variant="heading">Residency Roadmap</Text>
            <Text muted variant="small">Tap a milestone to see its activity.</Text>
            <ProgressJourney steps={milestones.map((m) => ({ id: m.id, title: m.title, description: m.description, timestamp: m.status === 'active' ? 'In progress' : m.date, status: m.status }))} onPressStep={(id) => dispatch({ type: 'openMilestone', id })} />
          </Stack>
        </Surface>
      )}

      {s.tab === 'milestones' && open && (
        <Stack gap="md">
          <ScreenHeader title={open.title} subtitle={open.description} backLabel="Roadmap" onBack={() => dispatch({ type: 'closeMilestone' })} />
          <Badge label={open.status === 'completed' ? 'Completed' : open.status === 'active' ? 'In progress' : 'Upcoming'} tone={open.status === 'completed' ? 'success' : open.status === 'active' ? 'accent' : 'neutral'} />
          <Surface outlined>
            <Stack gap="sm">
              <Text variant="heading">Activity</Text>
              {activitiesFor(s, open.id).length === 0 ? (
                <Text muted variant="small">{open.status === 'upcoming' ? 'This milestone starts after the current one is completed.' : 'No sessions logged yet.'}</Text>
              ) : activitiesFor(s, open.id).map((a) => (
                <Row key={a.id} style={{ justifyContent: 'space-between' }}>
                  <Text variant="small" style={{ flex: 1 }}>{a.date} · {a.title}</Text>
                  <Text variant="small" style={{ fontWeight: '600' }}>{a.hours} hrs</Text>
                </Row>
              ))}
            </Stack>
          </Surface>
          {open.status === 'active' ? (
            <Stack gap="sm">
              <Button label="Log 2 hrs Session" variant="secondary" fullWidth onPress={() => dispatch({ type: 'logHours', hours: 2 })} />
              <Button label="Mark Milestone Complete" fullWidth disabled={activitiesFor(s, open.id).length === 0} onPress={() => dispatch({ type: 'completeActive' })} />
            </Stack>
          ) : null}
        </Stack>
      )}

      {s.tab === 'guidelines' && (
        <Stack gap="sm">
          <Text variant="heading">Studio Guidelines & Protocols</Text>
          <Accordion items={facilityGuidelines} expandedIds={s.expandedGuidelines} onToggle={(id) => dispatch({ type: 'toggleGuideline', id })} />
        </Stack>
      )}
    </Stack>
  );
}
