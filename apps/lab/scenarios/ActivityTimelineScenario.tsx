import React, { useReducer } from 'react';
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
} from '@factory/ui';
import { team, tasks as taskFixtures } from '../demos/timeline/fixtures';
import { initialState, reducer, taskList, openRequired, canSignOff, marks, agenda, feed } from '../demos/timeline/model';

export function ActivityTimelineScenario() {
  const { colors } = useTheme();
  const [s, dispatch] = useReducer(reducer, initialState);
  const open = openRequired(s);
  const tabs = [
    { id: 'feed', label: 'Activity Feed' },
    { id: 'tasks', label: 'Punch List', badge: open > 0 ? String(open) : undefined },
    { id: 'calendar', label: 'Site Visits' },
  ];
  const calendarMarks = Object.fromEntries(Object.entries(marks(s)).map(([date, m]) => [date, { hasEvents: true, dotColor: m.kind === 'visit' ? colors.primary : m.kind === 'due' ? colors.warning : colors.danger }]));
  const day = agenda(s);
  const highlighted = taskFixtures.find((t) => t.id === s.highlightTaskId);

  return (
    <Stack gap="md">
      <ScreenHeader title="Pavilion Construction Hub" subtitle="Live site logs, punch lists, and architect inspections" />
      <Surface outlined>
        <Row style={{ justifyContent: 'space-between', alignItems: 'center' }}>
          <Stack gap="xs">
            <Text style={{ fontWeight: '700' }}>Active Site Team</Text>
            <Text muted variant="caption">{s.signedOff ? 'Site signed off' : `${open} required ${open === 1 ? 'item' : 'items'} open`}</Text>
          </Stack>
          <PeopleStack people={team} maxVisible={4} size={36} />
        </Row>
      </Surface>

      <Tabs tabs={tabs} value={s.tab} onValueChange={(t) => dispatch({ type: 'tab', tab: t as typeof s.tab })} />

      {s.tab === 'feed' && (
        <RichActivityTimeline
          events={feed(s).map((a) => ({
            id: a.id,
            user: { name: a.user },
            title: a.title,
            timestamp: a.timeLabel,
            badge: a.badge,
            badgeTone: a.badgeTone,
            description: a.description,
            attachment: a.attachment,
            actions: [
              ...(a.taskId ? [{ label: 'Open in Punch List', onPress: () => dispatch({ type: 'openTask', id: a.taskId! }) }] : []),
              ...(a.visitId ? [{ label: 'Show on Calendar', onPress: () => dispatch({ type: 'openVisit', id: a.visitId! }) }] : []),
            ],
          }))}
        />
      )}

      {s.tab === 'tasks' && (
        <Stack gap="sm">
          {highlighted ? (
            <Surface outlined>
              <Text variant="small">Opened from the feed: <Text variant="small" style={{ fontWeight: '700' }}>{highlighted.title}</Text> · due {highlighted.due} · {highlighted.owner}</Text>
            </Surface>
          ) : null}
          {s.signedOff ? <Badge label="Site sign-off submitted" tone="success" /> : null}
          <SmartChecklist
            title="On-Site Quality Punch List"
            description={s.signedOff ? 'Locked after sign-off.' : 'Complete every required item to submit the site sign-off.'}
            items={taskList(s).map((t) => ({ id: t.id, title: t.title, description: `${t.description} · due ${t.due.slice(5)} · ${t.owner}`, completed: t.completed, required: t.required }))}
            onToggle={(id, completed) => dispatch({ type: 'toggleTask', id, completed })}
            action={{ label: s.signedOff ? 'Signed Off' : 'Submit Site Sign-off', onPress: () => dispatch({ type: 'signOff' }), disabled: !canSignOff(s) }}
          />
        </Stack>
      )}

      {s.tab === 'calendar' && (
        <Stack gap="md">
          <ActivityCalendar year={2026} month={11} selectedDate={s.date} onSelectDate={(date) => dispatch({ type: 'selectDate', date })} markedDates={calendarMarks} />
          <Surface outlined>
            <Stack gap="sm">
              <Text variant="heading">Schedule for {s.date}</Text>
              {day.visits.length + day.due.length + day.activity.length === 0 ? <Text muted variant="small">Nothing scheduled on this date.</Text> : null}
              {day.visits.map((v) => <Text key={v.id} variant="small">{v.time} — {v.title}</Text>)}
              {day.due.map((t) => (
                <Row key={t.id} style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text variant="small" style={{ flex: 1 }}>Due: {t.title}</Text>
                  <Badge label={t.completed ? 'Done' : 'Open'} tone={t.completed ? 'success' : 'warning'} />
                </Row>
              ))}
              {day.activity.map((a) => <Text key={a.id} muted variant="small">{a.user}: {a.title}</Text>)}
            </Stack>
          </Surface>
        </Stack>
      )}
    </Stack>
  );
}
