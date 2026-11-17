// Event binding: runs a page event's actions in order against the presentation store and router.
import type { Action } from './spec';
import type { Store, Rec } from './store';
import { fill } from './template';

export interface ActionDeps {
  store: Store;
  navigate: (pathname: string, params?: Record<string, string>) => void;
  back: () => void;
  notify: (text: string, tone: 'info' | 'success' | 'warning' | 'danger') => void;
  confirm: (c: { title: string; description: string; confirmLabel?: string; destructive?: boolean }, onConfirm: () => void) => void;
  /** Validated, coerced form values; undefined when the form has errors (the chain stops). */
  submitForm?: () => Record<string, unknown> | undefined;
}

export function runActions(actions: Action[], record: Rec | undefined, deps: ActionDeps): void {
  let current = record;
  for (let i = 0; i < actions.length; i++) {
    const a = actions[i];
    const id = (t?: string) => (t ? fill(t, current) : current?.id ?? '');
    if ('confirm' in a) {
      const rest = actions.slice(i + 1);
      deps.confirm({ title: fill(a.confirm.title, current), description: fill(a.confirm.description, current), confirmLabel: a.confirm.confirmLabel, destructive: a.confirm.destructive }, () => runActions([...a.then, ...rest], current, deps));
      return;
    }
    if ('navigate' in a) deps.navigate(a.navigate, a.params ? Object.fromEntries(Object.entries(a.params).map(([k, v]) => [k, fill(v, current)])) : undefined);
    else if ('back' in a) deps.back();
    else if ('create' in a) { const values = deps.submitForm?.(); if (!values) return; current = deps.store.create(a.create, values); }
    else if ('update' in a) {
      let values: Record<string, unknown> = { ...(a.set ?? {}) };
      if (a.from === 'form') { const v = deps.submitForm?.(); if (!v) return; values = { ...v, ...values }; }
      deps.store.update(a.update, id(a.id), values);
      current = deps.store.get(a.update, id(a.id)) ?? current;
    } else if ('remove' in a) deps.store.remove(a.remove, id(a.id));
    else if ('toggle' in a) { const rec = deps.store.get(a.toggle, id(a.id)); if (rec) { deps.store.update(a.toggle, rec.id, { [a.field]: !rec[a.field] }); current = deps.store.get(a.toggle, rec.id); } }
    else if ('notice' in a) deps.notify(fill(a.notice, current), a.tone ?? 'success');
  }
}
