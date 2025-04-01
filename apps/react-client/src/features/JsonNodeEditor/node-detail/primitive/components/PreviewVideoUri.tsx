import { memo } from "react";
import type { HttpUri } from "../types/http-uri.type";
import { UriTable } from "./UriTable";
import { VideoViewer } from "./VideoViewer";

type Props = {
	videoUri: HttpUri;
};

const _PreviewVideoUri = ({ videoUri }: Props) => {
	return (
		<>
			<VideoViewer videoSrc={videoUri} />
			<UriTable httpUri={videoUri} />
		</>
	);
};

export const PreviewVideoUri = memo(_PreviewVideoUri);
