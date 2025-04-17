import { LoadingButton } from "@react-client/features/json4u/components/LoadingButton";
import { Input } from "@react-client/features/json4u/components/ui/input";
import { useDebounceFn } from "@react-client/features/json4u/lib/hooks";
import { cn } from "@react-client/features/json4u/lib/utils";
import { useStatusStore } from "@react-client/features/json4u/stores/statusStore";
import { useTranslations } from "@react-client/features/json4u/useTranslations";
import {
	type ComponentPropsWithoutRef,
	type ElementRef,
	forwardRef,
	useEffect,
	useState,
} from "react";

interface InputBoxProps extends ComponentPropsWithoutRef<typeof Input> {
	id: string;
	run: (input: string) => Promise<void>;
	placeholderFn?: (loading: boolean) => string;
	initial?: () => Promise<void>;
}

export const InputBox = forwardRef<ElementRef<typeof Input>, InputBoxProps>(
	({ className, ...props }, ref) => {
		const t = useTranslations();
		const setCommandMode = useStatusStore((state) => state.setCommandMode);
		const onChange = useDebounceFn(
			async (ev) => props.run(ev.target.value),
			1000,
			[props.run],
		);
		const [loading, setLoading] = useState(!!props.initial);

		useEffect(() => {
			(async () => {
				if (props.initial) {
					await props.initial();
					setLoading(false);
				}
			})();
		}, []);

		return (
			<div className={cn("flex grow items-center space-x-2", className)}>
				<Input
					id={props.id}
					type="text"
					disabled={loading}
					placeholder={
						props.placeholderFn
							? props.placeholderFn(loading)
							: props.placeholder
					}
					ref={ref}
					onChange={onChange}
					onKeyDown={(ev) => {
						if (ev.ctrlKey || ev.metaKey || ev.shiftKey || ev.altKey) {
							return;
						}

						const el = ev.target as HTMLInputElement;

						if (ev.key === "Enter") {
							props.run(el.value);
							onChange.cancel();
						} else if (ev.key === "Escape") {
							setCommandMode(undefined);
						}
					}}
				/>
				<LoadingButton
					loading={loading}
					variant="outline"
					onClick={async () =>
						props.run(
							(document.getElementById(props.id) as HTMLInputElement).value,
						)
					}
				>
					{t("Execute")}
				</LoadingButton>
			</div>
		);
	},
);
