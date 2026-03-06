import { Injectable } from "@nestjs/common";

export interface DiffChange {
	type: "added" | "removed" | "modified";
	path: string;
	oldValue?: any;
	newValue?: any;
}

@Injectable()
export class DiffService {
	/**
	 * Итеративно сравнивает два JSON объекта и возвращает список изменений.
	 */
	computeDiff(oldObj: any, newObj: any): DiffChange[] {
		const changes: DiffChange[] = [];
		// Стек элементов для обработки: каждый элемент содержит старую и новую ветку и путь
		const stack: Array<{ oldVal: any; newVal: any; path: string }> = [
			{ oldVal: oldObj, newVal: newObj, path: "" },
		];

		while (stack.length > 0) {
			const { oldVal, newVal, path } = stack.pop()!;

			// Если оба null/undefined или строго равны – без изменений
			if (oldVal === newVal) continue;

			// Если типы разные или один из них null/undefined
			if (
				oldVal === null ||
				oldVal === undefined ||
				newVal === null ||
				newVal === undefined ||
				typeof oldVal !== typeof newVal
			) {
				changes.push({
					type: "modified",
					path: path || "/",
					oldValue: oldVal,
					newValue: newVal,
				});
				continue;
			}

			// Примитивные типы
			if (typeof oldVal !== "object") {
				if (oldVal !== newVal) {
					changes.push({
						type: "modified",
						path: path || "/",
						oldValue: oldVal,
						newValue: newVal,
					});
				}
				continue;
			}

			// Оба – объекты или массивы
			const oldKeys = new Set(Object.keys(oldVal));
			const newKeys = new Set(Object.keys(newVal));

			// Удалённые ключи
			for (const key of oldKeys) {
				if (!newKeys.has(key)) {
					const newPath = this.joinPath(path, key);
					changes.push({
						type: "removed",
						path: newPath,
						oldValue: oldVal[key],
					});
				}
			}

			// Добавленные и потенциально изменённые ключи
			for (const key of newKeys) {
				const newPath = this.joinPath(path, key);
				if (!oldKeys.has(key)) {
					changes.push({
						type: "added",
						path: newPath,
						newValue: newVal[key],
					});
				} else {
					// Ключ есть в обоих объектах – кладём в стек для дальнейшего сравнения
					stack.push({
						oldVal: oldVal[key],
						newVal: newVal[key],
						path: newPath,
					});
				}
			}
		}

		return changes;
	}

	private joinPath(base: string, key: string): string {
		if (base === "" || base === "/") {
			return `/${key}`;
		}
		return `${base}/${key}`;
	}
}
