// The Monad page: every page is header → one subject → at most one primary action, with overlays
// and presentation states supplied by the factory. Pages are data (PageSpec); this is the only renderer.
// Visual composition is selected deterministically through factory-owned Monad page archetypes.
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { FlatList, ScrollView, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ActionDock, AlertDialog, Badge, Button, CalmSkeleton, ControlTile, EmptyState,
  GlanceHero, HeroPrompt, ImmersiveHero, ListItem, MediaFrame, NoticeBanner,
  ProgressBar, Row, ScreenHeader, SearchBar, SegmentedControl, SettingsGroup,
  Stack, StepProgress, Surface, Text, TextField, Toggle, useTheme,
  type GlanceStatus,
} from '@/src/ui';
import type {
  AppSpec, PageSpec, ListSubject, DetailSubject, FormSubject, SettingsSubject, MessageSubject, CustomSubject,
  EventRef, PageArchetype,
} from './spec';
import { useStore, type Store, type Rec } from './store';
import { fill, holds } from './template';
import { coerce, initialValues, validate, type FormErrors, type FormValues } from './form';
import { runActions, type ActionDeps } from './actions';
import { MotionViewport } from './MotionViewport';

const GUTTER = 20;
type Fire = (event: EventRef | undefined, record?: Rec) => void;

function Loading({ rows = 4, height = 60 }: { rows?: number; height?: number }) {
  return <View aria-label="Loading" aria-busy style={{ padding: GUTTER, gap: 12 }}>{Array.from({ length: rows }, (_, i) => <CalmSkeleton key={i} height={height} radius={12} />)}</View>;
}
function LoadError({ onRetry }: { onRetry: () => void }) {
  return <EmptyState title="Couldn't load this" description="Check your connection and try again." action={<Button label="Retry" variant="outline" onPress={onRetry} />} />;
}

// ---------------- Standard Default Compositions ----------------

function CollectionList({ subject, page, store, fire }: { subject: ListSubject; page: PageSpec; store: Store; fire: Fire }) {
  const [query, setQuery] = useState('');
  const [segment, setSegment] = useState(0);
  const status = store.status(subject.source);
  const rows = useMemo(() => {
    let list = store.list(subject.source);
    const where = subject.segments?.[segment]?.where;
    if (where) list = list.filter((r) => Object.entries(where).every(([k, v]) => r[k] === v));
    const q = query.trim().toLowerCase();
    if (q && subject.search) list = list.filter((r) => subject.search!.fields.some((f) => String(r[f] ?? '').toLowerCase().includes(q)));
    if (subject.sort) { const { by, dir = 'asc' } = subject.sort; list = [...list].sort((a, b) => (String(a[by] ?? '') < String(b[by] ?? '') ? -1 : String(a[by] ?? '') > String(b[by] ?? '') ? 1 : 0) * (dir === 'asc' ? 1 : -1)); }
    return list;
  }, [store.version(), subject, segment, query]);
  if (status === 'error') return <LoadError onRetry={() => store.retry(subject.source)} />;
  const filtered = Boolean(query.trim()) || Boolean(subject.segments?.[segment]?.where);
  return (
    <View style={{ flex: 1 }}>
      {subject.search || subject.segments ? (
        <View style={{ paddingHorizontal: GUTTER, paddingBottom: 12, gap: 12 }}>
          {subject.search ? <SearchBar value={query} onChangeText={setQuery} onClear={() => setQuery('')} placeholder={subject.search.placeholder ?? 'Search'} label="Search" /> : null}
          {subject.segments ? <SegmentedControl label="Filter" value={String(segment)} options={subject.segments.map((s, i) => ({ label: s.label, value: String(i) }))} onValueChange={(v) => setSegment(Number(v))} /> : null}
        </View>
      ) : null}
      {status !== 'ready' ? <Loading /> : rows.length === 0 ? (
        filtered
          ? <EmptyState title="No matches" description="Try a different search or filter." action={<Button label="Clear" variant="outline" onPress={() => { setQuery(''); setSegment(0); }} />} />
          : <EmptyState title={page.empty?.title ?? 'Nothing here yet'} description={page.empty?.description} action={page.empty?.action ? <Button label={page.empty.action.label} onPress={() => fire(page.empty!.action!.event)} /> : undefined} />
      ) : (
        <FlatList
          data={rows}
          keyExtractor={(r) => r.id}
          contentContainerStyle={{ paddingHorizontal: GUTTER, paddingBottom: 24 }}
          renderItem={({ item }) => (
            <ListItem
              title={fill(subject.title, item)}
              description={subject.description ? fill(subject.description, item) : undefined}
              leading={subject.media ? <View style={{ width: 56 }}><MediaFrame ratio={subject.media.ratio} source={item[subject.media.field] as string} radius={8} /></View> : undefined}
              trailing={subject.badge && holds(subject.badge.when, item) ? <Badge label={fill(subject.badge.label, item)} tone={subject.badge.tone} /> : undefined}
              showChevron={Boolean(subject.onSelect)}
              onPress={subject.onSelect ? () => fire(subject.onSelect, item) : undefined}
            />
          )}
        />
      )}
    </View>
  );
}

function StandardDetail({ subject, record, store, fire }: { subject: DetailSubject; record: Rec | undefined; store: Store; fire: Fire }) {
  const status = store.status(subject.source);
  if (status === 'error') return <LoadError onRetry={() => store.retry(subject.source)} />;
  if (status !== 'ready') return <Loading rows={3} height={48} />;
  if (!record) return <EmptyState title="Not found" description="This item no longer exists." />;
  return (
    <ScrollView contentContainerStyle={{ padding: GUTTER, gap: 16 }}>
      {subject.media ? <MediaFrame ratio={subject.media.ratio} source={record[subject.media.field] as string} /> : null}
      {subject.heading || subject.badge ? (
        <Row gap="sm" align="center">
          {subject.heading ? <View style={{ flex: 1 }}><Text variant="title">{fill(subject.heading, record)}</Text></View> : null}
          {subject.badge && holds(subject.badge.when, record) ? <Badge label={fill(subject.badge.label, record)} tone={subject.badge.tone} /> : null}
        </Row>
      ) : null}
      {subject.facts?.length ? (
        <Stack gap="sm">
          {subject.facts.map((f) => (
            <Row key={f.label} gap="md" align="flex-start">
              <View style={{ width: 120 }}><Text muted>{f.label}</Text></View>
              <View style={{ flex: 1 }}><Text>{fill(f.value, record)}</Text></View>
            </Row>
          ))}
        </Stack>
      ) : null}
      {subject.body ? <Text>{fill(subject.body, record)}</Text> : null}
      {subject.actions?.length ? (
        <Stack gap="sm">
          {subject.actions.map((a) => <Button key={a.label} label={a.label} variant="outline" tone={a.tone ?? 'default'} onPress={() => fire(a.event, record)} />)}
        </Stack>
      ) : null}
    </ScrollView>
  );
}

function StandardForm({ subject, values, errors, onChange }: { subject: FormSubject; values: FormValues; errors: FormErrors; onChange: (k: string, v: string | boolean) => void }) {
  return (
    <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: GUTTER, gap: 16 }}>
      {subject.fields.map((f) => f.type === 'toggle'
        ? <Toggle key={f.key} label={f.label} description={f.hint} value={Boolean(values[f.key])} onValueChange={(v) => onChange(f.key, v)} />
        : <TextField
            key={f.key}
            label={f.required ? f.label : `${f.label} (optional)`}
            hint={f.hint ?? (f.type === 'date' ? 'YYYY-MM-DD' : undefined)}
            placeholder={f.placeholder}
            value={String(values[f.key] ?? '')}
            error={errors[f.key]}
            multiline={f.type === 'multiline'}
            keyboardType={f.type === 'number' ? 'numeric' : f.type === 'email' ? 'email-address' : 'default'}
            autoCapitalize={f.type === 'email' ? 'none' : 'sentences'}
            onChangeText={(v) => onChange(f.key, v)}
          />)}
    </ScrollView>
  );
}

function SettingsView({ subject, store, fire }: { subject: SettingsSubject; store: Store; fire: Fire }) {
  return (
    <ScrollView contentContainerStyle={{ padding: GUTTER, gap: 24 }}>
      {subject.groups.map((g) => (
        <Stack key={g.title} gap="sm">
          {g.links?.length ? <SettingsGroup title={g.title} entries={g.links.map((l) => ({ id: l.title, title: l.title, description: l.description, onPress: () => fire(l.event) }))} /> : <Text variant="heading">{g.title}</Text>}
          {g.toggles?.map((t) => <Toggle key={t.key} label={t.label} description={t.description} value={store.setting(t.key)} onValueChange={(v) => store.setSetting(t.key, v)} />)}
        </Stack>
      ))}
    </ScrollView>
  );
}

function MessageView({ subject, record }: { subject: MessageSubject; record?: Rec }) {
  return <View style={{ flex: 1, justifyContent: 'center', padding: GUTTER, gap: 12 }}><Text variant="title">{fill(subject.heading, record)}</Text>{subject.body ? <Text muted>{fill(subject.body, record)}</Text> : null}</View>;
}

// ---------------- Archetype Compositions ----------------

/** hero-decision: A focused decision with one dominant action, prominent headline and subtitle */
function HeroDecisionComposition({
  page,
  record,
  fire,
  deps,
}: {
  page: PageSpec;
  record?: Rec;
  fire: Fire;
  deps: ActionDeps;
}) {
  const subject = page.subject;
  let title = fill(page.title, record);
  let subtitle = page.subtitle ? fill(page.subtitle, record) : '';
  let badgeText: string | undefined;

  if (subject.kind === 'message') {
    title = fill(subject.heading, record);
    if (subject.body) subtitle = fill(subject.body, record);
  } else if (subject.kind === 'detail') {
    if (subject.heading) title = fill(subject.heading, record);
    if (subject.body) subtitle = fill(subject.body, record);
    if (subject.badge && holds(subject.badge.when, record)) badgeText = fill(subject.badge.label, record);
  }

  const primaryLabel = page.primary?.label ?? 'Confirm';
  const primaryOnPress = () => {
    if (page.primary) fire(page.primary.event, record);
    else deps.back();
  };

  const detailAction = subject.kind === 'detail' && subject.actions ? subject.actions[0] : undefined;
  const secondaryAction = page.headerAction
    ? { label: page.headerAction.label, onPress: () => fire(page.headerAction!.event, record) }
    : detailAction
    ? { label: detailAction.label, onPress: () => fire(detailAction.event, record) }
    : undefined;

  return (
    <View style={{ flex: 1, justifyContent: 'center', padding: GUTTER }}>
      <HeroPrompt
        title={title}
        subtitle={subtitle}
        badge={badgeText}
        illustration={
          subject.kind === 'detail' && subject.media ? (
            <View style={{ width: '100%', maxWidth: 320, alignSelf: 'center', marginBottom: 16 }}>
              <MediaFrame ratio={subject.media.ratio} source={record?.[subject.media.field] as string} radius={16} />
            </View>
          ) : undefined
        }
        primaryAction={{ label: primaryLabel, onPress: primaryOnPress }}
        secondaryAction={secondaryAction}
        docked={false}
        align="center"
      />
    </View>
  );
}

/** glance-dashboard: Metrics, progress and status indicators for high-frequency consumption */
function GlanceDashboardComposition({
  app,
  page,
  record,
  store,
  fire,
}: {
  app: AppSpec;
  page: PageSpec;
  record?: Rec;
  store: Store;
  fire: Fire;
}) {
  const subject = page.subject;
  const { colors, tokens } = useTheme();
  const experience = app.design?.experience;
  const composition = page.composition;
  const variant = composition?.layoutVariant || 'radial-hero';
  const pacing = experience?.pacing || 'relaxed';
  const gutter = pacing === 'compact' ? 14 : pacing === 'monumental' ? 26 : GUTTER;
  const sectionGap = pacing === 'compact' ? 12 : pacing === 'monumental' ? 24 : 16;

  if (subject.kind === 'detail') {
    const status = store.status(subject.source);
    if (status === 'error') return <LoadError onRetry={() => store.retry(subject.source)} />;
    if (status !== 'ready') return <Loading rows={3} height={48} />;
    if (!record) return <EmptyState title="Not found" description="This item no longer exists." />;

    const heroVal = subject.glance ? fill(subject.glance.value, record) : (record.metric as string | number) ?? (record.value as string | number) ?? (subject.facts?.[0] ? fill(subject.facts[0].value, record) : fill(page.title, record));
    const heroLabel = subject.glance?.label ? fill(subject.glance.label, record) : subject.heading ? fill(subject.heading, record) : (subject.facts?.[0] ? subject.facts[0].label : fill(page.title, record));
    const remainingFacts = subject.glance ? subject.facts : subject.facts?.[0] && heroVal === fill(subject.facts[0].value, record) ? subject.facts.slice(1) : subject.facts;

    const ringVal = subject.glance?.progressField ? Number(record[subject.glance.progressField]) : typeof record.progress === 'number' ? record.progress : typeof record.percent === 'number' ? record.percent : undefined;
    const glanceStatus = (record.status as GlanceStatus) || 'calm';

    const renderMedia = (
      subject.media ? (
        <MediaFrame
          ratio={composition?.mediaPlacement === 'masthead' ? 2.2 : subject.media.ratio}
          source={record[subject.media.field] as string}
          radius={tokens.radius.md}
        />
      ) : null
    );

    // VARIANT: metric-split (High-velocity telemetry with dual focal metrics)
    if (variant === 'metric-split') {
      const secondaryFact = remainingFacts?.[0];
      const otherFacts = remainingFacts && remainingFacts.length > 1 ? remainingFacts.slice(1) : [];
      return (
        <ScrollView contentContainerStyle={{ padding: gutter, gap: sectionGap }}>
          {composition?.mediaPlacement === 'masthead' ? renderMedia : null}
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <Surface style={{ flex: 1, padding: 16, borderRadius: tokens.radius.md, gap: 6 }}>
              <Text muted variant="caption">{heroLabel}</Text>
              <Text style={{ fontSize: 28, fontWeight: '800', letterSpacing: -0.5, color: colors.text }}>
                {heroVal}{subject.glance?.unit ? ' ' + fill(subject.glance.unit, record) : ''}
              </Text>
              {subject.body ? <Text muted variant="caption">{fill(subject.body, record)}</Text> : null}
            </Surface>
            <Surface style={{ flex: 1, padding: 16, borderRadius: tokens.radius.md, gap: 6 }}>
              <Text muted variant="caption">{secondaryFact?.label ?? 'Status'}</Text>
              <Text style={{ fontSize: 28, fontWeight: '800', letterSpacing: -0.5, color: colors.primary }}>
                {secondaryFact ? fill(secondaryFact.value, record) : ringVal !== undefined ? `${ringVal}%` : glanceStatus.toUpperCase()}
              </Text>
              <Badge label={glanceStatus.toUpperCase()} tone={glanceStatus === 'calm' ? 'success' : glanceStatus === 'warning' ? 'warning' : 'neutral'} style={{ alignSelf: 'flex-start', marginTop: 4 }} />
            </Surface>
          </View>
          {ringVal !== undefined && Number.isFinite(ringVal) ? (
            <Surface style={{ padding: 14, borderRadius: tokens.radius.md, gap: 8 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text muted variant="caption">Progress</Text>
                <Text variant="caption" style={{ fontWeight: '700' }}>{ringVal}%</Text>
              </View>
              <ProgressBar value={ringVal} max={100} label="Progress" />
            </Surface>
          ) : null}
          {composition?.mediaPlacement !== 'masthead' && composition?.mediaPlacement !== 'hidden' ? renderMedia : null}
          {otherFacts.length > 0 ? (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
              {otherFacts.map((f) => (
                <Surface key={f.label} style={{ flexBasis: '47%', flexGrow: 1, padding: 12, borderRadius: tokens.radius.sm }}>
                  <Text muted variant="caption">{f.label}</Text>
                  <Text variant="heading" style={{ marginTop: 4 }}>{fill(f.value, record)}</Text>
                </Surface>
              ))}
            </View>
          ) : null}
          {subject.actions?.length ? (
            <Stack gap="sm">
              {subject.actions.map((a) => <Button key={a.label} label={a.label} variant="outline" tone={a.tone ?? 'default'} onPress={() => fire(a.event, record)} />)}
            </Stack>
          ) : null}
        </ScrollView>
      );
    }

    // VARIANT: summary-stack (Structured, stacked executive cards)
    if (variant === 'summary-stack') {
      return (
        <ScrollView contentContainerStyle={{ padding: gutter, gap: sectionGap }}>
          {composition?.mediaPlacement === 'masthead' ? renderMedia : null}
          <Surface style={{ padding: 18, borderRadius: tokens.radius.lg, gap: 12 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View style={{ flex: 1 }}>
                <Text muted variant="caption">{heroLabel}</Text>
                <Text style={{ fontSize: 32, fontWeight: '800', letterSpacing: -0.6, color: colors.text }}>
                  {heroVal}{subject.glance?.unit ? ' ' + fill(subject.glance.unit, record) : ''}
                </Text>
              </View>
              <Badge label={glanceStatus.toUpperCase()} tone={glanceStatus === 'calm' ? 'success' : glanceStatus === 'warning' ? 'warning' : 'neutral'} />
            </View>
            {ringVal !== undefined && Number.isFinite(ringVal) ? (
              <ProgressBar value={ringVal} max={100} label="Completion" />
            ) : null}
            {subject.body ? <Text muted>{fill(subject.body, record)}</Text> : null}
          </Surface>
          {composition?.mediaPlacement !== 'masthead' && composition?.mediaPlacement !== 'hidden' ? renderMedia : null}
          {remainingFacts && remainingFacts.length > 0 ? (
            <Surface style={{ borderRadius: tokens.radius.md, overflow: 'hidden' }}>
              {remainingFacts.map((f, i) => (
                <View key={f.label} style={{ padding: 14, borderBottomWidth: i < remainingFacts.length - 1 ? 1 : 0, borderBottomColor: colors.border }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text muted>{f.label}</Text>
                    <Text style={{ fontWeight: '600' }}>{fill(f.value, record)}</Text>
                  </View>
                </View>
              ))}
            </Surface>
          ) : null}
          {subject.actions?.length ? (
            <Stack gap="sm">
              {subject.actions.map((a) => <Button key={a.label} label={a.label} variant="outline" tone={a.tone ?? 'default'} onPress={() => fire(a.event, record)} />)}
            </Stack>
          ) : null}
        </ScrollView>
      );
    }

    // DEFAULT VARIANT: radial-hero (Monumental circular telemetry)
    return (
      <ScrollView contentContainerStyle={{ padding: gutter, gap: sectionGap }}>
        {experience?.hierarchy === 'media-led' || composition?.mediaPlacement === 'masthead' ? renderMedia : null}
        <GlanceHero
          value={heroVal}
          label={heroLabel}
          unit={subject.glance?.unit ? fill(subject.glance.unit, record) : typeof record.unit === 'string' ? record.unit : undefined}
          status={glanceStatus}
          statusText={subject.body ? fill(subject.body, record) : undefined}
          radialRing={ringVal !== undefined && Number.isFinite(ringVal) ? { value: ringVal, max: 100 } : undefined}
        />
        {experience?.hierarchy !== 'media-led' && composition?.mediaPlacement !== 'masthead' && composition?.mediaPlacement !== 'hidden' ? renderMedia : null}
        {remainingFacts && remainingFacts.length > 0 ? (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 4 }}>
            {remainingFacts.map((f) => (
              <Surface key={f.label} style={{ flexBasis: '47%', flexGrow: 1, padding: 12, borderRadius: tokens.radius.md }}>
                <Text muted variant="caption">{f.label}</Text>
                <Text variant="heading" style={{ marginTop: 4 }}>{fill(f.value, record)}</Text>
              </Surface>
            ))}
          </View>
        ) : null}
        {subject.actions?.length ? (
          <Stack gap="sm" style={{ marginTop: 4 }}>
            {subject.actions.map((a) => <Button key={a.label} label={a.label} variant="outline" tone={a.tone ?? 'default'} onPress={() => fire(a.event, record)} />)}
          </Stack>
        ) : null}
      </ScrollView>
    );
  }

  if (subject.kind === 'collection') {
    const status = store.status(subject.source);
    const rows = store.list(subject.source);
    if (status === 'error') return <LoadError onRetry={() => store.retry(subject.source)} />;
    return (
      <View style={{ flex: 1 }}>
        <View style={{ paddingHorizontal: gutter, paddingBottom: 8 }}>
          <GlanceHero
            value={rows.length}
            label={fill(page.title, undefined)}
            statusText={rows.length === 0 ? 'No items active' : `${rows.length} active entries`}
            status="active"
          />
        </View>
        <CollectionList subject={subject} page={page} store={store} fire={fire} />
      </View>
    );
  }

  return null;
}

/** focus-wizard: Step-by-step sequential input for multi-field forms */
function FocusWizardComposition({
  subject,
  values,
  errors,
  onChange,
  onSubmit,
  primaryLabel = 'Submit',
}: {
  subject: FormSubject;
  values: FormValues;
  errors: FormErrors;
  onChange: (k: string, v: string | boolean) => void;
  onSubmit: () => void;
  primaryLabel?: string;
}) {
  const [step, setStep] = useState(0);
  const total = subject.fields.length;
  const current = subject.fields[step];

  if (total <= 1) {
    return <StandardForm subject={subject} values={values} errors={errors} onChange={onChange} />;
  }

  const isLast = step === total - 1;
  const handleNext = () => {
    if (isLast) onSubmit();
    else setStep((s) => Math.min(total - 1, s + 1));
  };

  return (
    <View style={{ flex: 1 }}>
      <View style={{ paddingHorizontal: GUTTER, paddingVertical: 8, gap: 4 }}>
        <StepProgress step={step + 1} total={total} label={`Step ${step + 1} of ${total}`} />
        <Text muted variant="caption">{`Step ${step + 1} of ${total}`}</Text>
      </View>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: GUTTER, gap: 20, flexGrow: 1, justifyContent: 'center' }}>
        <View style={{ gap: 8 }}>
          <Text variant="heading" style={{ fontSize: 24, fontWeight: '700' }}>{current.label}</Text>
          {current.hint ? <Text muted>{current.hint}</Text> : null}
        </View>
        {current.type === 'toggle' ? (
          <Toggle label={current.label} description={current.hint} value={Boolean(values[current.key])} onValueChange={(v) => onChange(current.key, v)} />
        ) : (
          <TextField
            label={current.required ? current.label : `${current.label} (optional)`}
            hint={current.hint ?? (current.type === 'date' ? 'YYYY-MM-DD' : undefined)}
            placeholder={current.placeholder}
            value={String(values[current.key] ?? '')}
            error={errors[current.key]}
            multiline={current.type === 'multiline'}
            keyboardType={current.type === 'number' ? 'numeric' : current.type === 'email' ? 'email-address' : 'default'}
            autoCapitalize={current.type === 'email' ? 'none' : 'sentences'}
            onChangeText={(v) => onChange(current.key, v)}
          />
        )}
      </ScrollView>
      <ActionDock separated>
        <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
          {step > 0 ? (
            <View style={{ flex: 1 }}>
              <Button label="Back" variant="outline" fullWidth onPress={() => setStep((s) => Math.max(0, s - 1))} />
            </View>
          ) : null}
          <View style={{ flex: 2 }}>
            <Button label={isLast ? primaryLabel : 'Continue'} fullWidth onPress={handleNext} />
          </View>
        </View>
      </ActionDock>
    </View>
  );
}

/** bento-overview: Compact overview arranged in squircle bento tiles */
function BentoOverviewComposition({
  app,
  page,
  record,
  store,
  fire,
}: {
  app: AppSpec;
  page: PageSpec;
  record?: Rec;
  store: Store;
  fire: Fire;
}) {
  const subject = page.subject;
  const { colors, tokens } = useTheme();
  const experience = app.design?.experience;
  const composition = page.composition;
  const variant = composition?.layoutVariant || 'asymmetric-hero';
  const pacing = experience?.pacing || 'relaxed';
  const gutter = pacing === 'compact' ? 14 : pacing === 'monumental' ? 26 : GUTTER;

  if (subject.kind === 'collection') {
    const status = store.status(subject.source);
    const rows = store.list(subject.source);
    if (status === 'error') return <LoadError onRetry={() => store.retry(subject.source)} />;
    if (status !== 'ready') return <Loading rows={4} height={88} />;
    if (rows.length === 0) return <EmptyState title={page.empty?.title ?? 'No items'} description={page.empty?.description} />;

    // VARIANT: priority-feed (Featured highlight banner + companion action cards)
    if (variant === 'priority-feed') {
      const heroItem = rows[0];
      const remainingItems = rows.slice(1);
      return (
        <ScrollView contentContainerStyle={{ padding: gutter, gap: 16, paddingBottom: 32 }}>
          {heroItem ? (
            <Surface style={{ borderRadius: tokens.radius.lg, overflow: 'hidden', padding: 18 }}>
              {subject.badge && holds(subject.badge.when, heroItem) ? (
                <Badge label={fill(subject.badge.label, heroItem)} tone={subject.badge.tone} style={{ alignSelf: 'flex-start', marginBottom: 8 }} />
              ) : null}
              <Text variant="title">{fill(subject.title, heroItem)}</Text>
              {subject.description ? <Text muted style={{ marginTop: 4, marginBottom: 12 }}>{fill(subject.description, heroItem)}</Text> : null}
              {subject.onSelect ? <Button label="Open Focus" onPress={() => fire(subject.onSelect, heroItem)} /> : null}
            </Surface>
          ) : null}
          {remainingItems.length > 0 ? (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
              {remainingItems.map((item, idx) => (
                <View key={item.id ?? idx} style={{ width: '48%' }}>
                  <ControlTile
                    label={fill(subject.title, item)}
                    subtitle={subject.description ? fill(subject.description, item) : undefined}
                    badge={subject.badge && holds(subject.badge.when, item) ? fill(subject.badge.label, item) : undefined}
                    active={Boolean(item.active || item.selected || item.inStock)}
                    icon={<View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary }} />}
                    aspect="square"
                    onPress={subject.onSelect ? () => fire(subject.onSelect, item) : () => {}}
                  />
                </View>
              ))}
            </View>
          ) : null}
        </ScrollView>
      );
    }

    // VARIANT: uniform-grid (Classic balanced 2x2 grid)
    if (variant === 'uniform-grid') {
      return (
        <ScrollView contentContainerStyle={{ padding: gutter, paddingBottom: 32 }}>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
            {rows.map((item, idx) => (
              <View key={item.id ?? idx} style={{ width: '48%' }}>
                <ControlTile
                  label={fill(subject.title, item)}
                  subtitle={subject.description ? fill(subject.description, item) : undefined}
                  badge={subject.badge && holds(subject.badge.when, item) ? fill(subject.badge.label, item) : undefined}
                  active={Boolean(item.active || item.selected || item.inStock)}
                  icon={<View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary }} />}
                  aspect="square"
                  onPress={subject.onSelect ? () => fire(subject.onSelect, item) : () => {}}
                />
              </View>
            ))}
          </View>
        </ScrollView>
      );
    }

    // DEFAULT VARIANT: asymmetric-hero (First item is span-2 full width hero, rest are 2-column)
    return (
      <ScrollView contentContainerStyle={{ padding: gutter, paddingBottom: 32 }}>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
          {rows.map((item, idx) => {
            const isHero = idx === 0;
            return (
              <View key={item.id ?? idx} style={{ width: isHero ? '100%' : '48%' }}>
                <ControlTile
                  label={fill(subject.title, item)}
                  subtitle={subject.description ? fill(subject.description, item) : undefined}
                  badge={subject.badge && holds(subject.badge.when, item) ? fill(subject.badge.label, item) : undefined}
                  active={Boolean(item.active || item.selected || item.inStock)}
                  icon={<View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary }} />}
                  aspect={isHero ? 'wide' : 'square'}
                  onPress={subject.onSelect ? () => fire(subject.onSelect, item) : () => {}}
                />
              </View>
            );
          })}
        </View>
      </ScrollView>
    );
  }

  if (subject.kind === 'detail') {
    const status = store.status(subject.source);
    if (status === 'error') return <LoadError onRetry={() => store.retry(subject.source)} />;
    if (status !== 'ready') return <Loading rows={3} height={48} />;
    if (!record) return <EmptyState title="Not found" description="This item no longer exists." />;

    return (
      <ScrollView contentContainerStyle={{ padding: gutter, gap: 16 }}>
        {subject.media ? <MediaFrame ratio={subject.media.ratio} source={record[subject.media.field] as string} radius={tokens.radius.md} /> : null}
        {subject.heading ? <Text variant="title">{fill(subject.heading, record)}</Text> : null}
        {subject.body ? <Text muted>{fill(subject.body, record)}</Text> : null}
        {subject.facts?.length ? (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 8 }}>
            {subject.facts.map((f, idx) => {
              const isSpanHero = variant === 'asymmetric-hero' && idx === 0;
              return (
                <View key={f.label} style={{ width: isSpanHero ? '100%' : '48%' }}>
                  <ControlTile
                    label={f.label}
                    subtitle={fill(f.value, record)}
                    icon={<View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary }} />}
                    aspect={isSpanHero ? 'wide' : 'square'}
                    onPress={() => {}}
                  />
                </View>
              );
            })}
          </View>
        ) : null}
      </ScrollView>
    );
  }

  return null;
}

/** content-canvas: Media-led content presentation with high-ratio frames and editorial typography */
function ContentCanvasComposition({
  app,
  page,
  record,
  store,
  fire,
}: {
  app: AppSpec;
  page: PageSpec;
  record?: Rec;
  store: Store;
  fire: Fire;
}) {
  const subject = page.subject;
  const { colors, tokens } = useTheme();
  const experience = app.design?.experience;
  const composition = page.composition;
  const variant = composition?.layoutVariant || 'editorial-feature';
  const pacing = experience?.pacing || 'relaxed';
  const gutter = pacing === 'compact' ? 14 : pacing === 'monumental' ? 28 : GUTTER;
  const sectionGap = pacing === 'compact' ? 14 : pacing === 'monumental' ? 28 : 20;

  if (subject.kind === 'detail') {
    const status = store.status(subject.source);
    if (status === 'error') return <LoadError onRetry={() => store.retry(subject.source)} />;
    if (status !== 'ready') return <Loading rows={3} height={48} />;
    if (!record) return <EmptyState title="Not found" description="This item no longer exists." />;

    const titleText = fill(subject.heading ?? page.title, record);
    const subtitleText = page.subtitle ? fill(page.subtitle, record) : undefined;
    const bodyText = subject.body ? fill(subject.body, record) : undefined;
    const mediaSource = subject.media ? (record[subject.media.field] as string) : undefined;

    // VARIANT: immersive-bleed (Cinematic edge-to-edge media with overlay typography)
    if (variant === 'immersive-bleed') {
      return (
        <ScrollView contentContainerStyle={{ paddingBottom: 36 }}>
          {mediaSource ? (
            <ImmersiveHero
              title={titleText}
              subtitle={subtitleText}
              tag={subject.badge && holds(subject.badge.when, record) ? fill(subject.badge.label, record) : undefined}
              image={mediaSource}
              aspectRatio={16 / 10}
              overlayOpacity={0.5}
            />
          ) : (
            <View style={{ padding: gutter, paddingTop: 16 }}>
              <Text style={{ fontSize: tokens.typography.display, fontWeight: '800', letterSpacing: -0.8, color: colors.text }}>
                {titleText}
              </Text>
              {subtitleText ? <Text muted style={{ fontSize: 16, marginTop: 4 }}>{subtitleText}</Text> : null}
            </View>
          )}
          <View style={{ padding: gutter, gap: sectionGap }}>
            {bodyText ? (
              <Text style={{ fontSize: 17, lineHeight: 28, color: colors.text }}>{bodyText}</Text>
            ) : null}
            {subject.facts?.length ? (
              <Surface style={{ padding: 16, borderRadius: tokens.radius.md, gap: 12 }}>
                {subject.facts.map((f) => (
                  <Row key={f.label} gap="md" align="flex-start">
                    <View style={{ width: 120 }}><Text muted>{f.label}</Text></View>
                    <View style={{ flex: 1 }}><Text style={{ fontWeight: '600' }}>{fill(f.value, record)}</Text></View>
                  </Row>
                ))}
              </Surface>
            ) : null}
            {subject.actions?.length ? (
              <Stack gap="sm">
                {subject.actions.map((a) => <Button key={a.label} label={a.label} variant="outline" tone={a.tone ?? 'default'} onPress={() => fire(a.event, record)} />)}
              </Stack>
            ) : null}
          </View>
        </ScrollView>
      );
    }

    // VARIANT: card-canvas (Tactile contained showcase card + structured metadata)
    if (variant === 'card-canvas') {
      return (
        <ScrollView contentContainerStyle={{ padding: gutter, gap: sectionGap }}>
          <Surface style={{ borderRadius: tokens.radius.lg, overflow: 'hidden' }}>
            {mediaSource ? (
              <MediaFrame ratio={subject.media?.ratio || 16 / 10} source={mediaSource} />
            ) : null}
            <View style={{ padding: 18, gap: 8 }}>
              {subject.badge && holds(subject.badge.when, record) ? (
                <Badge label={fill(subject.badge.label, record)} tone={subject.badge.tone} style={{ alignSelf: 'flex-start' }} />
              ) : null}
              <Text variant="title">{titleText}</Text>
              {subtitleText ? <Text muted>{subtitleText}</Text> : null}
            </View>
          </Surface>
          {bodyText ? (
            <Text style={{ fontSize: 16, lineHeight: 26, color: colors.text }}>{bodyText}</Text>
          ) : null}
          {subject.facts?.length ? (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
              {subject.facts.map((f) => (
                <Surface key={f.label} style={{ flexBasis: '47%', flexGrow: 1, padding: 14, borderRadius: tokens.radius.sm }}>
                  <Text muted variant="caption">{f.label}</Text>
                  <Text style={{ fontWeight: '600', marginTop: 4 }}>{fill(f.value, record)}</Text>
                </Surface>
              ))}
            </View>
          ) : null}
          {subject.actions?.length ? (
            <Stack gap="sm">
              {subject.actions.map((a) => <Button key={a.label} label={a.label} variant="outline" tone={a.tone ?? 'default'} onPress={() => fire(a.event, record)} />)}
            </Stack>
          ) : null}
        </ScrollView>
      );
    }

    // DEFAULT VARIANT: editorial-feature (High-contrast typography + framed media)
    const isTypographyLed = experience?.hierarchy === 'typography-led';
    const headerBlock = (
      <View style={{ gap: 8 }}>
        {subject.badge && holds(subject.badge.when, record) ? (
          <Badge label={fill(subject.badge.label, record)} tone={subject.badge.tone} style={{ alignSelf: 'flex-start' }} />
        ) : null}
        <Text style={{ fontSize: tokens.typography.display * 0.9, fontWeight: '800', letterSpacing: -0.8, color: colors.text }}>
          {titleText}
        </Text>
        {subtitleText ? <Text muted style={{ fontSize: 16 }}>{subtitleText}</Text> : null}
      </View>
    );

    return (
      <ScrollView contentContainerStyle={{ padding: gutter, gap: sectionGap }}>
        {isTypographyLed ? headerBlock : null}
        {mediaSource ? (
          <MediaFrame ratio={subject.media?.ratio || 16 / 9} source={mediaSource} radius={tokens.radius.lg} />
        ) : null}
        {!isTypographyLed ? headerBlock : null}
        {bodyText ? (
          <Text style={{ fontSize: 16, lineHeight: 26, color: colors.text }}>{bodyText}</Text>
        ) : null}
        {subject.facts?.length ? (
          <Surface style={{ padding: 16, borderRadius: tokens.radius.md, gap: 12 }}>
            {subject.facts.map((f) => (
              <Row key={f.label} gap="md" align="flex-start">
                <View style={{ width: 120 }}><Text muted>{f.label}</Text></View>
                <View style={{ flex: 1 }}><Text style={{ fontWeight: '600' }}>{fill(f.value, record)}</Text></View>
              </Row>
            ))}
          </Surface>
        ) : null}
        {subject.actions?.length ? (
          <Stack gap="sm">
            {subject.actions.map((a) => <Button key={a.label} label={a.label} variant="outline" tone={a.tone ?? 'default'} onPress={() => fire(a.event, record)} />)}
          </Stack>
        ) : null}
      </ScrollView>
    );
  }

  if (subject.kind === 'collection') {
    const status = store.status(subject.source);
    const rows = store.list(subject.source);
    if (status === 'error') return <LoadError onRetry={() => store.retry(subject.source)} />;
    if (status !== 'ready') return <Loading />;
    if (rows.length === 0) return <EmptyState title={page.empty?.title ?? 'No stories'} description={page.empty?.description} />;

    return (
      <FlatList
        data={rows}
        keyExtractor={(r) => r.id}
        contentContainerStyle={{ padding: gutter, gap: 16 }}
        renderItem={({ item }) => (
          <Surface style={{ borderRadius: tokens.radius.lg, overflow: 'hidden', paddingBottom: 16 }}>
            {subject.media ? <MediaFrame ratio={subject.media.ratio || 16 / 9} source={item[subject.media.field] as string} /> : null}
            <View style={{ paddingHorizontal: 16, paddingTop: 12, gap: 6 }}>
              {subject.badge && holds(subject.badge.when, item) ? (
                <Badge label={fill(subject.badge.label, item)} tone={subject.badge.tone} style={{ alignSelf: 'flex-start' }} />
              ) : null}
              <Text variant="heading">{fill(subject.title, item)}</Text>
              {subject.description ? <Text muted>{fill(subject.description, item)}</Text> : null}
              {subject.onSelect ? <Button size="sm" variant="ghost" label="Open" onPress={() => fire(subject.onSelect, item)} /> : null}
            </View>
          </Surface>
        )}
      />
    );
  }

  return null;
}

// ---------------- Monad Page Shell & Custom Registry ----------------

const customRegistry: Record<string, React.ComponentType<any>> = {};

export function registerCustomComponent(name: string, component: React.ComponentType<any>) {
  customRegistry[name] = component;
}

export function getCustomComponent(name: string): React.ComponentType<any> | undefined {
  return customRegistry[name];
}

export interface MonadPageProps {
  app: AppSpec;
  page: string;
  store: Store;
  customComponents?: Record<string, React.ComponentType<any>>;
}

export function MonadPage({ app, page: pageId, store: rawStore, customComponents }: MonadPageProps) {
  const page = app.pages[pageId];
  const store = useStore(rawStore);
  const router = useRouter();
  const params = useLocalSearchParams<Record<string, string>>();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const subject = page.subject;
  const source = 'source' in subject ? subject.source : undefined;
  const paramName = 'param' in subject ? subject.param ?? 'id' : 'id';
  const hasRouteParam = (page.route ?? '').includes(`[${paramName}]`);
  const record = source && (subject.kind === 'detail' || (subject.kind === 'form' && subject.mode === 'edit'))
    ? (hasRouteParam && params[paramName] ? store.get(source, String(params[paramName])) : store.list(source)[0])
    : undefined;
  useEffect(() => { if (source) store.load(source); }, [source]);

  const isForm = subject.kind === 'form';
  const [values, setValues] = useState<FormValues>(() => (isForm ? initialValues((subject as FormSubject).fields, record) : {}));
  const [attempted, setAttempted] = useState(false);
  const touched = useRef(false);
  // Edit forms open before the mock record finishes loading: prefill once it arrives, unless the user typed.
  useEffect(() => { if (isForm && record && !touched.current) setValues(initialValues((subject as FormSubject).fields, record)); }, [record?.id]);
  const [notice, setNotice] = useState<{ text: string; tone: 'info' | 'success' | 'warning' | 'danger' } | null>(null);
  const [pending, setPending] = useState<{ title: string; description: string; confirmLabel?: string; destructive?: boolean; run: () => void } | null>(null);
  const errors: FormErrors = isForm && attempted ? validate((subject as FormSubject).fields, values) : {};

  const deps: ActionDeps = {
    store,
    navigate: (pathname, p) => router.push(p ? { pathname, params: p } as never : pathname as never),
    back: () => (router.canGoBack() ? router.back() : router.replace('/' as never)),
    notify: (text, tone) => setNotice({ text, tone }),
    confirm: (c, run) => setPending({ ...c, run }),
    submitForm: isForm ? () => {
      setAttempted(true);
      const fields = (subject as FormSubject).fields;
      const errs = validate(fields, values);
      return Object.values(errs).some(Boolean) ? undefined : coerce(fields, values);
    } : undefined,
  };
  const fire: Fire = (event, rec) => { if (event && page.events?.[event]) runActions(page.events[event], rec ?? record, deps); };
  const showBack = page.back ?? page.route !== '/';

  // Resolve archetype
  const archetype: PageArchetype | undefined = page.archetype;

  let body: React.ReactNode;
  let hasHandledPrimary = false;

  if (archetype === 'hero-decision') {
    body = <HeroDecisionComposition page={page} record={record} fire={fire} deps={deps} />;
    hasHandledPrimary = true;
  } else if (archetype === 'glance-dashboard') {
    body = <GlanceDashboardComposition app={app} page={page} record={record} store={store} fire={fire} />;
  } else if (archetype === 'focus-wizard' && isForm) {
    body = (
      <FocusWizardComposition
        subject={subject as FormSubject}
        values={values}
        errors={errors}
        onChange={(k, v) => { touched.current = true; setValues((s) => ({ ...s, [k]: v })); }}
        onSubmit={() => { if (page.primary) fire(page.primary.event); }}
        primaryLabel={page.primary?.label}
      />
    );
    hasHandledPrimary = true;
  } else if (archetype === 'bento-overview') {
    body = <BentoOverviewComposition app={app} page={page} record={record} store={store} fire={fire} />;
  } else if (archetype === 'content-canvas') {
    body = <ContentCanvasComposition app={app} page={page} record={record} store={store} fire={fire} />;
  } else if (archetype === 'system-settings' || subject.kind === 'settings') {
    body = <SettingsView subject={subject as SettingsSubject} store={store} fire={fire} />;
  } else if (subject.kind === 'custom') {
    const customSubject = subject as CustomSubject;
    const Component = customComponents?.[customSubject.component] || getCustomComponent(customSubject.component);
    if (Component) {
      body = <Component page={page} record={record} store={store} fire={fire} deps={deps} insets={insets} {...(customSubject.props ?? {})} />;
    } else {
      body = (
        <EmptyState
          title={`Custom: ${customSubject.component}`}
          description="Component is not registered. Pass customComponents or register it via registerCustomComponent."
        />
      );
    }
  } else if (subject.kind === 'collection') {
    body = <CollectionList subject={subject} page={page} store={store} fire={fire} />;
  } else if (subject.kind === 'detail') {
    body = <StandardDetail subject={subject} record={record} store={store} fire={fire} />;
  } else if (subject.kind === 'form') {
    body = subject.mode === 'edit' && store.status(subject.source) !== 'ready'
      ? <Loading rows={3} height={52} />
      : <StandardForm subject={subject} values={values} errors={errors} onChange={(k, v) => { touched.current = true; setValues((s) => ({ ...s, [k]: v })); }} />;
  } else {
    body = <MessageView subject={subject as MessageSubject} record={record} />;
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background, paddingTop: insets.top }}>
      <ScreenHeader
        title={fill(page.title, record)}
        subtitle={page.subtitle ? fill(page.subtitle, record) : undefined}
        onBack={showBack ? deps.back : undefined}
        trailing={page.headerAction ? <Button size="sm" variant="ghost" label={page.headerAction.label} onPress={() => fire(page.headerAction!.event)} /> : undefined}
      />
      {notice ? <View style={{ paddingHorizontal: GUTTER, paddingBottom: 8 }}><NoticeBanner title={notice.text} tone={notice.tone} onDismiss={() => setNotice(null)} /></View> : null}
      <MotionViewport motion={app.design?.experience?.motion}>{body}</MotionViewport>
      {page.primary && !hasHandledPrimary ? (
        <ActionDock><Button label={page.primary.label} tone={page.primary.tone ?? 'default'} fullWidth onPress={() => fire(page.primary!.event)} /></ActionDock>
      ) : null}
      <AlertDialog
        open={Boolean(pending)}
        onOpenChange={(open) => { if (!open) setPending(null); }}
        title={pending?.title ?? ''}
        description={pending?.description ?? ''}
        confirmLabel={pending?.confirmLabel}
        destructive={pending?.destructive}
        onConfirm={() => { const p = pending; setPending(null); p?.run(); }}
        onCancel={() => setPending(null)}
      />
    </View>
  );
}
