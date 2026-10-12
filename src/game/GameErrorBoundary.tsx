
import {
  Component,
  type ErrorInfo,
  type ReactNode,
} from 'react';

type Props = {
  children: ReactNode;
};

type State = {
  failed: boolean;
};

export class GameErrorBoundary extends Component<
  Props,
  State
> {
  state: State = {
    failed: false,
  };

  static getDerivedStateFromError(): State {
    return {
      failed: true,
    };
  }

  componentDidCatch(
    error: Error,
    info: ErrorInfo
  ): void {
    console.error(
      'NPC LIFE encountered an error:',
      error,
      info.componentStack
    );
  }

  render() {
    if (this.state.failed) {
      return (
        <main
          style={{
            minHeight: '100dvh',
            background: '#17253a',
            color: 'white',
            padding: '10vh 20px',
            textAlign: 'center',
          }}
        >
          <h1>
            NPC LIFE had a very NPC moment.
          </h1>

          <p>
            The game could not load.
            Your local save should still
            be in this browser.
          </p>

          <button
            onClick={() =>
              window.location.reload()
            }
            style={{
              padding: '13px 22px',
              background: '#ffe292',
              borderRadius: 10,
              border: 0,
              fontWeight: 900,
            }}
          >
            Reload game
          </button>

          <p
            style={{
              marginTop: 24,
              color: '#b5c8d9',
              fontSize: 12,
            }}
          >
            If it keeps failing, check the
            browser console or report the issue
            on GitHub.
          </p>
        </main>
      );
    }

    return this.props.children;
  }
}
