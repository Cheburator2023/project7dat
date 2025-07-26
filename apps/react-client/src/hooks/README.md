# JSON Data API Hooks

Этот модуль предоставляет React hooks для работы с JSON Data API эндпоинтами.

## Установка

Hooks уже настроены и готовы к использованию. Убедитесь, что React Query Provider настроен в App.tsx.

## API Клиент

### `jsonDataApi`
Базовый Axios клиент для работы с JSON Data API.

### `jsonDataService`
Сервис с методами для всех CRUD операций:
- `getAll()` - получить все элементы
- `getById(id)` - получить элемент по ID
- `create(data)` - создать новый элемент
- `update(id, data)` - обновить элемент
- `delete(id)` - удалить элемент

## Основные Hooks

### `useJsonDataList()`
Получает список всех JSON элементов.

```tsx
import { useJsonDataList } from '@react-client/hooks';

const MyComponent = () => {
  const { data: items, isLoading, error } = useJsonDataList();
  
  if (isLoading) return <div>Загрузка...</div>;
  if (error) return <div>Ошибка: {error.message}</div>;
  
  return (
    <ul>
      {items.map(item => (
        <li key={item.id}>{JSON.stringify(item.data)}</li>
      ))}
    </ul>
  );
};
```

### `useJsonDataItem(id, enabled?)`
Получает конкретный JSON элемент по ID.

```tsx
import { useJsonDataItem } from '@react-client/hooks';

const ItemDetail = ({ id }: { id: string }) => {
  const { data: item, isLoading, error } = useJsonDataItem(id);
  
  if (isLoading) return <div>Загрузка...</div>;
  if (error) return <div>Ошибка: {error.message}</div>;
  if (!item) return <div>Элемент не найден</div>;
  
  return (
    <div>
      <h3>ID: {item.id}</h3>
      <pre>{JSON.stringify(item.data, null, 2)}</pre>
    </div>
  );
};
```

### `useCreateJsonData()`
Создает новый JSON элемент.

```tsx
import { useCreateJsonData } from '@react-client/hooks';

const CreateForm = () => {
  const createMutation = useCreateJsonData();
  
  const handleSubmit = async (formData: any) => {
    try {
      const newItem = await createMutation.mutateAsync({
        data: formData
      });
      console.log('Создан элемент:', newItem);
    } catch (error) {
      console.error('Ошибка создания:', error);
    }
  };
  
  return (
    <button 
      onClick={() => handleSubmit({ example: 'data' })}
      disabled={createMutation.isPending}
    >
      {createMutation.isPending ? 'Создание...' : 'Создать'}
    </button>
  );
};
```

### `useUpdateJsonData()`
Обновляет существующий JSON элемент.

```tsx
import { useUpdateJsonData } from '@react-client/hooks';

const UpdateForm = ({ id }: { id: string }) => {
  const updateMutation = useUpdateJsonData();
  
  const handleUpdate = async (newData: any) => {
    try {
      const updatedItem = await updateMutation.mutateAsync({
        id,
        data: { data: newData }
      });
      console.log('Обновлен элемент:', updatedItem);
    } catch (error) {
      console.error('Ошибка обновления:', error);
    }
  };
  
  return (
    <button 
      onClick={() => handleUpdate({ updated: true })}
      disabled={updateMutation.isPending}
    >
      {updateMutation.isPending ? 'Обновление...' : 'Обновить'}
    </button>
  );
};
```

### `useDeleteJsonData()`
Удаляет JSON элемент.

```tsx
import { useDeleteJsonData } from '@react-client/hooks';

const DeleteButton = ({ id }: { id: string }) => {
  const deleteMutation = useDeleteJsonData();
  
  const handleDelete = async () => {
    if (window.confirm('Удалить элемент?')) {
      try {
        await deleteMutation.mutateAsync(id);
        console.log('Элемент удален');
      } catch (error) {
        console.error('Ошибка удаления:', error);
      }
    }
  };
  
  return (
    <button 
      onClick={handleDelete}
      disabled={deleteMutation.isPending}
    >
      {deleteMutation.isPending ? 'Удаление...' : 'Удалить'}
    </button>
  );
};
```

## Вспомогательные Hooks

### `useJsonDataActions()`
Предоставляет удобные методы для всех CRUD операций.

```tsx
import { useJsonDataActions } from '@react-client/hooks';

const ActionsExample = () => {
  const {
    createItem,
    updateItem,
    deleteItem,
    isCreating,
    isUpdating,
    isDeleting,
    createError,
    updateError,
    deleteError
  } = useJsonDataActions();
  
  const handleCreate = () => createItem({ data: { example: 'data' } });
  const handleUpdate = (id: string) => updateItem(id, { data: { updated: true } });
  const handleDelete = (id: string) => deleteItem(id);
  
  return (
    <div>
      <button onClick={handleCreate} disabled={isCreating}>
        Создать
      </button>
      {/* Другие кнопки... */}
    </div>
  );
};
```

### `useJsonDataManager(id?)`
Комбинированный hook для управления данными.

```tsx
import { useJsonDataManager } from '@react-client/hooks';

const DataManager = ({ selectedId }: { selectedId?: string }) => {
  const {
    list,
    item,
    isLoadingList,
    isLoadingItem,
    createItem,
    updateItem,
    deleteItem,
    refreshList,
    refreshItem
  } = useJsonDataManager(selectedId);
  
  return (
    <div>
      <button onClick={refreshList}>Обновить список</button>
      {/* Отображение данных... */}
    </div>
  );
};
```

### `useJsonDataSearch(searchTerm?)`
Поиск по JSON элементам.

```tsx
import { useJsonDataSearch } from '@react-client/hooks';
import { useState } from 'react';

const SearchableList = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const { 
    data: filteredItems, 
    totalCount, 
    filteredCount,
    isLoading 
  } = useJsonDataSearch(searchTerm);
  
  return (
    <div>
      <input 
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder="Поиск..."
      />
      <p>Показано {filteredCount} из {totalCount}</p>
      {filteredItems.map(item => (
        <div key={item.id}>{JSON.stringify(item.data)}</div>
      ))}
    </div>
  );
};
```

## Типы

```tsx
interface JsonDataItem {
  id: string;
  data: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

interface CreateJsonDataRequest {
  data: Record<string, any>;
}

interface UpdateJsonDataRequest {
  data: Record<string, any>;
}
```

## Конфигурация

Базовый URL API настраивается через переменную окружения:
```
REACT_APP_API_URL=http://localhost:3000
```

По умолчанию используется `http://localhost:3000`.

## Кэширование

Все hooks используют React Query для кэширования:
- Время жизни кэша: 5 минут
- Время актуальности: 5 минут
- Автоматическая инвалидация при мутациях
- Оптимистичные обновления для лучшего UX

## Пример полного компонента

См. `JsonDataManager.tsx` для полного примера использования всех hooks в реальном компоненте.