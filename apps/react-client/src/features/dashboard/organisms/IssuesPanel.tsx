import { memo, useMemo } from "react";
import { Box, Typography, Chip, Alert } from "@mui/material";
import type { DataLineageSchema } from "@react-client/types/dataLineage";
import { Flex } from "@react-client/common/primitives/Flex";
import { Card } from "@react-client/common/muiCustom/Card";

import { useCurrentSchema } from "../hooks/useCurrentSchema";
import type { DebugIssue } from "../types";

// Analyze schema for issues
function analyzeSchema(
	schema: DataLineageSchema | null,
	graphId: string | null,
): DebugIssue[] {
	const issues: DebugIssue[] = [];
	const seenIssues = new Set<string>();

	const addIssue = (issue: DebugIssue) => {
		const key = `${issue.type}:${issue.category}:${issue.message}:${issue.location}`;
		if (!seenIssues.has(key)) {
			seenIssues.add(key);
			issues.push(issue);
		}
	};

	if (!schema) {
		return issues;
	}

	const entities = schema.entities || [];
	const mappings = schema.mappings || [];
	const gId = graphId || "current";

	// Track seen IDs for duplicates
	const seenEntityIds = new Map<string, number[]>();
	const entityAttrMap = new Map<string, Set<string>>();

	// Analyze entities
	entities.forEach((entity, entityIdx) => {
		// Check for null/undefined ID
		if (!entity.id) {
			addIssue({
				type: "error",
				category: "ID Сущности",
				message: "У сущности отсутствует ID",
				location: `сущности[${entityIdx}]`,
				details: JSON.stringify(entity, null, 2).slice(0, 200),
			});
			return;
		}

		// Check for duplicate IDs
		if (seenEntityIds.has(entity.id)) {
			seenEntityIds.get(entity.id)!.push(entityIdx);
		} else {
			seenEntityIds.set(entity.id, [entityIdx]);
		}

		// Track attributes for this entity
		const attrNames = new Set<string>();
		const seenAttrNames = new Map<string, number[]>();

		(entity.attrSeq || []).forEach((attr, attrIdx) => {
			if (!attr.name) {
				addIssue({
					type: "warning",
					category: "Атрибут",
					message: "У атрибута отсутствует имя",
					location: `сущности[${entityIdx}] "${entity.id}" → attrSeq[${attrIdx}]`,
				});
				return;
			}

			if (seenAttrNames.has(attr.name)) {
				seenAttrNames.get(attr.name)!.push(attrIdx);
			} else {
				seenAttrNames.set(attr.name, [attrIdx]);
			}
			attrNames.add(attr.name);
		});

		// Report duplicate attributes
		seenAttrNames.forEach((indices, attrName) => {
			if (indices.length > 1) {
				addIssue({
					type: "warning",
					category: "Дубликат Атрибута",
					message: `Атрибут "${attrName}" встречается ${indices.length} раз(а)`,
					location: `сущности[${entityIdx}] "${entity.id}"`,
					details: `Индексы: ${indices.join(", ")}`,
				});
			}
		});

		entityAttrMap.set(entity.id, attrNames);
	});

	// Report duplicate entity IDs
	seenEntityIds.forEach((indices, entityId) => {
		if (indices.length > 1) {
			addIssue({
				type: "error",
				category: "Дубликаты ID",
				message: `ID сущности "${entityId}" встречается ${indices.length} раз(а)`,
				location: "",
				details: `Индексы: ${indices.join(", ")}`,
			});
		}
	});

	// Analyze mappings
	mappings.forEach((mapping, mappingIdx) => {
		if (!mapping.entityId) {
			addIssue({
				type: "error",
				category: "Маппинг",
				message: "У маппинга отсутствует entityId",
				location: `маппинги[${mappingIdx}]`,
			});
			return;
		}

		// Check if target entity exists
		if (!seenEntityIds.has(mapping.entityId)) {
			addIssue({
				type: "warning",
				category: "Не найден маппинг",
				message: `Целевая сущность маппинга "${mapping.entityId}" не найдена в списке сущностей`,
				location: `маппинги[${mappingIdx}]`,
			});
		}

		(mapping.deps || []).forEach((dep, depIdx) => {
			if (!dep.entityId) {
				addIssue({
					type: "error",
					category: "Зависимость",
					message: "У зависимости отсутствует entityId",
					location: `маппинги[${mappingIdx}] → зависимости[${depIdx}]`,
				});
				return;
			}

			// Check if source entity exists
			if (!seenEntityIds.has(dep.entityId)) {
				addIssue({
					type: "warning",
					category: "Не найдена зависимость",
					message: `Исходная сущность зависимости "${dep.entityId}" не найдена в списке сущностей`,
					location: `маппинги[${mappingIdx}] → зависимости[${depIdx}]`,
				});
			}

			// Check attribute mappings
			(dep.attrMaps || []).forEach((attrMap, attrMapIdx) => {
				const srcEntityAttrs = entityAttrMap.get(dep.entityId);
				const dstEntityAttrs = entityAttrMap.get(mapping.entityId);

				if (srcEntityAttrs && !srcEntityAttrs.has(attrMap.src)) {
					addIssue({
						type: "warning",
						category: "Отсутствует Исходный Атрибут",
						message: `Исходный атрибут "${attrMap.src}" не найден в сущности "${dep.entityId}"`,
						location: `маппинги[${mappingIdx}] → зависимости[${depIdx}] → attrMaps[${attrMapIdx}]`,
					});
				}

				if (dstEntityAttrs && !dstEntityAttrs.has(attrMap.dst)) {
					addIssue({
						type: "warning",
						category: "Отсутствует Целевой Атрибут",
						message: `Целевой атрибут "${attrMap.dst}" не найден в сущности "${mapping.entityId}"`,
						location: `маппинги[${mappingIdx}] → зависимости[${depIdx}] → attrMaps[${attrMapIdx}]`,
					});
				}
			});
		});
	});

	return issues;
}

export const IssuesPanel = memo(() => {
	// Use currentSchema hook to get data synced with editor
	const { currentSchema, effectiveGraphId } = useCurrentSchema();

	const issues = useMemo(
		() => analyzeSchema(currentSchema, effectiveGraphId),
		[currentSchema, effectiveGraphId],
	);

	const errorCount = issues.filter((i) => i.type === "error").length;
	const warningCount = issues.filter((i) => i.type === "warning").length;

	return (
		<Box sx={{ p: 2, height: "100%", overflow: "auto", fontSize: 12 }}>
			{/* Summary */}
			<Box sx={{ display: "flex", gap: 1, mb: 2 }}>
				<Chip
					label={`${errorCount} ошибок`}
					color={errorCount > 0 ? "error" : "default"}
					size="small"
				/>
				<Chip
					label={`${warningCount} предупреждений`}
					color={warningCount > 0 ? "warning" : "default"}
					size="small"
				/>
			</Box>

			{/* Issues List */}
			<Flex gap={10} flexDirection="column">
				{issues.length === 0 ? (
					<Alert severity="success" sx={{ fontSize: 11 }}>
						Проблем не обнаружено!
					</Alert>
				) : (
					issues.map((issue, idx) => (
						<Card key={idx} title={issue.location}>
							<Flex gap={6} flexDirection="column">
								<div>
									<Chip
										label={issue.category}
										size="small"
										color={issue.type === "error" ? "error" : "warning"}
										sx={{ fontSize: 10, height: 20 }}
									/>
								</div>
								<Typography
									variant="body2"
									sx={{ fontWeight: 500, fontSize: 11 }}
								>
									{issue.message}
								</Typography>
								<Typography
									variant="body2"
									sx={{ fontWeight: 500, fontSize: 11 }}
								>
									{issue.location}
								</Typography>
							</Flex>

							{issue.details && (
								<Box
									component="pre"
									sx={{
										mt: 0.5,
										p: 0.5,
										bgcolor: "grey.100",
										borderRadius: 0.5,
										fontSize: 9,
										overflow: "auto",
										maxHeight: 60,
									}}
								>
									{issue.details}
								</Box>
							)}
						</Card>
					))
				)}
			</Flex>
		</Box>
	);
});

IssuesPanel.displayName = "IssuesPanel";
