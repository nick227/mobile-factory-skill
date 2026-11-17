import React from 'react';
import { SettingsScenario } from './SettingsScenario';
import { SearchScenario } from './SearchScenario';
import { FormScenario } from './FormScenario';
import { FocusJourneyScenario } from './FocusJourneyScenario';
import { EventDiscoveryScenario } from './EventDiscoveryScenario';
import { OnboardingCheckoutScenario } from './OnboardingCheckoutScenario';
import { ProgressDashboardScenario } from './ProgressDashboardScenario';

export const scenarios: Record<string, () => React.JSX.Element> = {
  settings: SettingsScenario,
  search: SearchScenario,
  form: FormScenario,
  focus: FocusJourneyScenario,
  eventDiscovery: EventDiscoveryScenario,
  onboardingCheckout: OnboardingCheckoutScenario,
  progressDashboard: ProgressDashboardScenario,
};
