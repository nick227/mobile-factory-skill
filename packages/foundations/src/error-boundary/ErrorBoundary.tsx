// Boundary for non-route subtrees (e.g. a widget that may fail on bad data).
import React from 'react';
import { EmptyState, Button } from '@/src/ui';
import { reportError } from './report';

interface Props { children: React.ReactNode; fallback?: (reset: () => void, error: Error) => React.ReactNode; name?: string }
interface State { error: Error | null }

export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null };
  static getDerivedStateFromError(error: Error): State { return { error }; }
  componentDidCatch(error: Error, info: React.ErrorInfo) { reportError(error, { boundary: this.props.name ?? 'component', componentStack: info.componentStack }); }
  reset = () => this.setState({ error: null });
  render() {
    if (!this.state.error) return this.props.children;
    return this.props.fallback?.(this.reset, this.state.error) ?? <EmptyState title="Couldn't show this section" action={<Button label="Try again" variant="secondary" onPress={this.reset} />} />;
  }
}
