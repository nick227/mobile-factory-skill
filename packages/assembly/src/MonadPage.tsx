// The Monad page: every page is header → one subject → at most one primary action, with overlays
// and presentation states supplied by the factory. Pages are data (PageSpec); this is the only renderer.
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { FlatList, ScrollView, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ActionDock, AlertDialog, Badge, Button, CalmSkeleton, EmptyState, ListItem, MediaFrame, NoticeBanner,
  Row, ScreenHeader, SearchBar, SegmentedControl, SettingsGroup, Stack, Text, TextField, Toggle, useTheme,
} from '@/src/ui';
import type { AppSpec, PageSpec, ListSubject, DetailSubject, FormSubject, SettingsSubject, MessageSubject, EventRef } from './spec';
import { useStore, type Store, type Rec } from './store';
import { fill, holds } from './template';
import { coerce, initialValues, validate, type FormErrors, type FormValues } from './form';
import { runActions, type ActionDeps } from './actions';

const GUTTER = 20;
type Fire = (event: EventRef | undefined, record?: Rec) => void;

function Loading({ rows = 4, height = 60 }: { rows?: number; height?: number }) {
  return <View aria-label="Loading" aria-busy style={{ padding: GUTTER, gap: 12 }}>{Array.from({ length: rows }, (_, i) => <CalmSkeleton key={i} height={height} radius={12} />)}</View>;
}
function LoadError({ onRetry }: { onRetry: () => void }) {
  return <EmptyState title="Couldn't load this" description="Check your connection and try again." action={<Button label="Retry" variant="outline" onPress={onRetry} />} />;
}

function Collection({ subject, page, store, fire }: { subject: ListSubject; page: PageSpec; store: Store; fire: Fire }) {
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

function Detail({ subject, record, store, fire }: { subject: DetailSubject; record: Rec | undefined; store: Store; fire: Fire }) {
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

function Form({ subject, values, errors, onChange }: { subject: FormSubject; values: FormValues; errors: FormErrors; onChange: (k: string, v: string | boolean) => void }) {
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

function Settings({ subject, store, fire }: { subject: SettingsSubject; store: Store; fire: Fire }) {
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

function Message({ subject, record }: { subject: MessageSubject; record?: Rec }) {
  return <View style={{ flex: 1, justifyContent: 'center', padding: GUTTER, gap: 12 }}><Text variant="title">{fill(subject.heading, record)}</Text>{subject.body ? <Text muted>{fill(subject.body, record)}</Text> : null}</View>;
}

export function MonadPage({ app, page: pageId, store: rawStore }: { app: AppSpec; page: string; store: Store }) {
  const page = app.pages[pageId];
  const store = useStore(rawStore);
  const router = useRouter();
  const params = useLocalSearchParams<Record<string, string>>();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const subject = page.subject;
  const source = 'source' in subject ? subject.source : undefined;
  const paramName = 'param' in subject ? subject.param ?? 'id' : 'id';
  const record = source && (subject.kind === 'detail' || (subject.kind === 'form' && subject.mode === 'edit')) ? store.get(source, String(params[paramName] ?? '')) : undefined;
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

  let body: React.ReactNode;
  if (subject.kind === 'collection') body = <Collection subject={subject} page={page} store={store} fire={fire} />;
  else if (subject.kind === 'detail') body = <Detail subject={subject} record={record} store={store} fire={fire} />;
  else if (subject.kind === 'form') body = subject.mode === 'edit' && store.status(subject.source) !== 'ready' ? <Loading rows={3} height={52} /> : <Form subject={subject} values={values} errors={errors} onChange={(k, v) => { touched.current = true; setValues((s) => ({ ...s, [k]: v })); }} />;
  else if (subject.kind === 'settings') body = <Settings subject={subject} store={store} fire={fire} />;
  else body = <Message subject={subject} record={record} />;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background, paddingTop: insets.top }}>
      <ScreenHeader
        title={fill(page.title, record)}
        subtitle={page.subtitle ? fill(page.subtitle, record) : undefined}
        onBack={showBack ? deps.back : undefined}
        trailing={page.headerAction ? <Button size="sm" variant="ghost" label={page.headerAction.label} onPress={() => fire(page.headerAction!.event)} /> : undefined}
      />
      {notice ? <View style={{ paddingHorizontal: GUTTER, paddingBottom: 8 }}><NoticeBanner title={notice.text} tone={notice.tone} onDismiss={() => setNotice(null)} /></View> : null}
      <View style={{ flex: 1 }}>{body}</View>
      {page.primary ? <ActionDock><Button label={page.primary.label} tone={page.primary.tone ?? 'default'} fullWidth onPress={() => fire(page.primary!.event)} /></ActionDock> : null}
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
