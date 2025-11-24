# NodeGraph Component Refactor

## Проблемы, которые были исправлены

### 1. Сброс данных нод
**Проблема:** Компонент использовал `useEffect` с зависимостями от `initialNodes` и `initialEdges`, что вызывало полный пересчет состояния при каждом изменении. Это приводило к потере внутреннего состояния нод и некорректному поведению.

**Решение:** Удалены проблемные `useEffect` хуки. Теперь `useNodesState` и `useEdgesState` управляют состоянием самостоятельно, а `initialNodes` и `initialEdges` используются только для начальной инициализации.

### 2. Отсутствие разворачивания child нод
**Проблема:** В компоненте не было механизма для показа/скрытия дочерних узлов при клике.

**Решение:** 
- Добавлено состояние `expandedNodes` (Set<string>) для отслеживания развернутых узлов
- Реализована функция `toggleNodeExpansion` для переключения состояния
- Добавлена логика `visibleEntityIds` для вычисления видимых узлов на основе состояния разворачивания
- Обновлен обработчик клика: двойной клик или Ctrl+Click разворачивает/сворачивает узел

## Ключевые изменения

### NodeGraph.tsx

#### 1. Управление состоянием разворачивания
```typescript
const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

const toggleNodeExpansion = useCallback((nodeId: string) => {
  setExpandedNodes(prev => {
    const next = new Set(prev);
    if (next.has(nodeId)) {
      next.delete(nodeId);
    } else {
      next.add(nodeId);
    }
    return next;
  });
}, []);
```

#### 2. Вычисление видимых узлов
```typescript
const visibleEntityIds = useMemo(() => {
  // Находим корневые узлы (не являющиеся зависимостями других)
  // Рекурсивно добавляем дочерние узлы для развернутых родителей
  // Возвращаем Set видимых ID
}, [currentGraph?.entities, currentGraph?.mappings, expandedNodes, getChildEntityIds]);
```

#### 3. Фильтрация узлов и ребер
- Узлы фильтруются по `visibleEntityIds`
- Ребра создаются только между видимыми узлами
- Оптимизированы зависимости `useMemo` для предотвращения лишних пересчетов

#### 4. Обработка кликов
```typescript
const handleNodeClick = useCallback((event: React.MouseEvent, node: FlowNode) => {
  clearSearchHl(node.id);
  selectNode(node.id);
  
  // Разворачивание при двойном клике или Ctrl+Click
  if (node.data?.hasChildren) {
    if (event.detail === 2 || event.ctrlKey || event.metaKey) {
      toggleNodeExpansion(node.id);
    }
  }
}, [clearSearchHl, selectNode, toggleNodeExpansion]);
```

### DataLineageNode.tsx

#### Визуальный индикатор разворачивания
Добавлен индикатор "+" / "−" в заголовке узла для узлов с дочерними элементами:

```typescript
{hasChildren && (
  <Box
    sx={{
      position: "absolute",
      right: 4,
      top: 2,
      fontSize: "12px",
      fontWeight: "bold",
      color: "white",
      cursor: "pointer",
      userSelect: "none",
    }}
    title={isExpanded ? "Свернуть (Ctrl+Click или двойной клик)" : "Развернуть (Ctrl+Click или двойной клик)"}
  >
    {isExpanded ? "−" : "+"}
  </Box>
)}
```

## Как использовать

1. **Просмотр графа:** По умолчанию отображаются только корневые узлы
2. **Разворачивание узла:** 
   - Двойной клик на узле с дочерними элементами
   - Ctrl+Click (Cmd+Click на Mac) на узле
3. **Сворачивание узла:** Повторить действие на развернутом узле
4. **Визуальная индикация:** Узлы с дочерними элементами имеют индикатор "+" (свернут) или "−" (развернут)

## Преимущества

1. **Стабильность:** Нет сброса состояния нод при обновлениях
2. **Производительность:** Отображаются только видимые узлы и ребра
3. **Удобство:** Интуитивное разворачивание через двойной клик или Ctrl+Click
4. **Масштабируемость:** Работает с большими графами благодаря ленивой загрузке узлов

## Технические детали

- Используется `Set<string>` для эффективного хранения развернутых узлов
- Алгоритм обхода графа для вычисления видимых узлов (BFS-подобный)
- Оптимизированные зависимости `useMemo` для минимизации пересчетов
- Исправлены lint ошибки (forEach не должен возвращать значения)
