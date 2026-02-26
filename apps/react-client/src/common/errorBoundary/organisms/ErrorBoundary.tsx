import { Component, type ReactNode } from "react";

export interface ErrorBoundaryFallbackProps {
	error: unknown;
	componentStack?: string;
	resetErrorBoundary: () => void;
}

export interface ErrorBoundaryProps {
	children: ReactNode;
	fallback: (props: ErrorBoundaryFallbackProps) => ReactNode;
	resetKey?: string;
}

interface ErrorBoundaryState {
	error: unknown;
	componentStack?: string;
	resetKey?: string;
}

export class ErrorBoundary extends Component<
	ErrorBoundaryProps,
	ErrorBoundaryState
> {
	public state: ErrorBoundaryState = {
		error: undefined,
		componentStack: undefined,
		resetKey: this.props.resetKey,
	};

	public static getDerivedStateFromError(
		error: unknown,
	): Partial<ErrorBoundaryState> {
		return { error };
	}

	public componentDidCatch(_error: unknown, info: { componentStack?: string }) {
		this.setState({ componentStack: info.componentStack });
	}

	public componentDidUpdate(prevProps: ErrorBoundaryProps) {
		if (prevProps.resetKey !== this.props.resetKey) {
			this.resetErrorBoundary();
		}
	}

	private resetErrorBoundary = () => {
		this.setState({
			error: undefined,
			componentStack: undefined,
			resetKey: this.props.resetKey,
		});
	};

	public render(): ReactNode {
		if (this.state.error) {
			return this.props.fallback({
				error: this.state.error,
				componentStack: this.state.componentStack,
				resetErrorBoundary: this.resetErrorBoundary,
			});
		}

		return this.props.children;
	}
}
