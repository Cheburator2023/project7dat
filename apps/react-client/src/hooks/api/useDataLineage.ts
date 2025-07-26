import {
	useMutation,
	useQuery,
	useQueryClient,
	type UseMutationResult,
	type UseQueryResult,
} from "@tanstack/react-query";
import { jsonDataService, type JsonDataItem } from "../../api/jsonDataApi";
import type { DataLineageGraph } from "../../types/dataLineage";

export const DATA_LINEAGE_QUERY_KEYS = {
	all: ["dataLineage"] as const,
	graphs: () => [...DATA_LINEAGE_QUERY_KEYS.all, "graphs"] as const,
	graph: (id: string) => [...DATA_LINEAGE_QUERY_KEYS.all, "graph", id] as const,
};

export const useDataLineageGraphs = (): UseQueryResult<
	DataLineageGraph[],
	Error
> => {
	return useQuery({
		queryKey: DATA_LINEAGE_QUERY_KEYS.graphs(),
		queryFn: async () => {
			const backendItems = await jsonDataService.getAll();
			return backendItems.map((item) => item.data as DataLineageGraph);
		},
		staleTime: 5 * 60 * 1000,
	});
};

export const useDataLineageGraph = (
	id: string,
	enabled = true,
): UseQueryResult<DataLineageGraph, Error> => {
	return useQuery({
		queryKey: DATA_LINEAGE_QUERY_KEYS.graph(id),
		queryFn: async () => {
			const backendItem = await jsonDataService.getById(id);
			return backendItem.data as DataLineageGraph;
		},
		enabled: enabled && Boolean(id),
		staleTime: 5 * 60 * 1000,
	});
};

export const useCreateDataLineageGraph = (): UseMutationResult<
	JsonDataItem,
	Error,
	DataLineageGraph
> => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (graph: DataLineageGraph) =>
			jsonDataService.create({ data: graph }),
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: DATA_LINEAGE_QUERY_KEYS.graphs(),
			});
		},
	});
};

export const useSaveDataLineageGraph = (): UseMutationResult<
	JsonDataItem,
	Error,
	DataLineageGraph
> => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (graph: DataLineageGraph) =>
			jsonDataService.create({ data: graph }),
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: DATA_LINEAGE_QUERY_KEYS.graphs(),
			});
		},
	});
};

export const useDeleteDataLineageGraph = (): UseMutationResult<
	void,
	Error,
	string
> => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: jsonDataService.delete,
		onSuccess: (_, deletedId) => {
			queryClient.removeQueries({
				queryKey: DATA_LINEAGE_QUERY_KEYS.graph(deletedId),
			});
			queryClient.invalidateQueries({
				queryKey: DATA_LINEAGE_QUERY_KEYS.graphs(),
			});
		},
	});
};

export const useLoadFromFile = (): UseMutationResult<
	DataLineageGraph,
	Error,
	File
> => {
	return useMutation({
		mutationFn: async (file: File) => {
			const text = await file.text();
			const data = JSON.parse(text);

			if (data.desc && data.entities && data.mappings) {
				return data as DataLineageGraph;
			}
			throw new Error("Неподдерживаемый формат файла");
		},
	});
};

export const useLoadFromAPI = (): UseMutationResult<
	DataLineageGraph,
	Error,
	string
> => {
	return useMutation({
		mutationFn: async (url: string) => {
			const response = await fetch(url);
			if (!response.ok) {
				throw new Error(`HTTP ${response.status}: ${response.statusText}`);
			}

			const data = await response.json();

			if (data.desc && data.entities && data.mappings) {
				return data as DataLineageGraph;
			}
			throw new Error("API вернул данные в неподдерживаемом формате");
		},
	});
};
