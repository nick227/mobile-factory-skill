// Pure residency dashboard model: milestones drive status, hours and metrics consistently.
import { activities as seedActivities, milestones as seedMilestones, weeklyHours, priorCycleHours, type Activity, type MilestoneStatus } from './fixtures';

export interface State {
  tab: 'overview' | 'milestones' | 'guidelines'; openMilestoneId: string | null; expandedGuidelines: string[];
  statuses: Record<string, MilestoneStatus>; activities: Activity[]; week: number[]; feedback: string | null; nextActivity: number;
}
export type Action =
  | { type: 'tab'; tab: State['tab'] } | { type: 'openMilestone'; id: string } | { type: 'closeMilestone' }
  | { type: 'toggleGuideline'; id: string } | { type: 'logHours'; hours: number } | { type: 'completeActive' } | { type: 'dismissFeedback' };

export const initialState: State = {
  tab: 'overview', openMilestoneId: null, expandedGuidelines: ['rules-1'],
  statuses: Object.fromEntries(seedMilestones.map((m) => [m.id, m.status])), activities: seedActivities, week: weeklyHours, feedback: null, nextActivity: 1,
};
export const milestoneList = (s: State) => seedMilestones.map((m) => ({ ...m, status: s.statuses[m.id] }));
export const activeMilestone = (s: State) => milestoneList(s).find((m) => m.status === 'active') ?? null;
export const completedCount = (s: State) => milestoneList(s).filter((m) => m.status === 'completed').length;
/** Logging hours adds to the current week, so the weekly series is the single source of truth. */
export const totalHours = (s: State) => s.week.reduce((n, h) => n + h, 0);
export const hoursDelta = (s: State) => { const pct = ((totalHours(s) - priorCycleHours) / priorCycleHours) * 100; return `${pct >= 0 ? '+' : ''}${pct.toFixed(1)}%`; };
/** Overall residency progress: each milestone is 25%; the active one counts half once it has logged work. */
export const progress = (s: State) => {
  const ms = milestoneList(s);
  const active = activeMilestone(s);
  const partial = active && s.activities.some((a) => a.milestoneId === active.id) ? 0.5 : 0;
  return Math.round(((completedCount(s) + partial) / ms.length) * 100);
};
export const activitiesFor = (s: State, id: string) => s.activities.filter((a) => a.milestoneId === id);
export const isComplete = (s: State) => completedCount(s) === seedMilestones.length;

export function reducer(s: State, a: Action): State {
  switch (a.type) {
    case 'tab': return { ...s, tab: a.tab, openMilestoneId: a.tab === 'milestones' ? s.openMilestoneId : null };
    case 'openMilestone': return seedMilestones.some((m) => m.id === a.id) ? { ...s, tab: 'milestones', openMilestoneId: a.id } : s;
    case 'closeMilestone': return { ...s, openMilestoneId: null };
    case 'toggleGuideline': return { ...s, expandedGuidelines: s.expandedGuidelines.includes(a.id) ? s.expandedGuidelines.filter((x) => x !== a.id) : [...s.expandedGuidelines, a.id] };
    case 'logHours': {
      const m = activeMilestone(s);
      if (!m || a.hours <= 0) return { ...s, feedback: m ? s.feedback : 'All milestones are complete; nothing to log.' };
      const entry: Activity = { id: `log${s.nextActivity}`, milestoneId: m.id, title: 'Studio session logged', date: 'Today', hours: a.hours };
      const week = [...s.week.slice(0, -1), s.week[s.week.length - 1] + a.hours];
      return { ...s, activities: [...s.activities, entry], week, nextActivity: s.nextActivity + 1, feedback: `Logged ${a.hours} hrs to ${m.title}` };
    }
    case 'completeActive': {
      const ms = milestoneList(s);
      const i = ms.findIndex((m) => m.status === 'active');
      if (i < 0) return s;
      if (!s.activities.some((x) => x.milestoneId === ms[i].id)) return { ...s, feedback: 'Log work on this milestone before completing it.' };
      const statuses = { ...s.statuses, [ms[i].id]: 'completed' as const };
      if (ms[i + 1]) statuses[ms[i + 1].id] = 'active';
      return { ...s, statuses, feedback: ms[i + 1] ? `${ms[i].title} completed. Next: ${ms[i + 1].title}` : 'Residency complete. Congratulations!' };
    }
    case 'dismissFeedback': return { ...s, feedback: null };
  }
}
