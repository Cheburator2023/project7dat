import Link, { type LinkProps } from "next/link";
import type { Route } from "next/types";
import { forwardRef } from "react";
import { Button, type ButtonProps } from "./ui/button";

export type Href = LinkProps<Route<string>>["href"];

export interface LinkButtonProps extends ButtonProps {
	href: Href;
	newWindow?: boolean;
}

export const LinkButton = forwardRef<HTMLButtonElement, LinkButtonProps>(
	({ href, newWindow, children, ...props }, ref) => {
		return (
			<Link href={href} target={newWindow ? "_blank" : undefined}>
				<Button {...props}>{children}</Button>
			</Link>
		);
	},
);
