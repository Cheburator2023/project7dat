import { useState, useMemo } from "react";
import {
	Box,
	TextField,
	InputAdornment,
	Chip,
	IconButton,
	Alert,
	CircularProgress,
} from "@mui/material";
import { styled, useColorScheme } from "@mui/material/styles";
import { Search, Visibility } from "@mui/icons-material";
import { AgGridReact } from "ag-grid-react";
import { ColDef } from "ag-grid-community";
import {
	agGridCustomMUITheme,
	agGridCustomMUIThemeDark,
} from "@react-client/theme/ag-grid/agGridCustomTheme";
import { Header } from "@react-client/common/navigation/organisms/Header";
import { Flex } from "@react-client/common/primitives/Flex";
import { ModelGraphWindow } from "./organisms/ModelGraphWindow";
import { DataLineageEntity } from "@data-lineage/shared-schemas";
import { useJsonDataList } from "@react-client/api/hooks";
import type { JsonDataItem } from "@react-client/api/hooks/jsonDataApi";

// Extended interface based on DataLineageEntity for UI display purposes
export interface Model extends DataLineageEntity {
	graphId?: string;
	description?: string;
	createdDate?: string;
	updatedDate?: string;
	status?: "active" | "draft" | "archived";
	author?: string;
	version?: string;
	tags?: string[];
	lastAccessDate?: string;
	size?: string;
	objectsCount?: number;
	businessType?: "analytical" | "operational" | "dimensional";
}

const mapJsonDataItemToModels = (item: JsonDataItem): Model[] => {
	const data = item.data;
	const entities = data?.entities ?? [];
	return entities.map((entity) => ({
		...entity,
		graphId: item.id,
		description:
			// entity может не иметь description в shared-схеме, поэтому подстраховываемся
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			((entity as any).description as string | undefined) ||
			item.description ||
			data.desc.appName,
		createdDate: item.createdAt,
		updatedDate: item.updatedAt,
		status: item.deprecated ? "archived" : "active",
		author: item.authorName,
		version: item.version,
		tags: [],
		lastAccessDate: item.updatedAt,
		objectsCount: entity.attrSeq?.length,
		businessType: undefined,
	}));
};

const _StyledContainer = styled(Box)(({ theme }) => ({
	height: "100vh",
	display: "flex",
	flexDirection: "column",
	padding: theme.spacing(2),
	gap: theme.spacing(2),
}));

const getBusinessTypeColor = (businessType: Model["businessType"]) => {
	switch (businessType) {
		case "analytical":
			return "primary";
		case "operational":
			return "secondary";
		case "dimensional":
			return "info";
		default:
			return "default";
	}
};

const getStatusColor = (status: Model["status"]) => {
	switch (status) {
		case "active":
			return "success";
		case "draft":
			return "warning";
		case "archived":
			return "error";
		default:
			return "default";
	}
};

const _BusinessTypeChipRenderer = ({
	value,
}: {
	value: Model["businessType"];
}) => {
	const businessTypeLabels = {
		analytical: "Аналитическая",
		operational: "Операционная",
		dimensional: "Размерная",
	};

	if (!value) return null;

	return (
		<Chip
			label={businessTypeLabels[value]}
			color={getBusinessTypeColor(value) as any}
			size="small"
			variant="outlined"
		/>
	);
};

const _TechnicalTypeChipRenderer = ({ value }: { value: Model["type"] }) => {
	const technicalTypeLabels = {
		table: "Таблица",
		view: "Представление",
		rdd: "RDD",
		unresolved: "Неопределенный",
	};

	return (
		<Chip
			label={technicalTypeLabels[value]}
			color="default"
			size="small"
			variant="filled"
		/>
	);
};

const StatusChipRenderer = ({ value }: { value: Model["status"] }) => {
	const statusLabels = {
		active: "Активная",
		draft: "Черновик",
		archived: "Архивная",
	};

	if (!value) return null;

	return (
		<Chip
			label={statusLabels[value]}
			color={getStatusColor(value) as any}
			size="small"
		/>
	);
};

const TagsRenderer = ({ value }: { value: string[] }) => {
	return (
		<Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap" }}>
			{value.map((tag, index) => (
				<Chip
					key={index}
					label={tag}
					size="small"
					variant="outlined"
					sx={{ fontSize: "0.7rem", height: "20px" }}
				/>
			))}
		</Box>
	);
};

const ActionRenderer = ({ data }: { data: Model }) => {
	const [selectedModel, setSelectedModel] = useState<Model | null>(null);
	const [isGraphOpen, setIsGraphOpen] = useState(false);

	const handleViewModel = () => {
		setSelectedModel(data);
		setIsGraphOpen(true);
	};

	const handleCloseGraph = () => {
		setIsGraphOpen(false);
		setSelectedModel(null);
	};

	return (
		<>
			<IconButton
				size="small"
				onClick={handleViewModel}
				sx={{ color: "primary.main" }}
			>
				<Visibility fontSize="small" />
			</IconButton>
			{selectedModel && (
				<ModelGraphWindow
					isOpen={isGraphOpen}
					onClose={handleCloseGraph}
					model={selectedModel}
				/>
			)}
		</>
	);
};

export const ModelsPage = () => {
	const [searchQuery, setSearchQuery] = useState("");
	const { mode } = useColorScheme();
	const { data: jsonDataList, isLoading, error } = useJsonDataList();

	const baseModels = useMemo<Model[]>(() => {
		if (!jsonDataList) {
			return [];
		}
		return jsonDataList.flatMap(mapJsonDataItemToModels);
	}, [jsonDataList]);

	const filteredModels = useMemo(() => {
		if (!searchQuery.trim()) return baseModels;

		const query = searchQuery.toLowerCase();
		return baseModels.filter(
			(model) =>
				(model.name?.toLowerCase().includes(query) ?? false) ||
				(model.description?.toLowerCase().includes(query) ?? false) ||
				(model.author?.toLowerCase().includes(query) ?? false) ||
				(model.tags?.some((tag) => tag.toLowerCase().includes(query)) ?? false),
		);
	}, [baseModels, searchQuery]);

	if (isLoading) {
		return (
			<Box
				sx={{
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
					minHeight: "50vh",
				}}
			>
				<CircularProgress />
			</Box>
		);
	}

	if (error) {
		return (
			<Box sx={{ p: 3 }}>
				<Alert severity="error">Ошибка загрузки моделей: {error.message}</Alert>
			</Box>
		);
	}

	const columnDefs: ColDef<Model>[] = [
		{
			headerName: "ID",
			field: "id",
			width: 150,
			pinned: "left",
		},
		{
			headerName: "Название",
			field: "name",
			flex: 2,
			minWidth: 200,
			cellStyle: { fontWeight: "bold" },
		},
		{
			headerName: "Пространство имен",
			field: "namespace",
			width: 140,
		},
		{
			headerName: "Тип",
			field: "type",
			width: 140,
			cellRenderer: (params: any) => (
				<Chip
					label={params.value}
					color="primary"
					size="small"
					variant="outlined"
				/>
			),
		},
		{
			headerName: "Изменен",
			field: "modified",
			width: 100,
			cellRenderer: (params: any) => (
				<Chip
					label={params.value ? "Да" : "Нет"}
					color={params.value ? "warning" : "success"}
					size="small"
					variant="outlined"
				/>
			),
		},
		{
			headerName: "Описание",
			field: "description",
			flex: 3,
			minWidth: 300,
			autoHeight: true,
		},
		{
			headerName: "Статус",
			field: "status",
			width: 120,
			cellRenderer: StatusChipRenderer,
		},
		{
			headerName: "Автор",
			field: "author",
			width: 150,
		},
		{
			headerName: "Версия",
			field: "version",
			width: 100,
		},
		{
			headerName: "Атрибуты",
			field: "objectsCount",
			width: 100,
			type: "numericColumn",
		},
		{
			headerName: "Размер",
			field: "size",
			width: 100,
		},
		{
			headerName: "Теги",
			field: "tags",
			flex: 1,
			minWidth: 200,
			cellRenderer: TagsRenderer,
		},
		{
			headerName: "Создана",
			field: "createdDate",
			width: 120,
			type: "dateColumn",
		},
		{
			headerName: "Обновлена",
			field: "updatedDate",
			width: 120,
			type: "dateColumn",
		},
		{
			headerName: "Последний доступ",
			field: "lastAccessDate",
			width: 140,
			type: "dateColumn",
		},
		{
			headerName: "Действия",
			width: 100,
			cellRenderer: ActionRenderer,
			sortable: false,
			filter: false,
			pinned: "right",
		},
	];

	return (
		<div>
			<Header>
				<Flex alignItems="center" gap={10} width="666px">
					<TextField
						placeholder="Поиск моделей по названию, описанию, автору или тегам..."
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						fullWidth
						size="small"
						InputProps={{
							startAdornment: (
								<InputAdornment position="start">
									<Search />
								</InputAdornment>
							),
						}}
					/>
					<Chip
						label={`${filteredModels.length} моделей`}
						color="primary"
						variant="outlined"
					/>
				</Flex>
			</Header>

			<Box sx={{ flex: 1, minHeight: 0 }}>
				<AgGridReact<Model>
					rowData={filteredModels}
					columnDefs={columnDefs}
					theme={
						mode === "dark" ? agGridCustomMUIThemeDark : agGridCustomMUITheme
					}
					defaultColDef={{
						sortable: true,
						filter: true,
						resizable: true,
					}}
					pagination={true}
					paginationPageSize={20}
					paginationPageSizeSelector={[10, 20, 50, 100]}
					animateRows={true}
					rowSelection="single"
					suppressRowClickSelection={true}
					// getRowHeight={() => "auto"}
					domLayout="normal"
				/>
			</Box>
		</div>
	);
};
