import { debounce } from "lodash-es";
import { type DependencyList, useMemo } from "react";

export function useDebounceFn<T extends (...args: any) => any>(
	fn: T,
	wait: number,
	deps: DependencyList,
	isLeading = true,
) {
	return useMemo(
		() =>
			debounce(fn, wait, isLeading ? { leading: true } : { trailing: true }),
		deps,
	);
}
