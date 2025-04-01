import { memo } from "react";
import type { AudioSrc } from "../types/media-src.type";
import { MIMETypeAndSize } from "./MIMETypeAndSize";
import { MediaViewerBox } from "./MediaViewerBox";

type Props = {
	audioSrc: AudioSrc;
};

const _AudioViewer = ({ audioSrc }: Props) => {
	return (
		<MediaViewerBox>
			<audio
				className="block w-full"
				controls
				preload="metadata"
				src={audioSrc}
			/>
			<MIMETypeAndSize mediaSrc={audioSrc} />
		</MediaViewerBox>
	);
};

export const AudioViewer = memo(_AudioViewer);
