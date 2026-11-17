// Pure activity-hub model: feed, checklist and calendar share one dataset and stay consistent.
import { activities as seedActivities, tasks as seedTasks, visits, TODAY, type Activity } from './fixtures';

export type Tab = 'feed' | 'tasks' | 'calendar';
export interface State { tab: Tab; date: string; completed: Record<string, boolean>; activities: Activity[]; signedOff: boolean; highlightTaskId: string | null; seq: number }
export type Action =
  | { type: 'tab'; tab: Tab } | { type: 'selectDate'; date: string } | { type: 'toggleTask'; id: string; completed: boolean }
  | { type: 'openTask'; id: string } | { type: 'openVisit'; id: string } | { type: 'signOff' };

export const initialState: State = { tab: 'feed', date: TODAY, completed: Object.fromEntries(seedTasks.map((t) => [t.id, t.completed])), activities: seedActivities, signedOff: false, highlightTaskId: null, seq: 1 };

export const taskList = (s: State) => seedTasks.map((t) => ({ ...t, completed: s.completed[t.id] }));
export const openRequired = (s: State) => taskList(s).filter((t) => t.required && !t.completed).length;
export const canSignOff = (s: State) => !s.signedOff && openRequired(s) === 0;
export const feed = (s: State) => s.activities;
/** Calendar marks derive from visits and open-task due dates. */
export function marks(s: State) {
  const m: Record<string, { kind: 'visit' | 'due' | 'both' }> = {};
  for (const v of visits) m[v.date] = { kind: 'visit' };
  for (const t of taskList(s)) if (!t.completed) m[t.due] = { kind: m[t.due] ? 'both' : 'due' };
  return m;
}
export const agenda = (s: State, date = s.date) => ({
  visits: visits.filter((v) => v.date === date),
  due: taskList(s).filter((t) => t.due === date),
  activity: s.activities.filter((a) => a.date === date),
});

export function reducer(s: State, a: Action): State {
  switch (a.type) {
    case 'tab': return { ...s, tab: a.tab, highlightTaskId: a.tab === 'tasks' ? s.highlightTaskId : null };
    case 'selectDate': return { ...s, date: a.date };
    case 'toggleTask': {
      const t = seedTasks.find((x) => x.id === a.id);
      if (!t || s.signedOff || s.completed[a.id] === a.completed) return s;
      const entry: Activity = { id: `n${s.seq}`, user: 'You', title: `${a.completed ? 'Completed' : 'Reopened'}: ${t.title}`, date: TODAY, timeLabel: 'Just now', badge: a.completed ? 'Task' : 'Reopened', badgeTone: a.completed ? 'success' : 'warning', taskId: t.id };
      return { ...s, completed: { ...s.completed, [a.id]: a.completed }, activities: [entry, ...s.activities], seq: s.seq + 1 };
    }
    case 'openTask': return seedTasks.some((t) => t.id === a.id) ? { ...s, tab: 'tasks', highlightTaskId: a.id } : s;
    case 'openVisit': { const v = visits.find((x) => x.id === a.id); return v ? { ...s, tab: 'calendar', date: v.date } : s; }
    case 'signOff': {
      if (!canSignOff(s)) return s;
      const entry: Activity = { id: `n${s.seq}`, user: 'You', title: 'Submitted site sign-off', date: TODAY, timeLabel: 'Just now', badge: 'Sign-off', badgeTone: 'success', description: 'All required punch-list items verified.' };
      return { ...s, signedOff: true, activities: [entry, ...s.activities], seq: s.seq + 1 };
    }
  }
}
