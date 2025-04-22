import { DragHandleDots2Icon } from "@radix-ui/react-icons";
import * as ResizablePrimitive from "react-resizable-panels";

import { styled } from "@mui/system";
import { Flex } from "@react-client/common/primitives/Flex";
import { cn } from "@react-client/features/json4u/lib/utils";

export const ResizablePanelGroup = ({
	className,
	...props
}: React.ComponentProps<typeof ResizablePrimitive.PanelGroup>) => (
	<ResizablePrimitive.PanelGroup
		className={cn(
			"flex h-full w-full data-[panel-group-direction=vertical]:flex-col",
			className,
		)}
		{...props}
	/>
);

export const ResizablePanel = ResizablePrimitive.Panel;

export const ResizableHandle = ({
	withHandle,
	className,
	...props
}: React.ComponentProps<typeof ResizablePrimitive.PanelResizeHandle> & {
	withHandle?: boolean;
}) => (
	<ResizablePrimitive.PanelResizeHandle {...props}>
		<StyledFlex height="100%" justifyContent="center" alignItems="center">
			{withHandle && (
				<div className="z-10 flex h-4 w-3 items-center justify-center rounded-sm border bg-border">
					<DragHandleDots2Icon className="h-2.5 w-2.5" />
				</div>
			)}
		</StyledFlex>
	</ResizablePrimitive.PanelResizeHandle>
);

const StyledFlex = styled(Flex)`
  background-color: #00000003;
`;
