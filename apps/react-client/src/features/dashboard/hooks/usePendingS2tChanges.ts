import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import type {
	DataLineageSchema,
	DataLineageEntity,
} from "@react-client/types/dataLineage";

const API_BASE_URL =
	window.urlConfig?.DATA_LINEAGE_API || "http://localhost:3000";

const S2T_PENDING_COMMIT_LS_KEY = "s2t_pending_commit";

type ChangeType = "added" | "removed" | "changed";

const pickComparableEntity = (e: DataLineageEntity) => ({
	id: e.id,
	type: e.type,
	name: e.name,
	namespace: e.namespace,
	description: e.description,
	entity_change: e.entity_change,
	modified: e.modified,
	attrSeq: (e.attrSeq || []).map((a) => ({
		name: a.name,
		type: a.type,
		comment: a.comment,
	})),
});

export function usePendingS2tChanges(currentSchema: DataLineageSchema | null) {
	const [pendingCommitId, setPendingCommitId] = useState<string | null>(null);
	const [pendingSchema, setPendingSchema] = useState<DataLineageSchema | null>(
		null,
	);

	useEffect(() => {
		const readId = () => {
			try {
				const raw = localStorage.getItem(S2T_PENDING_COMMIT_LS_KEY);
				const parsed = raw ? (JSON.parse(raw) as { commitId?: string }) : null;
				setPendingCommitId(parsed?.commitId ?? null);
			} catch {
				setPendingCommitId(null);
			}
		};

		readId();
		const onStorage = (e: StorageEvent) => {
			if (e.key === S2T_PENDING_COMMIT_LS_KEY) readId();
		};
		window.addEventListener("storage", onStorage);
		const interval = window.setInterval(readId, 2000);
		return () => {
			window.removeEventListener("storage", onStorage);
			window.clearInterval(interval);
		};
	}, []);

	useEffect(() => {
		let cancelled = false;
		const run = async () => {
			if (!pendingCommitId) {
				setPendingSchema(null);
				return;
			}
			try {
				const res = await axios.get(
					`${API_BASE_URL}/api/s2t-commits/${pendingCommitId}`,
				);
				const payload = res.data?.payload as DataLineageSchema | undefined;
				if (!cancelled) setPendingSchema(payload ?? null);
			} catch {
				if (!cancelled) setPendingSchema(null);
			}
		};

		run();
		return () => {
			cancelled = true;
		};
	}, [pendingCommitId]);

	const { changeByEntityId, addedOnlyEntityIds, displaySchema } =
		useMemo(() => {
			const changes = new Map<string, ChangeType>();
			const addedOnly = new Set<string>();
			let schemaForView: DataLineageSchema | null = currentSchema;

			if (!currentSchema && pendingSchema) {
				schemaForView = pendingSchema;
			}

			if (!currentSchema || !pendingSchema) {
				return {
					changeByEntityId: changes,
					addedOnlyEntityIds: addedOnly,
					displaySchema: schemaForView,
				};
			}

			const currentById = new Map(
				(currentSchema.entities || []).map((e) => [e.id, e]),
			);
			const pendingById = new Map(
				(pendingSchema.entities || []).map((e) => [e.id, e]),
			);

			for (const [id, pending] of pendingById.entries()) {
				const current = currentById.get(id);
				if (!current) {
					addedOnly.add(id);
					changes.set(id, "added");
					continue;
				}

				const pendingChange = (pending.entity_change || "").toLowerCase();
				if (pendingChange.includes("del") || pendingChange.includes("remove")) {
					changes.set(id, "removed");
					continue;
				}
				if (pendingChange.includes("add") || pendingChange.includes("new")) {
					changes.set(id, "added");
					continue;
				}

				const a = JSON.stringify(pickComparableEntity(current));
				const b = JSON.stringify(pickComparableEntity(pending));
				if (a !== b) {
					changes.set(id, "changed");
				}
			}

			const entitiesUnion: DataLineageEntity[] = [];
			const allIds = new Set<string>([
				...currentById.keys(),
				...pendingById.keys(),
			]);
			for (const id of allIds) {
				const pending = pendingById.get(id);
				const current = currentById.get(id);
				const base = pending ?? current;
				if (!base) continue;

				const pendingChange = (pending?.entity_change || "").toLowerCase();
				if (pendingChange.includes("del") || pendingChange.includes("remove")) {
					changes.set(id, "removed");
				}
				const changeType = changes.get(id);

				entitiesUnion.push({
					...base,
					entity_change: changeType ?? base.entity_change,
				});
			}

			const mappingKey = (m: any) => {
				try {
					return JSON.stringify(m);
				} catch {
					return String(m?.id ?? "");
				}
			};
			const mappingMap = new Map<string, any>();
			for (const m of currentSchema.mappings || []) {
				mappingMap.set(mappingKey(m), m);
			}
			for (const m of pendingSchema.mappings || []) {
				mappingMap.set(mappingKey(m), m);
			}

			schemaForView = {
				desc: pendingSchema.desc ?? currentSchema.desc,
				entities: entitiesUnion,
				mappings: Array.from(mappingMap.values()),
				failedMappings:
					pendingSchema.failedMappings ?? currentSchema.failedMappings,
			};

			return {
				changeByEntityId: changes,
				addedOnlyEntityIds: addedOnly,
				displaySchema: schemaForView,
			};
		}, [currentSchema, pendingSchema]);

	return {
		pendingCommitId,
		pendingSchema,
		changeByEntityId,
		addedOnlyEntityIds,
		displaySchema,
	};
}
