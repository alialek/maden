'use client';

import * as React from 'react';

type ErrorBoundaryProps = {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  label?: string;
};

type ErrorBoundaryState = {
  hasError: boolean;
};

export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    console.error('ErrorBoundary caught component error:', error);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-destructive text-sm">
          {this.props.label ? `${this.props.label}: ` : ''}
          There is an error.
        </div>
      );
    }

    return this.props.children;
  }
}

