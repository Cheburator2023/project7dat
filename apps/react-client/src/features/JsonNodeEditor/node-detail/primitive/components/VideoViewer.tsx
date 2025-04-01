import { memo } from "react";
import type { VideoSrc } from "../types/media-src.type";
import { MIMETypeAndSize } from "./MIMETypeAndSize";
import { MediaViewerBox } from "./MediaViewerBox";

type Props = {
	videoSrc: VideoSrc;
};

const _VideoViewer = ({ videoSrc }: Props) => {
	return (
		<MediaViewerBox>
			<video
				controlsList="nodownload"
				className="block w-full"
				controls
				preload="metadata"
				src={videoSrc}
			/>
			<MIMETypeAndSize mediaSrc={videoSrc} />
		</MediaViewerBox>
	);
};

export const VideoViewer = memo(_VideoViewer);
