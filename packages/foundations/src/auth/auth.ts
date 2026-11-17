// Authentication contract. The app depends on AuthAdapter, never on a vendor SDK
// directly; implement an adapter per provider (Clerk, Supabase, Firebase, your API).
export interface Session { userId: string; token: string; displayName?: string; expiresAt?: string }

export interface AuthAdapter {
  /** Rehydrate a stored session (e.g. from secure storage); null if none or expired. */
  restore(): Promise<Session | null>;
  /** Exchange credentials for a session. Throw AuthError with a user-safe message on failure. */
  signIn(credentials: Record<string, string>): Promise<Session>;
  signOut(session: Session): Promise<void>;
}

export class AuthError extends Error { constructor(message: string) { super(message); this.name = 'AuthError'; } }

export type AuthState =
  | { status: 'restoring' }
  | { status: 'signed-out'; error?: string; pending?: boolean }
  | { status: 'signed-in'; session: Session };

export type AuthAction =
  | { type: 'restored'; session: Session | null }
  | { type: 'sign-in-start' }
  | { type: 'signed-in'; session: Session }
  | { type: 'sign-in-failed'; error: string }
  | { type: 'signed-out' };

export function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'restored': return action.session ? { status: 'signed-in', session: action.session } : { status: 'signed-out' };
    case 'sign-in-start': return { status: 'signed-out', pending: true };
    case 'signed-in': return { status: 'signed-in', session: action.session };
    case 'sign-in-failed': return { status: 'signed-out', error: action.error };
    case 'signed-out': return { status: 'signed-out' };
  }
}

export const isExpired = (s: Session, now = Date.now()) => Boolean(s.expiresAt && Date.parse(s.expiresAt) <= now);

/** Demo adapter: accepts listed users, persists via the given store. Not for production. */
export function createMockAuthAdapter(opts: { users: Record<string, string>; store: { load(): Promise<Session | null>; save(s: Session | null): Promise<void> }; latencyMs?: number }): AuthAdapter {
  const delay = () => new Promise<void>((r) => setTimeout(r, opts.latencyMs ?? 400));
  return {
    async restore() { const s = await opts.store.load(); return s && !isExpired(s) ? s : null; },
    async signIn({ email = '', password = '' }) {
      await delay();
      if (opts.users[email.trim().toLowerCase()] !== password) throw new AuthError('Email or password is incorrect.');
      const session: Session = { userId: email.trim().toLowerCase(), token: `mock-${Date.now()}`, displayName: email.split('@')[0] };
      await opts.store.save(session);
      return session;
    },
    async signOut() { await opts.store.save(null); },
  };
}
