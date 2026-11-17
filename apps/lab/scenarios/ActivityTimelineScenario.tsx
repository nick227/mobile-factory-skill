import React, { useState } from 'react';
import { View } from 'react-native';
import {
  Text,
  Stack,
  Row,
  Surface,
  Tabs,
  Badge,
  ScreenHeader,
  RichActivityTimeline,
  SmartChecklist,
  ActivityCalendar,
  PeopleStack,
  useTheme,
  tokens,
} from '@factory/ui';

export function ActivityTimelineScenario() {
  const { colors } = useTheme();
  const [activeTab, setActiveTab] = useState<'feed' | 'tasks' | 'calendar'>('feed');
  const [selectedDate, setSelectedDate] = useState('2026-11-18');

  const teamMembers = [
    { id: '1', name: 'Kengo Kuma', uri: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80' },
    { id: '2', name: 'Elena Rostova', uri: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80' },
    { id: '3', name: 'Kenji Sato', uri: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80' },
    { id: '4', name: 'Amina Diallo', uri: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=200&q=80' },
    { id: '5', name: 'Mateo Silva', uri: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=200&q=80' },
  ];

  const tabs = [
    { id: 'feed', label: 'Activity Feed' },
    { id: 'tasks', label: 'Punch List', badge: '3' },
    { id: 'calendar', label: 'Site Visits' },
  ];

  const timelineEvents = [
    {
      id: 'e1',
      user: {
        name: 'Kengo Kuma',
        avatarUri: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
      },
      title: 'Approved Pavilion Lattice Framing',
      timestamp: '25m ago',
      badge: 'Sign-off',
      badgeTone: 'success' as const,
      description: 'Yoshino cedar structural joinery satisfies all load testing tolerances.',
      actions: [{ label: 'View Certificate', onPress: () => {} }],
    },
    {
      id: 'e2',
      user: {
        name: 'Elena Rostova',
        avatarUri: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
      },
      title: 'Submitted Japanese Garden Acoustic Study',
      timestamp: '2h ago',
      badge: 'Report',
      badgeTone: 'accent' as const,
      description: 'Water basin sound reflections measure 38 dB ambient level.',
      attachment: { title: 'acoustic_survey_final.pdf', subtitle: '1.8 MB · Certified PDF' },
      actions: [{ label: 'Download PDF', onPress: () => {} }],
    },
    {
      id: 'e3',
      user: {
        name: 'Kenji Sato',
        avatarUri: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80',
      },
      title: 'Dispatched Hand-Split Hinoki Shingles',
      timestamp: 'Yesterday',
      badge: 'Logistics',
      description: 'Batch #28 departed Gifu prefecture warehouse via freight express.',
    },
  ];

  const [checklistItems, setChecklistItems] = useState([
    {
      id: 'task-1',
      title: 'Verify foundation bolt anchoring',
      description: 'Torque wrench verification by site supervisor',
      completed: true,
      required: true,
    },
    {
      id: 'task-2',
      title: 'Inspect tea room tatami mat alignments',
      description: 'Ensure 3mm expansion gap from cedar skirting',
      completed: true,
      required: true,
    },
    {
      id: 'task-3',
      title: 'Install shoji screen sliding track runners',
      description: 'Natural beeswax lubrication on cherry wood tracks',
      completed: false,
      required: true,
      badge: 'In Progress',
      badgeTone: 'warning' as const,
    },
    {
      id: 'task-4',
      title: 'Hang entrance noren curtain',
      description: 'Indigo-dyed hemp fabric from Kyoto master dyer',
      completed: false,
      badge: 'Pending Delivery',
    },
  ]);

  const calendarMarks = {
    '2026-11-18': { hasEvents: true, dotColor: colors.primary },
    '2026-11-20': { hasEvents: true, dotColor: colors.warning },
    '2026-11-24': { hasEvents: true, dotColor: colors.success },
  };

  const handleToggleChecklist = (id: string, completed: boolean) => {
    setChecklistItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, completed } : item))
    );
  };

  return (
    <Stack gap="md">
      <ScreenHeader
        title="Pavilion Construction Hub"
        subtitle="Live site logs, punch lists, and architect inspections"
      />

      {/* Team header row */}
      <Surface outlined>
        <Row style={{ justifyContent: 'space-between', alignItems: 'center' }}>
          <Stack gap="xs">
            <Text style={{ fontWeight: '700' }}>Active Site Team</Text>
            <Text muted variant="caption">5 master craftsmen & architects</Text>
          </Stack>
          <PeopleStack people={teamMembers} maxVisible={4} size={36} />
        </Row>
      </Surface>

      {/* Tab navigation */}
      <Tabs tabs={tabs} value={activeTab} onValueChange={(t) => setActiveTab(t as any)} scrollable />

      {/* Tab 1: Live Feed */}
      {activeTab === 'feed' && (
        <RichActivityTimeline events={timelineEvents} />
      )}

      {/* Tab 2: Punch List / Checklist */}
      {activeTab === 'tasks' && (
        <SmartChecklist
          title="On-Site Quality Punch List"
          description="Mandatory sign-offs before client tea master ceremony."
          items={checklistItems}
          onToggle={handleToggleChecklist}
          action={{
            label: 'Submit Site Sign-off',
            onPress: () => {},
            disabled: !checklistItems.filter((i) => i.required).every((i) => i.completed),
          }}
        />
      )}

      {/* Tab 3: Site Visits Calendar */}
      {activeTab === 'calendar' && (
        <Stack gap="md">
          <ActivityCalendar
            year={2026}
            month={11}
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
            markedDates={calendarMarks}
          />
          <Surface outlined>
            <Stack gap="xs">
              <Text variant="heading">Schedule for {selectedDate}</Text>
              <Text muted variant="small">
                {selectedDate === '2026-11-18'
                  ? '09:00 AM — Lead timber architect framing inspection with Master Kuma.'
                  : selectedDate === '2026-11-20'
                  ? '02:00 PM — Heritage conservation zoning inspector on-site.'
                  : 'No scheduled public inspections on this date.'}
              </Text>
            </Stack>
          </Surface>
        </Stack>
      )}
    </Stack>
  );
}
