export type MilestoneStatus = 'completed' | 'active' | 'upcoming';
export interface Activity { id: string; milestoneId: string; title: string; date: string; hours: number }
export const milestones: { id: string; title: string; description: string; date?: string; status: MilestoneStatus }[] = [
  { id: 'm1', title: 'Residency Proposal Accepted', description: 'Panel approved the "Contemporary Tea Pavilions" monograph.', date: 'Oct 01, 2026', status: 'completed' },
  { id: 'm2', title: 'Studio Setup & Material Sourcing', description: 'Yoshino cedar lumber and joinery tools arrived.', date: 'Oct 15, 2026', status: 'completed' },
  { id: 'm3', title: 'Full-Scale Model Construction', description: 'Timber framing and interlocking joinery assembly.', status: 'active' },
  { id: 'm4', title: 'Public Exhibition & Tea Ceremony', description: 'Pavilion unveiling and guest masterclass ceremony.', status: 'upcoming' },
];
export const activities: Activity[] = [
  { id: 'act1', milestoneId: 'm1', title: 'Proposal panel review', date: 'Oct 01', hours: 3 },
  { id: 'act2', milestoneId: 'm2', title: 'Cedar delivery inspection', date: 'Oct 14', hours: 4 },
  { id: 'act3', milestoneId: 'm2', title: 'Joinery tool calibration', date: 'Oct 15', hours: 2.5 },
  { id: 'act4', milestoneId: 'm3', title: 'Base frame assembly', date: 'Nov 10', hours: 6 },
  { id: 'act5', milestoneId: 'm3', title: 'Lattice joint cutting', date: 'Nov 14', hours: 5 },
];
/** Studio hours per week, oldest first; the last entry is the current week. */
export const weeklyHours = [12, 18, 14, 22, 28, 24, 30];
export const priorCycleHours = 120.75;
export const scrapRateByWeek = [20, 18, 15, 12, 9, 5.8];
