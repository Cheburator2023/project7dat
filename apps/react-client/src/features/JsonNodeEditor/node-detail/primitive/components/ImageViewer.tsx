import { Image } from "@nextui-org/image";
import { memo } from "react";
import { openLinkAsNewTab } from "../../../utils/window.util";
import type { ImageSrc } from "../types/media-src.type";
import { MIMETypeAndSize } from "./MIMETypeAndSize";
import { MediaViewerBox } from "./MediaViewerBox";

type Props = {
	imageSrc: ImageSrc;
};

const _ImageViewer = ({ imageSrc }: Props) => {
	return (
		<MediaViewerBox>
			<Image
				className="mx-auto block h-[120px] w-auto cursor-pointer"
				removeWrapper
				radius="none"
				shadow="sm"
				src={imageSrc}
				alt="image preview"
				onClick={() => openLinkAsNewTab(imageSrc)}
			/>
			<MIMETypeAndSize mediaSrc={imageSrc} />
		</MediaViewerBox>
	);
};

export const ImageViewer = memo(_ImageViewer);
