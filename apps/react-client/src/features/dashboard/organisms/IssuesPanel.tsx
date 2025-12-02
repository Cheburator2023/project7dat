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
				category: "Entity ID",
				message: "Entity has null/undefined ID",
				location: `Graph "${gId}" → entities[${entityIdx}]`,
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
					category: "Attribute",
					message: "Attribute has null/undefined name",
					location: `Graph "${gId}" → entities[${entityIdx}] "${entity.id}" → attrSeq[${attrIdx}]`,
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
					category: "Duplicate Attribute",
					message: `Attribute "${attrName}" appears ${indices.length} times`,
					location: `Graph "${gId}" → entities[${entityIdx}] "${entity.id}"`,
					details: `Indices: ${indices.join(", ")}`,
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
				category: "Дубли",
				message: `Entity ID "${entityId}" appears ${indices.length} times`,
				location: `Graph "${gId}"`,
				details: `Indices: ${indices.join(", ")}`,
			});
		}
	});

	// Analyze mappings
	mappings.forEach((mapping, mappingIdx) => {
		if (!mapping.entityId) {
			addIssue({
				type: "error",
				category: "Mapping",
				message: "Mapping has null/undefined entityId",
				location: `Graph "${gId}" → mappings[${mappingIdx}]`,
			});
			return;
		}

		// Check if target entity exists
		if (!seenEntityIds.has(mapping.entityId)) {
			addIssue({
				type: "warning",
				category: "Orphan Mapping",
				message: `Mapping target entity "${mapping.entityId}" not in entities list`,
				location: `Graph "${gId}" → mappings[${mappingIdx}]`,
			});
		}

		(mapping.deps || []).forEach((dep, depIdx) => {
			if (!dep.entityId) {
				addIssue({
					type: "error",
					category: "Dependency",
					message: "Dependency has null/undefined entityId",
					location: `Graph "${gId}" → mappings[${mappingIdx}] → deps[${depIdx}]`,
				});
				return;
			}

			// Check if source entity exists
			if (!seenEntityIds.has(dep.entityId)) {
				addIssue({
					type: "warning",
					category: "Orphan Dependency",
					message: `Dependency source entity "${dep.entityId}" not in entities list`,
					location: `Graph "${gId}" → mappings[${mappingIdx}] → deps[${depIdx}]`,
				});
			}

			// Check attribute mappings
			(dep.attrMaps || []).forEach((attrMap, attrMapIdx) => {
				const srcEntityAttrs = entityAttrMap.get(dep.entityId);
				const dstEntityAttrs = entityAttrMap.get(mapping.entityId);

				if (srcEntityAttrs && !srcEntityAttrs.has(attrMap.src)) {
					addIssue({
						type: "warning",
						category: "Отсутствует источник",
						message: `Source attr "${attrMap.src}" not in entity "${dep.entityId}"`,
						location: `Graph "${gId}" → mappings[${mappingIdx}] → deps[${depIdx}] → attrMaps[${attrMapIdx}]`,
					});
				}

				if (dstEntityAttrs && !dstEntityAttrs.has(attrMap.dst)) {
					addIssue({
						type: "warning",
						category: "Missing Target Attr",
						message: `Target attr "${attrMap.dst}" not in entity "${mapping.entityId}"`,
						location: `Graph "${gId}" → mappings[${mappingIdx}] → deps[${depIdx}] → attrMaps[${attrMapIdx}]`,
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
						<Card key={idx}>
							<Box
								sx={{
									display: "flex",
									gap: 1,
									alignItems: "center",
									mb: 0.5,
								}}
							>
								<Chip
									label={issue.category}
									size="small"
									color={issue.type === "error" ? "error" : "warning"}
									sx={{ fontSize: 10, height: 20 }}
								/>
								<Typography
									variant="body2"
									sx={{ fontWeight: 500, fontSize: 11 }}
								>
									{issue.message}
								</Typography>
							</Box>
							<Typography
								variant="caption"
								sx={{
									fontFamily: "monospace",
									fontSize: 10,
									color: "text.secondary",
									display: "block",
								}}
							>
								{issue.location}
							</Typography>
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
