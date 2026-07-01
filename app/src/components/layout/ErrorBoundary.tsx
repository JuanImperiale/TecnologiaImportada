import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Button } from '@/components/ui/Button';

interface Props {
  children: ReactNode;
}
interface State {
  hasError: boolean;
}

/** Captura errores de render para que la app no quede en pantalla blanca. */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary]', error, info);
  }

  handleReload = () => window.location.reload();

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
          <h1 className="text-xl font-bold">Algo salió mal</h1>
          <p className="max-w-md text-text-soft">
            Ocurrió un error inesperado. Probá recargar la página; si sigue pasando, avisanos.
          </p>
          <Button onClick={this.handleReload}>Recargar</Button>
        </div>
      );
    }
    return this.props.children;
  }
}
