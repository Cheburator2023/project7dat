import { useCallback } from "react";
import {
	useCreateJsonData,
	useDeleteJsonData,
	useJsonDataItem,
	useJsonDataList,
	useUpdateJsonData,
} from "./useJsonData";
import type {
	CreateJsonDataRequest,
	JsonDataItem,
	UpdateJsonDataRequest,
} from "../api/jsonDataApi";

export const useJsonDataActions = () => {
	const createMutation = useCreateJsonData();
	const updateMutation = useUpdateJsonData();
	const deleteMutation = useDeleteJsonData();

	const createItem = useCallback(
		async (data: CreateJsonDataRequest): Promise<JsonDataItem> => {
			return createMutation.mutateAsync(data);
		},
		[createMutation],
	);

	const updateItem = useCallback(
		async (id: string, data: UpdateJsonDataRequest): Promise<JsonDataItem> => {
			return updateMutation.mutateAsync({ id, data });
		},
		[updateMutation],
	);

	const deleteItem = useCallback(
		async (id: string): Promise<void> => {
			return deleteMutation.mutateAsync(id);
		},
		[deleteMutation],
	);

	return {
		createItem,
		updateItem,
		deleteItem,
		isCreating: createMutation.isPending,
		isUpdating: updateMutation.isPending,
		isDeleting: deleteMutation.isPending,
		createError: createMutation.error,
		updateError: updateMutation.error,
		deleteError: deleteMutation.error,
	};
};

export const useJsonDataManager = (id?: string) => {
	const listQuery = useJsonDataList();
	const itemQuery = useJsonDataItem(id || "", Boolean(id));
	const actions = useJsonDataActions();

	const refreshList = useCallback(() => {
		listQuery.refetch();
	}, [listQuery]);

	const refreshItem = useCallback(() => {
		if (id) {
			itemQuery.refetch();
		}
	}, [itemQuery, id]);

	return {
		list: listQuery.data || [],
		item: itemQuery.data,
		isLoadingList: listQuery.isLoading,
		isLoadingItem: itemQuery.isLoading,
		listError: listQuery.error,
		itemError: itemQuery.error,
		refreshList,
		refreshItem,
		...actions,
	};
};

export const useJsonDataSearch = (searchTerm?: string) => {
	const { data: items = [], ...rest } = useJsonDataList();

	const filteredItems = searchTerm
		? items.filter((item) => {
				const searchLower = searchTerm.toLowerCase();
				const dataString = JSON.stringify(item.data).toLowerCase();
				return (
					item.id.toLowerCase().includes(searchLower) ||
					dataString.includes(searchLower)
				);
			})
		: items;

	return {
		...rest,
		data: filteredItems,
		totalCount: items.length,
		filteredCount: filteredItems.length,
	};
};
