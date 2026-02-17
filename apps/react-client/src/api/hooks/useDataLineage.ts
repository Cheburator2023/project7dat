import {
	useMutation,
	useQuery,
	useQueryClient,
	type UseMutationResult,
	type UseQueryResult,
} from "@tanstack/react-query";
import { jsonDataService, type JsonDataItem } from "./jsonDataApi";
import { useDataLineageStore } from "../../stores/dataLineageStore";
import type { DataLineageGraph } from "../../types/dataLineage";

export const DATA_LINEAGE_QUERY_KEYS = {
	all: ["dataLineage"] as const,
	graphs: () => ["dataLineage/graphs"] as const,
	graph: (id: string) => [`dataLineage/graph/${id}`] as const,
	current: () => ["dataLineage/current"] as const,
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

export const useCurrentDataLineageGraph = (options?: {
	enabled?: boolean;
	search?: string;
}) => {
	const { initializeGraph, setCurrentGraphId, currentGraphId } =
		useDataLineageStore();
	return useQuery({
		queryKey: DATA_LINEAGE_QUERY_KEYS.current(),

		queryFn: async () => {
			try {
				if (!options?.search) {
					setTimeout(() => {
						jsonDataService.getCurrent().then((backendItem) => {
							console.log("CurrentDataLineageGraph >> ", backendItem);

							if (!backendItem) {
								return null;
							}

							const graph = {
								id: "current_stable_version",
								desc: {
									change_date: backendItem.desc.change_date,
									appId: "current_stable_version",
									appName: "system",
								},
								failedMappings: [],
								entities: backendItem.entities,
								mappings: backendItem.mappings,
							} as DataLineageGraph;

							console.log(graph);

							initializeGraph(graph);
							setCurrentGraphId(graph.id);
						});
					}, 0);
				}
				if (options?.search && !currentGraphId) {
					const backendItem = await jsonDataService.getSearchEntity(
						options?.search.toUpperCase(),
					);

					if (!backendItem) {
						return null;
					}

					const graph = {
						id: "current_stable_version",
						desc: {
							change_date: backendItem.desc.change_date,
							appId: "current_stable_version",
							appName: "system",
						},
						failedMappings: [],
						entities: backendItem.entities,
						mappings: backendItem.mappings,
					} as DataLineageGraph;

					console.log(graph);

					initializeGraph(graph);
					return graph;
				}
			} catch (error) {
				console.warn("No current graph available:", error);
				initializeGraph(null as any);
				setCurrentGraphId(null);
				return null;
			}
		},
		staleTime: 100,
		retry: false,
		enabled: options?.enabled,
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
	const { currentGraphId } = useDataLineageStore();

	return useMutation({
		mutationFn: (graph: DataLineageGraph) => {
			if (!currentGraphId) {
				throw new Error("No current graph ID available");
			}
			return jsonDataService.update(currentGraphId, { data: graph });
		},
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: DATA_LINEAGE_QUERY_KEYS.graphs(),
			});
			if (currentGraphId) {
				queryClient.invalidateQueries({
					queryKey: DATA_LINEAGE_QUERY_KEYS.graph(currentGraphId),
				});
			}
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
			queryClient.invalidateQueries({
				queryKey: DATA_LINEAGE_QUERY_KEYS.graphs(),
			});
			queryClient.removeQueries({
				queryKey: DATA_LINEAGE_QUERY_KEYS.graph(deletedId),
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
			return JSON.parse(text) as DataLineageGraph;
		},
	});
};

export const useLoadFromAPI = (): UseMutationResult<
	DataLineageGraph,
	Error,
	string
> => {
	return useMutation({
		mutationFn: async (id: string) => {
			const backendItem = await jsonDataService.getById(id);
			return backendItem.data as DataLineageGraph;
		},
	});
};
