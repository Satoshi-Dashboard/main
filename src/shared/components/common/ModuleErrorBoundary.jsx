/**
 * ModuleErrorBoundary — catches render/lazy-chunk errors from a module subtree
 * so a single failing module (or a stale chunk 404 after a deploy) doesn't
 * blank out the whole app.
 *
 * Usage:
 *   <ModuleErrorBoundary key={module.slug}>
 *     <Suspense fallback={...}><Component /></Suspense>
 *   </ModuleErrorBoundary>
 *
 * Keying by slug resets the boundary when the user navigates to another module.
 */

import { Component } from 'react';

export default class ModuleErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error) {
    // Surface in console for debugging; no telemetry by design.
    console.error('[ModuleErrorBoundary]', error);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex h-full w-full items-center justify-center bg-[#111111] p-6">
          <div className="max-w-[420px] rounded border border-white/10 bg-[#0d0d0d]/85 px-5 py-4 text-center font-mono text-[12px] text-white/70">
            <div className="text-white/85">This module failed to load.</div>
            <div className="mt-1 text-white/45">A new version may have been deployed, or the module hit an unexpected error.</div>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-3 rounded border border-white/15 bg-white/[0.03] px-3 py-1.5 text-white/80 transition hover:border-white/30 hover:bg-white/[0.06]"
            >
              Reload
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
