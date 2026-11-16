import React from 'react';
import { SettingsScenario } from './SettingsScenario';
import { SearchScenario } from './SearchScenario';
import { FormScenario } from './FormScenario';
import { FocusJourneyScenario } from './FocusJourneyScenario';
export const scenarios: Record<string, () => React.JSX.Element> = {
 settings: SettingsScenario, search: SearchScenario, form: FormScenario, focus: FocusJourneyScenario,
};
