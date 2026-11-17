// One shared dataset: tasks, site visits and activities reference each other by id and date.
export const TODAY = '2026-11-18';
export const team = [
  { id: '1', name: 'Kengo Kuma' }, { id: '2', name: 'Elena Rostova' }, { id: '3', name: 'Kenji Sato' }, { id: '4', name: 'Amina Diallo' }, { id: '5', name: 'Mateo Silva' },
];
export interface Task { id: string; title: string; description: string; required: boolean; due: string; completed: boolean; owner: string }
export const tasks: Task[] = [
  { id: 'task-1', title: 'Verify foundation bolt anchoring', description: 'Torque wrench verification by site supervisor', required: true, due: '2026-11-17', completed: true, owner: 'Kenji Sato' },
  { id: 'task-2', title: 'Inspect tatami mat alignments', description: 'Ensure 3mm expansion gap from cedar skirting', required: true, due: '2026-11-18', completed: true, owner: 'Amina Diallo' },
  { id: 'task-3', title: 'Install shoji screen track runners', description: 'Natural beeswax lubrication on cherry wood tracks', required: true, due: '2026-11-20', completed: false, owner: 'Mateo Silva' },
  { id: 'task-4', title: 'Hang entrance noren curtain', description: 'Indigo-dyed hemp from a Kyoto master dyer', required: false, due: '2026-11-24', completed: false, owner: 'Elena Rostova' },
];
export interface Visit { id: string; date: string; time: string; title: string; taskIds: string[] }
export const visits: Visit[] = [
  { id: 'v1', date: '2026-11-18', time: '09:00', title: 'Framing inspection with Master Kuma', taskIds: ['task-2'] },
  { id: 'v2', date: '2026-11-20', time: '14:00', title: 'Heritage zoning inspector on site', taskIds: ['task-3'] },
  { id: 'v3', date: '2026-11-24', time: '10:30', title: 'Client walkthrough before tea ceremony', taskIds: ['task-4'] },
];
export interface Activity { id: string; user: string; title: string; date: string; timeLabel: string; description?: string; badge?: string; badgeTone?: 'success' | 'accent' | 'warning' | 'neutral'; taskId?: string; visitId?: string; attachment?: { title: string; subtitle?: string } }
export const activities: Activity[] = [
  { id: 'a1', user: 'Kengo Kuma', title: 'Approved pavilion lattice framing', date: '2026-11-18', timeLabel: '25m ago', badge: 'Sign-off', badgeTone: 'success', description: 'Cedar joinery satisfies all load testing tolerances.', visitId: 'v1' },
  { id: 'a2', user: 'Elena Rostova', title: 'Submitted garden acoustic study', date: '2026-11-18', timeLabel: '2h ago', badge: 'Report', badgeTone: 'accent', description: 'Water basin reflections measure 38 dB ambient.', attachment: { title: 'acoustic_survey_final.pdf', subtitle: '1.8 MB · PDF' } },
  { id: 'a3', user: 'Kenji Sato', title: 'Completed foundation bolt verification', date: '2026-11-17', timeLabel: 'Yesterday', badge: 'Task', taskId: 'task-1' },
  { id: 'a4', user: 'Mateo Silva', title: 'Scheduled shoji track installation', date: '2026-11-17', timeLabel: 'Yesterday', badge: 'Planned', badgeTone: 'warning', taskId: 'task-3', visitId: 'v2' },
];
