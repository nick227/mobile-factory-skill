import React, { useState } from 'react';
import { Switch, View } from 'react-native';
import { Text, Stack, Row, Surface, Divider, Screen, Button, TextField, Badge, ListItem, SettingsGroup, useTheme, Spacer, IconButton, Toggle, Checkbox, RadioGroup, SegmentedControl, ProgressBar, Spinner, Avatar, SectionHeader, EmptyState, FormField, ActionFooter, ScreenHeader, FocusScreen, StepProgress, InputStage, ActionDock, CalmSkeleton, MediaFrame, SwipePager, EditorialMosaic, ImmersiveHero, ChoiceGallery, FocusWizard, Portal, PortalHost, PortalProvider, Select, Tabs, Dialog, AlertDialog, Accordion, SchedulePicker, MetricSpotlight, PeopleStack, StoryRail, DiscoveryFilters, IdentityHeader, ProgressJourney, StatusTracker, SelectionDock, SmartChecklist, ActivityCalendar, ProductShowcase, RichActivityTimeline, SearchBar, Stepper, NoticeBanner, BottomSheet, PinInput, RatingBar, SlideToConfirm, RadialProgress, GlanceHero, ControlTile, LiveActivityCard } from '@factory/ui';
import { RadialProgressShowcase } from './RadialProgress.showcase';
import { GlanceHeroShowcase } from './GlanceHero.showcase';
import { ControlTileShowcase } from './ControlTile.showcase';
import { LiveActivityCardShowcase } from './LiveActivityCard.showcase';
import { HeroPromptShowcase } from './HeroPrompt.showcase';

export const showcases: Record<string, () => React.JSX.Element> = {
  Text: () => <Stack><Text variant="title">Title typography</Text><Text variant="heading">Section heading</Text><Text>Body text supports dynamic type.</Text><Text muted variant="small">Secondary caption</Text></Stack>,
  Stack: () => <Stack gap="xl"><Badge label="First" /><Badge label="Second" /><Badge label="Third" /></Stack>,
  Row: () => <Row gap="lg"><Badge label="Left" /><Badge label="Right" /></Row>,
  Surface: () => <Surface outlined><Text>Surface with semantic background and border.</Text></Surface>,
  Divider: () => <Stack><Text>Above</Text><Divider /><Text>Below</Text></Stack>,
  Screen: () => <Surface outlined><Text>Screen applies background, spacing and scroll options.</Text></Surface>,
  Button: function ButtonDemo() { const [busy, setBusy] = useState(false); return <Stack><Button label="Primary" onPress={() => setBusy(!busy)} /><Button label="Secondary" variant="secondary" /><Button label="Outline" variant="outline" /><Button label="Ghost" variant="ghost" /><Button label="Disabled" disabled /><Button label="Loading" loading={busy} onPress={() => setBusy(false)} /></Stack>; },
  TextField: function TextFieldDemo() { const [value, setValue] = useState(''); return <Stack><TextField label="Display name" value={value} onChangeText={setValue} placeholder="Enter a name" hint="The value updates as you type" /><TextField label="Invalid input" error="Please enter a value" /></Stack>; },
  Badge: () => <Row><Badge label="Neutral" /><Badge label="Accent" tone="accent" /></Row>,
  ListItem: () => <Stack><ListItem title="Preferences" description="Notifications and display" onPress={() => {}} /><ListItem title="Account" description="Profile and security" /></Stack>,
  SettingsGroup: () => <SettingsGroup title="Settings" entries={[{id:'a',title:'Appearance',description:'Theme preferences'},{id:'b',title:'Notifications',description:'Alerts and messages'}]} />,
  Spacer: function SpacerDemo() { const [enabled,setEnabled]=useState(false); const [choice,setChoice]=useState("daily"); return <Row><Badge label="Before"/><Spacer size="xl"/><Badge label="After"/></Row>; },
  IconButton: function IconButtonDemo() { const [enabled,setEnabled]=useState(false); const [choice,setChoice]=useState("daily"); return <IconButton label="Info" icon={<Text variant="heading">i</Text>} onPress={() => {}} variant="surface"/>; },
  Toggle: function ToggleDemo() { const [enabled,setEnabled]=useState(false); const [choice,setChoice]=useState("daily"); return <Toggle label="Notifications" description="Receive activity updates" value={enabled} onValueChange={setEnabled}/>; },
  Checkbox: function CheckboxDemo() { const [enabled,setEnabled]=useState(false); const [choice,setChoice]=useState("daily"); return <Checkbox label="I agree to the terms" value={enabled} onValueChange={setEnabled}/>; },
  RadioGroup: function RadioGroupDemo() { const [enabled,setEnabled]=useState(false); const [choice,setChoice]=useState("daily"); return <RadioGroup label="Frequency" value={choice} onValueChange={setChoice} options={[{label:"Daily",value:"daily"},{label:"Weekly",value:"weekly"}]}/>; },
  SegmentedControl: function SegmentedControlDemo() { const [enabled,setEnabled]=useState(false); const [choice,setChoice]=useState("daily"); return <SegmentedControl label="Filter" value={choice} onValueChange={setChoice} options={[{label:"Daily",value:"daily"},{label:"Weekly",value:"weekly"}]}/>; },
  ProgressBar: function ProgressBarDemo() { const [enabled,setEnabled]=useState(false); const [choice,setChoice]=useState("daily"); return <Stack><Text>72% complete</Text><ProgressBar label="Progress" value={72}/></Stack>; },
  Spinner: function SpinnerDemo() { const [enabled,setEnabled]=useState(false); const [choice,setChoice]=useState("daily"); return <Spinner label="Loading updates"/>; },
  Avatar: function AvatarDemo() { const [enabled,setEnabled]=useState(false); const [choice,setChoice]=useState("daily"); return <Row><Avatar name="Ada Lovelace"/><Avatar name="Grace Hopper" size={56}/></Row>; },
  SectionHeader: function SectionHeaderDemo() { const [enabled,setEnabled]=useState(false); const [choice,setChoice]=useState("daily"); return <SectionHeader title="Recent activity" description="Latest updates" action={<Badge label="New"/>}/>; },
  EmptyState: function EmptyStateDemo() { const [enabled,setEnabled]=useState(false); const [choice,setChoice]=useState("daily"); return <EmptyState title="Nothing here yet" description="New items will appear here." action={<Button label="Add item" onPress={() => {}}/>}/>; },
  FormField: function FormFieldDemo() { const [enabled,setEnabled]=useState(false); const [choice,setChoice]=useState("daily"); return <FormField label="Email" hint="Used for account updates"><TextField label="Email address" placeholder="name@example.com"/></FormField>; },
  ActionFooter: function ActionFooterDemo() { const [enabled,setEnabled]=useState(false); const [choice,setChoice]=useState("daily"); return <ActionFooter primary={{label:"Save",onPress:()=>{}}} secondary={{label:"Cancel",onPress:()=>{}}}/>; },
  ScreenHeader: () => <ScreenHeader title="Collection" subtitle="One subject, clear navigation" backLabel="Back" onBack={()=>{}} />,
  FocusScreen: () => <Surface outlined><InputStage title="One focus" description="Only the current decision is visible."><Button label="Continue" onPress={()=>{}}/></InputStage></Surface>,
  StepProgress: () => <StepProgress step={2} total={4}/>,
  InputStage: () => <InputStage title="What are you creating?" description="Give it a short name."><TextField label="Name" /></InputStage>,
  ActionDock: () => <ActionDock><Button label="Continue" fullWidth onPress={()=>{}}/></ActionDock>,
  CalmSkeleton: () => <Stack><CalmSkeleton height={120}/><CalmSkeleton height={20} width="65%"/></Stack>,
  MediaFrame: () => <MediaFrame ratio={16/9} label="Reserved media frame" />,
  SwipePager: () => <SwipePager items={[{id:'a',content:<Surface><Text variant="heading">Page one</Text></Surface>},{id:'b',content:<Surface><Text variant="heading">Page two</Text></Surface>}]}/>,
  EditorialMosaic: function EditorialMosaicDemo() {
    const [selected, setSelected] = useState<string | null>(null);
    const items = [
      { id: '1', title: 'Fushimi Inari Shrine', subtitle: 'Kyoto, Japan', badge: 'Must See', badgeTone: 'accent' as const, aspectRatio: 3 / 4, metadata: '10,000 torii gates' },
      { id: '2', title: 'Arashiyama Bamboo Grove', subtitle: 'Sagano', aspectRatio: 1, metadata: 'Morning visits recommended' },
      { id: '3', title: 'Kinkaku-ji Golden Pavilion', subtitle: 'Northern Kyoto', badge: 'UNESCO', aspectRatio: 4 / 3, metadata: 'Zen Buddhist temple' },
      { id: '4', title: 'Gion District', subtitle: 'Higashiyama', aspectRatio: 3 / 4, metadata: 'Traditional machiya houses' },
    ];
    return (
      <Stack gap="md">
        {selected ? <Badge label={`Selected: ${selected}`} tone="accent" /> : null}
        <EditorialMosaic
          items={items}
          density="comfortable"
          onItemPress={(item) => setSelected(item.title)}
        />
      </Stack>
    );
  },
  ImmersiveHero: function ImmersiveHeroDemo() {
    const [saved, setSaved] = useState(false);
    return (
      <ImmersiveHero
        title="Kyoto Photography Guide"
        subtitle="Master the hidden alleys, golden hour temples, and ancient bamboo forests."
        tag="Featured Guide"
        tagTone="accent"
        metadata="By Pat Kay • 12 min read"
        aspectRatio={16 / 9}
        onBack={() => {}}
        backLabel="Guides"
        primaryAction={{
          label: saved ? 'Saved in Library' : 'Explore Guide',
          onPress: () => setSaved(!saved),
        }}
        secondaryAction={{
          label: 'Share',
          onPress: () => {},
        }}
      />
    );
  },
  ChoiceGallery: function ChoiceGalleryDemo() {
    const [selected, setSelected] = useState<string>('minimal');
    const options = [
      { id: 'minimal', title: 'Minimalist', description: 'Clean typography, neutral colors', badge: 'Default' },
      { id: 'editorial', title: 'Editorial', description: 'Serif headings, expressive imagery', badge: 'Popular', badgeTone: 'accent' as const },
      { id: 'compact', title: 'Dense Data', description: 'Maximum information density' },
      { id: 'vibrant', title: 'Vibrant Pop', description: 'High-contrast accents and playful shapes' },
    ];
    return (
      <ChoiceGallery
        label="Select UI Theme"
        options={options}
        selected={selected}
        onSelect={(id) => setSelected(id)}
      />
    );
  },
  FocusWizard: function FocusWizardDemo() {
    const [step, setStep] = useState(0);
    const [name, setName] = useState('');
    const [done, setDone] = useState(false);

    if (done) {
      return (
        <Surface outlined>
          <Stack gap="md">
            <Text variant="title">Wizard Completed!</Text>
            <Text>Created app: {name || 'Untitled'}</Text>
            <Button label="Reset" onPress={() => { setStep(0); setName(''); setDone(false); }} />
          </Stack>
        </Surface>
      );
    }

    const steps = [
      {
        id: 'name',
        title: 'Project Name',
        subtitle: 'What should we call your application?',
        isValid: name.trim().length > 0,
        content: (
          <TextField
            label="Application Name"
            value={name}
            onChangeText={setName}
            placeholder="e.g. Kyoto Guides"
          />
        ),
      },
      {
        id: 'confirm',
        title: 'Review Details',
        subtitle: 'Confirm settings before generating project.',
        content: (
          <Stack gap="sm">
            <Text>Name: {name}</Text>
            <Text muted variant="small">Press Complete to initialize the codebase.</Text>
          </Stack>
        ),
      },
    ];

    return (
      <View style={{ minHeight: 360 }}>
        <FocusWizard
          steps={steps}
          activeStepIndex={step}
          onStepChange={(next) => setStep(next)}
          onComplete={() => setDone(true)}
          onCancel={() => { setStep(0); setName(''); }}
        />
      </View>
    );
  },
  Portal: function PortalDemo() {
    const [showOver, setShowOver] = useState(false);
    return (
      <PortalProvider>
        <Stack gap="md">
          <Text>Base screen content</Text>
          <Button
            label={showOver ? 'Hide Overlay' : 'Show Teleported Overlay'}
            onPress={() => setShowOver(!showOver)}
          />
          {showOver ? (
            <Portal>
              <Surface outlined style={{ padding: 16 }}>
                <Text variant="heading">Teleported Portal Node</Text>
                <Text muted variant="small">Rendered into top-level PortalHost.</Text>
              </Surface>
            </Portal>
          ) : null}
          <PortalHost />
        </Stack>
      </PortalProvider>
    );
  },
  Select: function SelectDemo() {
    const [val, setVal] = useState('kyoto');
    const options = [
      { label: 'Kyoto, Japan', value: 'kyoto' },
      { label: 'Tokyo, Japan', value: 'tokyo' },
      { label: 'Osaka, Japan', value: 'osaka' },
      { label: 'Nara, Japan (Sold Out)', value: 'nara', disabled: true },
    ];
    return (
      <Select
        label="Select Expedition Destination"
        value={val}
        onValueChange={setVal}
        options={options}
      />
    );
  },
  Tabs: function TabsDemo() {
    const [tab, setTab] = useState('overview');
    const tabs = [
      { id: 'overview', label: 'Overview' },
      { id: 'schedule', label: 'Schedule', badge: '3' },
      { id: 'attendees', label: 'Attendees' },
    ];
    return (
      <Stack gap="md">
        <Tabs tabs={tabs} value={tab} onValueChange={setTab} />
        <Surface outlined>
          <Text variant="heading">Active view: {tab}</Text>
        </Surface>
      </Stack>
    );
  },
  Dialog: function DialogDemo() {
    const [open, setOpen] = useState(false);
    return (
      <Stack gap="md">
        <Button label="Open Confirmation Dialog" onPress={() => setOpen(true)} />
        <Dialog
          open={open}
          onOpenChange={setOpen}
          title="Reserve Selected Experience"
          description="Your card will only be charged 24 hours before the departure."
          primaryAction={{ label: 'Confirm Booking', onPress: () => setOpen(false) }}
          secondaryAction={{ label: 'Cancel', onPress: () => setOpen(false) }}
        >
          <Text muted variant="small">Included: 4 nights, breakfast, temple access.</Text>
        </Dialog>
      </Stack>
    );
  },
  AlertDialog: function AlertDialogDemo() {
    const [open, setOpen] = useState(false);
    const [deleted, setDeleted] = useState(false);
    return (
      <Stack gap="md">
        <Button
          label={deleted ? 'Project Deleted (Tap to Reset)' : 'Delete Project'}
          variant="outline"
          onPress={() => (deleted ? setDeleted(false) : setOpen(true))}
        />
        <AlertDialog
          open={open}
          onOpenChange={setOpen}
          destructive
          title="Delete Project Permanently?"
          description="This action cannot be undone. All project files, tasks, and history will be erased."
          confirmLabel="Delete Forever"
          cancelLabel="Keep Project"
          onConfirm={() => {
            setDeleted(true);
            setOpen(false);
          }}
        />
      </Stack>
    );
  },
  Accordion: function AccordionDemo() {
    const [expanded, setExpanded] = useState<string[]>(['faq1']);
    const items = [
      {
        id: 'faq1',
        title: 'What equipment is required?',
        subtitle: 'Cameras, lenses, and tripods',
        content: <Text muted variant="small">We recommend bringing a wide-angle 24-70mm lens and a sturdy lightweight travel tripod.</Text>,
      },
      {
        id: 'faq2',
        title: 'Is airport transfer included?',
        content: <Text muted variant="small">Yes, our private shuttle meets all guests at Kansai International (KIX).</Text>,
      },
      {
        id: 'faq3',
        title: 'What is the cancellation policy?',
        content: <Text muted variant="small">Full refund up to 14 days prior to departure date.</Text>,
      },
    ];
    const toggle = (id: string) => {
      setExpanded((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
    };
    return <Accordion items={items} expandedIds={expanded} onToggle={toggle} />;
  },
  SchedulePicker: function SchedulePickerDemo() {
    const [selectedDate, setSelectedDate] = useState('2026-11-18');
    const [selectedSlot, setSelectedSlot] = useState<string | null>('slot-2');

    const days = [
      { date: '2026-11-17', dayName: 'Tue', dayNumber: 17, monthName: 'Nov' },
      { date: '2026-11-18', dayName: 'Wed', dayNumber: 18, monthName: 'Nov' },
      { date: '2026-11-19', dayName: 'Thu', dayNumber: 19, monthName: 'Nov' },
      { date: '2026-11-20', dayName: 'Fri', dayNumber: 20, monthName: 'Nov' },
      { date: '2026-11-21', dayName: 'Sat', dayNumber: 21, monthName: 'Nov', isAvailable: false },
      { date: '2026-11-22', dayName: 'Sun', dayNumber: 22, monthName: 'Nov' },
    ];

    const slots = [
      { id: 'slot-1', time: '09:00 AM', period: 'morning' as const, available: true, price: '$45' },
      { id: 'slot-2', time: '10:30 AM', period: 'morning' as const, available: true, price: '$45' },
      { id: 'slot-3', time: '01:00 PM', period: 'afternoon' as const, available: false, price: '$50' },
      { id: 'slot-4', time: '02:30 PM', period: 'afternoon' as const, available: true, price: '$50' },
      { id: 'slot-5', time: '05:00 PM', period: 'evening' as const, available: true, price: '$60' },
    ];

    return (
      <SchedulePicker
        days={days}
        slots={slots}
        selectedDate={selectedDate}
        onSelectDate={setSelectedDate}
        selectedSlot={selectedSlot}
        onSelectSlot={setSelectedSlot}
        title="Book Studio Session"
        description="Choose a date and an available sound engineer slot."
        timeZone="PT (UTC-8)"
      />
    );
  },
  MetricSpotlight: function MetricSpotlightDemo() {
    const [loading, setLoading] = useState(false);

    return (
      <Stack gap="md">
        <Button
          label={loading ? 'Show Metric' : 'Show Skeleton State'}
          variant="outline"
          onPress={() => setLoading(!loading)}
        />
        <MetricSpotlight
          loading={loading}
          label="Total Revenue"
          value="$128,450"
          unit="USD"
          delta={{ value: '+18.2%', direction: 'up', period: 'vs last quarter', tone: 'positive' }}
          sparklineData={[30, 45, 40, 60, 55, 75, 80, 95]}
          description="Net subscription and direct licensing sales."
          actionLabel="View Report"
        />
        <MetricSpotlight
          label="Churn Rate"
          value="1.8%"
          delta={{ value: '-0.4%', direction: 'down', period: 'vs target 2.5%', tone: 'positive' }}
          sparklineData={[50, 48, 42, 38, 30, 25, 20, 18]}
        />
      </Stack>
    );
  },
  PeopleStack: function PeopleStackDemo() {
    const people = [
      { id: '1', name: 'Elena Rostova' },
      { id: '2', name: 'Kenji Sato' },
      { id: '3', name: 'Amina Diallo' },
      { id: '4', name: 'Mateo Silva' },
      { id: '5', name: 'Chloe Dubois' },
      { id: '6', name: 'Lars Nygård' },
    ];
    return (
      <Stack gap="md">
        <Text variant="heading">Design Team (6 members)</Text>
        <PeopleStack people={people} maxVisible={4} size={40} />
      </Stack>
    );
  },
  StoryRail: function StoryRailDemo() {
    const [lastOpened, setLastOpened] = useState<string | null>(null);
    const stories = [
      { id: 's1', name: 'Kensho', isLive: true },
      { id: 's2', name: 'Maya', hasUnread: true },
      { id: 's3', name: 'Tariq', hasUnread: true },
      { id: 's4', name: 'Sofia', hasUnread: false },
      { id: 's5', name: 'Hiroshi', hasUnread: false },
    ];
    return (
      <Stack gap="sm">
        {lastOpened && <Badge label={`Opened: ${lastOpened}`} tone="accent" />}
        <StoryRail
          stories={stories}
          onPressStory={(id) => setLastOpened(id)}
          onPressAdd={() => setLastOpened('New Story Draft')}
        />
      </Stack>
    );
  },
  DiscoveryFilters: function DiscoveryFiltersDemo() {
    const [selected, setSelected] = useState<string[]>(['kyoto', 'temples']);
    const options = [
      { id: 'kyoto', label: 'Kyoto', count: 42 },
      { id: 'temples', label: 'Temples & Shrines', count: 18 },
      { id: 'gardens', label: 'Zen Gardens', count: 12 },
      { id: 'tea', label: 'Tea Ceremony', count: 7 },
      { id: 'culinary', label: 'Kaiseki Dining', count: 15 },
    ];
    const toggle = (id: string) => {
      setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
    };
    return (
      <DiscoveryFilters
        options={options}
        selectedIds={selected}
        onToggle={toggle}
        onClear={() => setSelected([])}
      />
    );
  },
  IdentityHeader: function IdentityHeaderDemo() {
    const [following, setFollowing] = useState(false);
    return (
      <IdentityHeader
        name="Kenzo Tange Studio"
        handle="@tange_arch"
        verified
        bio="Tokyo-based architectural masterworks, modernist pavilion archives, and tactile urbanism monographs."
        stats={[
          { label: 'Works', value: '48' },
          { label: 'Followers', value: '142K' },
          { label: 'Exhibitions', value: '12' },
        ]}
        primaryAction={{
          label: following ? 'Following' : 'Follow',
          variant: following ? 'outline' : 'primary',
          onPress: () => setFollowing(!following),
        }}
        secondaryAction={{
          label: 'Contact',
          onPress: () => {},
        }}
      />
    );
  },
  ProgressJourney: function ProgressJourneyDemo() {
    const steps = [
      {
        id: '1',
        title: 'Application Submitted',
        description: 'Document package and credentials verified.',
        timestamp: 'Nov 12, 10:15 AM',
        status: 'completed' as const,
      },
      {
        id: '2',
        title: 'Architectural Review',
        description: 'Lead reviewer assigned for zoning analysis.',
        timestamp: 'Nov 14, 2:30 PM',
        status: 'completed' as const,
      },
      {
        id: '3',
        title: 'On-site Inspection',
        description: 'Inspector scheduled for foundation check.',
        timestamp: 'Today, 9:00 AM',
        status: 'active' as const,
      },
      {
        id: '4',
        title: 'Permit Issuance',
        description: 'Digital seal and printable credential export.',
        status: 'upcoming' as const,
      },
    ];
    return <ProgressJourney steps={steps} />;
  },
  StatusTracker: function StatusTrackerDemo() {
    return (
      <StatusTracker
        title="Artisan Ceramic Kiln Batch #4"
        statusLabel="Glazing in Progress"
        tone="info"
        description="Low-fire biscuit firing complete. Celadon glaze application in kiln chamber 2."
        progress={68}
        estimatedTime="Cooling cycle starts in ~3 hours"
        primaryAction={{
          label: 'View Kiln Telemetry',
          onPress: () => {},
        }}
      />
    );
  },
  SelectionDock: function SelectionDockDemo() {
    const [count, setCount] = useState(3);
    return (
      <Stack gap="md" style={{ minHeight: 180 }}>
        <Row gap="sm">
          <Button label="Select +1" size="sm" variant="outline" onPress={() => setCount((c) => c + 1)} />
          <Button label="Clear All" size="sm" variant="ghost" onPress={() => setCount(0)} />
        </Row>
        <SelectionDock
          selectedCount={count}
          primaryAction={{ label: 'Export Selected', onPress: () => setCount(0) }}
          secondaryAction={{ label: 'Delete', tone: 'danger', onPress: () => setCount(0) }}
          onClear={() => setCount(0)}
        />
      </Stack>
    );
  },
  SmartChecklist: function SmartChecklistDemo() {
    const [items, setItems] = useState([
      { id: '1', title: 'Submit architectural drawings', description: 'CAD or Vectorworks exports in PDF format', completed: true, required: true },
      { id: '2', title: 'Zoning & height variance verification', description: 'Ensure compliance with Kyoto historic district bylaws', completed: true, required: true },
      { id: '3', title: 'Acoustic & fire containment certificate', description: 'Signed inspection report from certified engineer', completed: false, required: true, badge: 'In Review', badgeTone: 'warning' as const },
      { id: '4', title: 'Optional night photography permit', description: 'Allows tripod use in Gion preservation alleys', completed: false, badge: 'Optional' },
    ]);
    const toggle = (id: string, completed: boolean) => {
      setItems((prev) => prev.map((item) => (item.id === id ? { ...item, completed } : item)));
    };
    return (
      <SmartChecklist
        title="Residency Readiness Checklist"
        description="Complete all required items before moving into Studio 4."
        items={items}
        onToggle={toggle}
        action={{
          label: 'Finalize Application',
          onPress: () => {},
          disabled: !items.filter((i) => i.required).every((i) => i.completed),
        }}
      />
    );
  },
  ActivityCalendar: function ActivityCalendarDemo() {
    const [selected, setSelected] = useState('2026-11-18');
    const marks = {
      '2026-11-18': { hasEvents: true },
      '2026-11-20': { hasEvents: true },
      '2026-11-25': { hasEvents: true },
    };
    return (
      <ActivityCalendar
        selectedDate={selected}
        onSelectDate={setSelected}
        markedDates={marks}
      />
    );
  },
  ProductShowcase: function ProductShowcaseDemo() {
    return (
      <ProductShowcase
        id="prod-1"
        brand="Kihara Porcelain"
        title="Arita Ware Hand-Glazed Matcha Bowl"
        price="$120.00"
        originalPrice="$145.00"
        rating={4.9}
        reviewCount={64}
        stockStatus="in_stock"
        onAddToCart={() => {}}
      />
    );
  },
  RichActivityTimeline: function RichActivityTimelineDemo() {
    const events = [
      {
        id: 'ev-1',
        user: { name: 'Kenzo Tange' },
        title: 'Uploaded Timber Pavilion Frame CAD Revision 4',
        timestamp: '15m ago',
        badge: 'Blueprint',
        badgeTone: 'accent' as const,
        description: 'Updated interlocking beam mortise and tenon dimensions per workshop feedback.',
        attachment: { title: 'pavilion_frame_v4.dwg', subtitle: '4.2 MB · 3D Model' },
        actions: [{ label: 'Review CAD', onPress: () => {} }],
      },
      {
        id: 'ev-2',
        user: { name: 'Amina Diallo' },
        title: 'Approved Safety Induction for Woodworking Shop',
        timestamp: '2h ago',
        badge: 'Verified',
        badgeTone: 'success' as const,
      },
    ];
    return <RichActivityTimeline events={events} />;
  },
  SearchBar: function SearchBarDemo() {
    const [query, setQuery] = useState('');
    const [loading, setLoading] = useState(false);
    return (
      <Stack gap="md">
        <SearchBar
          value={query}
          onChangeText={setQuery}
          placeholder="Search Kyoto workshops, crafts…"
          loading={loading}
          showCancelButton={query.length > 0}
          onCancel={() => setQuery('')}
        />
        <Row gap="sm">
          <Button
            label={loading ? 'Stop loading' : 'Simulate async fetch'}
            size="sm"
            variant="outline"
            onPress={() => setLoading(!loading)}
          />
        </Row>
        {query ? <Text variant="small" muted>Current search query: "{query}"</Text> : null}
      </Stack>
    );
  },
  Stepper: function StepperDemo() {
    const [guests, setGuests] = useState(2);
    const [tickets, setTickets] = useState(1);
    return (
      <Stack gap="md">
        <Surface outlined>
          <Row style={{ justifyContent: 'space-between', alignItems: 'center' }}>
            <Stack gap="xs">
              <Text style={{ fontWeight: '700' }}>Masterclass Guests</Text>
              <Text variant="small" muted>Max 6 participants per session</Text>
            </Stack>
            <Stepper
              label="Guests"
              value={guests}
              min={1}
              max={6}
              onValueChange={setGuests}
              formatValue={(v) => `${v} people`}
            />
          </Row>
        </Surface>
        <Surface outlined>
          <Row style={{ justifyContent: 'space-between', alignItems: 'center' }}>
            <Stack gap="xs">
              <Text style={{ fontWeight: '700' }}>Tea Ceremony Pass</Text>
              <Text variant="small" muted>$45 each</Text>
            </Stack>
            <Stepper
              label="Tickets"
              value={tickets}
              min={1}
              max={10}
              size="sm"
              onValueChange={setTickets}
            />
          </Row>
        </Surface>
      </Stack>
    );
  },
  NoticeBanner: function NoticeBannerDemo() {
    const [showSuccess, setShowSuccess] = useState(true);
    return (
      <Stack gap="md">
        {showSuccess ? (
          <NoticeBanner
            tone="success"
            title="Order Placed Successfully"
            description="Your handcrafted cedar chawan has been reserved and sent to wrapping."
            onDismiss={() => setShowSuccess(false)}
            action={{ label: 'View Receipt', onPress: () => {} }}
          />
        ) : (
          <Button label="Restore Success Banner" variant="outline" onPress={() => setShowSuccess(true)} />
        )}
        <NoticeBanner
          tone="warning"
          title="Kiln Reservation Limit Approaching"
          description="Gas kiln 2 has only 1 open firing slot left this week."
        />
        <NoticeBanner
          tone="info"
          title="Studio Maintenance Tonight"
          description="Woodworking shop ventilation filters are scheduled for replacement at 9 PM."
        />
      </Stack>
    );
  },
  BottomSheet: function BottomSheetDemo() {
    const [open, setOpen] = useState(false);
    return (
      <Stack gap="md">
        <Button label="Open Filter Sheet" onPress={() => setOpen(true)} />
        <BottomSheet
          open={open}
          onOpenChange={setOpen}
          title="Filter Experiences"
          subtitle="Refine by category, duration, and craft"
          footer={
            <Button
              label="Apply Filters"
              fullWidth
              onPress={() => setOpen(false)}
            />
          }
        >
          <Stack gap="md">
            <Text>Select your preferred experience type and duration.</Text>
            <NoticeBanner
              tone="info"
              title="Tip for Travelers"
              description="Morning sessions offer the best light for photography."
            />
          </Stack>
        </BottomSheet>
      </Stack>
    );
  },
  PinInput: function PinInputDemo() {
    const [code, setCode] = useState('');
    const [completed, setCompleted] = useState<string | null>(null);
    return (
      <Stack gap="md">
        <PinInput
          label="Enter 6-Digit Auth Code"
          value={code}
          onChange={(v) => {
            setCode(v);
            if (v.length < 6) setCompleted(null);
          }}
          onComplete={(c) => setCompleted(c)}
          hint="Check SMS or Authenticator app"
        />
        {completed ? (
          <NoticeBanner
            tone="success"
            title="Code Verified"
            description={`Code ${completed} successfully verified.`}
          />
        ) : null}
      </Stack>
    );
  },
  RatingBar: function RatingBarDemo() {
    const [rating, setRating] = useState(4);
    const [heartRating, setHeartRating] = useState(3);
    return (
      <Stack gap="md">
        <Surface outlined>
          <Stack gap="sm">
            <Text style={{ fontWeight: '700' }}>Masterclass Experience</Text>
            <RatingBar
              label="Experience rating"
              value={rating}
              onValueChange={setRating}
              showValue
            />
          </Stack>
        </Surface>
        <Surface outlined>
          <Stack gap="sm">
            <Text style={{ fontWeight: '700' }}>Add to Favorites</Text>
            <RatingBar
              label="Favorite score"
              symbol="heart"
              value={heartRating}
              onValueChange={setHeartRating}
              showValue
            />
          </Stack>
        </Surface>
      </Stack>
    );
  },
  SlideToConfirm: function SlideToConfirmDemo() {
    const [confirmed, setConfirmed] = useState(false);
    return (
      <Stack gap="md">
        <SlideToConfirm
          label="Slide to Authorize Payment"
          completedLabel="Payment Authorized"
          confirmed={confirmed}
          onConfirm={() => setConfirmed(true)}
          onReset={() => setConfirmed(false)}
        />
        {confirmed ? (
          <Button
            label="Reset Slide Demo"
            variant="outline"
            onPress={() => setConfirmed(false)}
          />
        ) : null}
      </Stack>
    );
  },
  RadialProgress: RadialProgressShowcase,
  GlanceHero: GlanceHeroShowcase,
  ControlTile: ControlTileShowcase,
  LiveActivityCard: LiveActivityCardShowcase,
  HeroPrompt: HeroPromptShowcase,
};
