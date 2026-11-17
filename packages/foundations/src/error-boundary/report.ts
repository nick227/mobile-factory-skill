// One place to send errors. Default logs in development; set a reporter
// (Sentry, Bugsnag, your API) at startup with setErrorReporter.
export type ErrorReporter = (error: unknown, context?: Record<string, unknown>) => void;
let reporter: ErrorReporter = (error, context) => { if (typeof __DEV__ !== 'undefined' && __DEV__) console.error('[app error]', error, context ?? ''); };
export const setErrorReporter = (next: ErrorReporter) => { reporter = next; };
export const reportError: ErrorReporter = (error, context) => { try { reporter(error, context); } catch { /* never throw from reporting */ } };
