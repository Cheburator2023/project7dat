import { forwardRef } from "react";
import { LoadingIcon } from "./ui/LoadingIcon";
import { Button, type ButtonProps } from "./ui/button";

export interface LoadingButtonProps extends ButtonProps {
	loading: boolean;
}

export const LoadingButton = forwardRef<HTMLButtonElement, LoadingButtonProps>(
	({ loading, children, ...props }, ref) => {
		return (
			<Button ref={ref} disabled={loading} {...props}>
				<LoadingIcon loading={loading} />
				{children}
			</Button>
		);
	},
);
