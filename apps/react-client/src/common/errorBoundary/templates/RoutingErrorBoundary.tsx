import { useCallback, type ReactNode } from "react";
import { useLocation } from "react-router";

import {
	ErrorBoundary,
	type ErrorBoundaryFallbackProps,
} from "@react-client/common/errorBoundary/organisms/ErrorBoundary";
import { RoutingErrorPage } from "@react-client/common/errorBoundary/pages/RoutingErrorPage";

export const RoutingErrorBoundary = (props: { children: ReactNode }) => {
	const { children } = props;
	const location = useLocation();

	const fallback = useCallback(
		({
			error,
			componentStack,
			resetErrorBoundary,
		}: ErrorBoundaryFallbackProps) => {
			return (
				<RoutingErrorPage
					error={error}
					componentStack={componentStack}
					onReset={resetErrorBoundary}
				/>
			);
		},
		[],
	);

	return (
		<ErrorBoundary
			resetKey={`${location.pathname}${location.search}${location.hash}`}
			fallback={fallback}
		>
			{children}
		</ErrorBoundary>
	);
};
