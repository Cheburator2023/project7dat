# Skeleton loaders (common)

Папка: `apps/react-client/src/common/skeleton`

Цель: дать единый набор скелетонов для типовых layout-ов (dockview, ag-grid, карточки/списки) и **без прыжков** переключать `loading -> content`.

## Быстрый старт

1. Выбери подходящий скелетон-организм:

- `DockviewPanelsSkeleton`
- `AgGridLikeSkeleton`
- `PageCardsSkeleton`

2. Используй **единый** `SkeletonFade` (switch-компонент), чтобы скелетон и контент были в одном контейнере и не дергали layout.

## `SkeletonFade` (главный компонент)

Файл: `atoms/SkeletonFade.tsx`

### API

- `loading: boolean`
- `skeleton: React.ReactNode`
- `children: React.ReactNode`
- `exitDelayMs?: number` (по умолчанию `180`)
- `transitionMs?: number` (по умолчанию `160`)

### Почему именно так

- Один компонент рендерит **и skeleton и content**, накладывая их друг на друга (overlay через grid).
- Это убирает ситуацию, когда два соседних враппера меняют высоту/позиционирование и появляется «прыжок».

### Пример (универсальный)

```tsx
import { SkeletonFade } from "@react-client/common/skeleton/atoms/SkeletonFade";

// skeleton — любой JSX
<SkeletonFade loading={isLoading} skeleton={<YourSkeleton />}>
	<YourRealContent />
</SkeletonFade>;
```

## Dockview layout

### Пример

```tsx
import { SkeletonFade } from "@react-client/common/skeleton/atoms/SkeletonFade";
import { DockviewPanelsSkeleton } from "@react-client/common/skeleton/organisms/DockviewPanelsSkeleton";

<SkeletonFade
	loading={isLoading}
	skeleton={<DockviewPanelsSkeleton panels={2} />}
>
	<DockviewReact /* ... */ />
</SkeletonFade>;
```

## Ag-grid layout

### Пример

```tsx
import { SkeletonFade } from "@react-client/common/skeleton/atoms/SkeletonFade";
import { AgGridLikeSkeleton } from "@react-client/common/skeleton/organisms/AgGridLikeSkeleton";

<SkeletonFade
	loading={isLoading}
	skeleton={<AgGridLikeSkeleton rows={12} columns={6} />}
>
	<AgGridReact /* ... */ />
</SkeletonFade>;
```

## Карточки / списки

### Пример (карточки)

```tsx
import { SkeletonFade } from "@react-client/common/skeleton/atoms/SkeletonFade";
import { PageCardsSkeleton } from "@react-client/common/skeleton/organisms/PageCardsSkeleton";

<SkeletonFade loading={isLoading} skeleton={<PageCardsSkeleton cards={6} />}>
	<CardsGrid />
</SkeletonFade>;
```

### Пример (список)

```tsx
import { SkeletonFade } from "@react-client/common/skeleton/atoms/SkeletonFade";
import { SkeletonList } from "@react-client/common/skeleton/molecules/SkeletonList";

<SkeletonFade
	loading={isLoading}
	skeleton={<SkeletonList rows={10} rowHeight={18} showLeadingIcon={true} />}
>
	<YourList />
</SkeletonFade>;
```

## `SkeletonBlock`

Файл: `atoms/SkeletonBlock.tsx`

- Базовый «шимерный» блок.
- Уважает `prefers-reduced-motion`.

### API

- `width?: number | string`
- `height?: number | string`
- `borderRadius?: number | string`
- `tint?: "default" | "subtle"`
- `sx?: SxProps<Theme>`
- `data-testid?: string`

## Data-testid

Компоненты в папке уже имеют базовые `data-testid` на корневых врапперах.

Если нужно адресно тестировать конкретные блоки — используй `data-testid` у `SkeletonBlock`.

Пример:

```tsx
import { SkeletonBlock } from "@react-client/common/skeleton/atoms/SkeletonBlock";

<SkeletonBlock data-testid="my-skeleton-title" height={20} width="40%" />;
```
