import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface NetworkNotification {
	id: string;
	type: "success" | "error";
	message: string;
	method: string;
	url: string;
	timestamp: number;
	read: boolean;
}

interface NotificationState {
	notifications: NetworkNotification[];
	unreadCount: number;
	isDrawerOpen: boolean;
	addNotification: (
		notification: Omit<NetworkNotification, "id" | "timestamp" | "read">,
	) => void;
	markAsRead: (id: string) => void;
	markAllAsRead: () => void;
	clearNotifications: () => void;
	setDrawerOpen: (open: boolean) => void;
	removeNotification: (id: string) => void;
}

export const useNotificationStore = create<NotificationState>()(
	persist(
		(set, _get) => ({
			notifications: [],
			unreadCount: 0,
			isDrawerOpen: false,
			addNotification: (notification) => {
				const newNotification: NetworkNotification = {
					...notification,
					id: `${Date.now()}-${Math.random()}`,
					timestamp: Date.now(),
					read: false,
				};
				set((state) => ({
					notifications: [newNotification, ...state.notifications].slice(
						0,
						100,
					),
					unreadCount: state.unreadCount + 1,
				}));
			},
			markAsRead: (id) => {
				set((state) => {
					const notification = state.notifications.find((n) => n.id === id);
					if (notification && !notification.read) {
						return {
							notifications: state.notifications.map((n) =>
								n.id === id ? { ...n, read: true } : n,
							),
							unreadCount: Math.max(0, state.unreadCount - 1),
						};
					}
					return state;
				});
			},
			markAllAsRead: () => {
				set((state) => ({
					notifications: state.notifications.map((n) => ({ ...n, read: true })),
					unreadCount: 0,
				}));
			},
			clearNotifications: () => {
				set({ notifications: [], unreadCount: 0 });
			},
			setDrawerOpen: (open) => {
				set({ isDrawerOpen: open });
			},
			removeNotification: (id) => {
				set((state) => {
					const notification = state.notifications.find((n) => n.id === id);
					const wasUnread = notification && !notification.read;
					return {
						notifications: state.notifications.filter((n) => n.id !== id),
						unreadCount: wasUnread
							? Math.max(0, state.unreadCount - 1)
							: state.unreadCount,
					};
				});
			},
		}),
		{
			name: "notification-storage",
		},
	),
);
