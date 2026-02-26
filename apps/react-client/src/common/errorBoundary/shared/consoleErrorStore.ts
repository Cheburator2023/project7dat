type ConsoleLevel = "error" | "warn" | "log";

export type ConsoleEntry = {
	level: ConsoleLevel;
	message: string;
	timestamp: number;
};

type Subscriber = () => void;

type ConsoleStore = {
	getSnapshot: () => ConsoleEntry[];
	subscribe: (subscriber: Subscriber) => () => void;
	init: () => void;
	reset: () => void;
};

const normalizeConsoleArgs = (args: unknown[]) => {
	return args
		.map((arg) => {
			if (typeof arg === "string") return arg;
			if (arg instanceof Error) {
				return `${arg.name}: ${arg.message}\n${arg.stack ?? ""}`;
			}
			try {
				return JSON.stringify(arg, null, 2);
			} catch {
				return String(arg);
			}
		})
		.join(" ");
};

const MAX_ENTRIES = 200;

let initialized = false;
let entries: ConsoleEntry[] = [];
const subscribers = new Set<Subscriber>();

let unpatch: null | (() => void) = null;

const emit = () => {
	for (const sub of subscribers) sub();
};

const push = (level: ConsoleLevel, args: unknown[]) => {
	entries = [
		{ level, message: normalizeConsoleArgs(args), timestamp: Date.now() },
		...entries,
	].slice(0, MAX_ENTRIES);
	emit();
};

export const consoleErrorStore: ConsoleStore = {
	getSnapshot: () => entries,
	subscribe: (subscriber) => {
		subscribers.add(subscriber);
		return () => subscribers.delete(subscriber);
	},
	init: () => {
		if (initialized) return;
		initialized = true;

		const originalError = console.error;
		const originalWarn = console.warn;
		const originalLog = console.log;

		console.error = (...args: unknown[]) => {
			push("error", args);
			originalError(...args);
		};
		console.warn = (...args: unknown[]) => {
			push("warn", args);
			originalWarn(...args);
		};
		console.log = (...args: unknown[]) => {
			push("log", args);
			originalLog(...args);
		};

		const onError = (event: ErrorEvent) => {
			push("error", [event.message, event.error]);
		};
		const onUnhandledRejection = (event: PromiseRejectionEvent) => {
			push("error", ["UnhandledRejection", event.reason]);
		};

		window.addEventListener("error", onError);
		window.addEventListener("unhandledrejection", onUnhandledRejection);

		unpatch = () => {
			console.error = originalError;
			console.warn = originalWarn;
			console.log = originalLog;
			window.removeEventListener("error", onError);
			window.removeEventListener("unhandledrejection", onUnhandledRejection);
		};
	},
	reset: () => {
		entries = [];
		emit();
	},
};

export const destroyConsoleErrorStore = () => {
	unpatch?.();
	unpatch = null;
	initialized = false;
};
