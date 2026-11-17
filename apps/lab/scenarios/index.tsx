import React from 'react';
import { SettingsScenario } from './SettingsScenario';
import { SearchScenario } from './SearchScenario';
import { FormScenario } from './FormScenario';
import { FocusJourneyScenario } from './FocusJourneyScenario';
import { EventDiscoveryScenario } from './EventDiscoveryScenario';
import { OnboardingCheckoutScenario } from './OnboardingCheckoutScenario';
import { ProgressDashboardScenario } from './ProgressDashboardScenario';
import { MarketplaceCommerceScenario } from './MarketplaceCommerceScenario';
import { ActivityTimelineScenario } from './ActivityTimelineScenario';
import { ThemeStudioScenario } from './ThemeStudioScenario';
import { ZenLockscreenScenario } from './ZenLockscreenScenario';

export const scenarios: Record<string, () => React.JSX.Element> = {
  settings: SettingsScenario,
  search: SearchScenario,
  form: FormScenario,
  focus: FocusJourneyScenario,
  eventDiscovery: EventDiscoveryScenario,
  onboardingCheckout: OnboardingCheckoutScenario,
  progressDashboard: ProgressDashboardScenario,
  marketplaceCommerce: MarketplaceCommerceScenario,
  activityTimeline: ActivityTimelineScenario,
  themeStudio: ThemeStudioScenario,
  zenLockscreen: ZenLockscreenScenario,
};
