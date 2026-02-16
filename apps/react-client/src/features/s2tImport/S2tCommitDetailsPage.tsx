import { Box } from "@mui/material";
import type { FC } from "react";
import { useNavigate, useParams } from "react-router";
import { Header } from "@react-client/common/navigation/organisms/Header";
import { routes } from "@react-client/routing/routes";
import { S2tCommitEditor } from "./S2tCommitEditor";

export const S2tCommitDetailsPage: FC = () => {
	const navigate = useNavigate();
	const params = useParams();
	const commitId = params.id ?? null;

	return (
		<Box>
			<Header />
			<S2tCommitEditor
				active={true}
				prefillCommitId={commitId}
				onSaved={() => navigate(routes.allCommits.rootPath)}
				onOpenNewVersionUpload={() => navigate(routes.s2tCommitCreate.rootPath)}
				onClose={() => navigate(-1)}
				showCloseButton={false}
			/>
		</Box>
	);
};
