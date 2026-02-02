import ReactDOM from "react-dom/client";

import { reportWebVitals } from "./reportWebVitals";
import { AuthProvider } from "@react-client/common/AuthProvider";
import { globalStyles } from "@react-client/theme/GlobalStyle";
import { useEffect, useState } from "react";
import { App } from "./App";
import { FullScreenLoader } from "@react-client/common/muiCustom/FullScreenLoader";

const root = ReactDOM.createRoot(
	document.getElementById("root") as HTMLElement,
);

const RenderApp = () => {
	const [urlConfig, setUrlConfig] = useState<any>();

	useEffect(() => {
		setTimeout(() => {
			setUrlConfig((window as any).urlConfig);
		}, 1000);
	}, []);

	return urlConfig?.SUM_FRONTEND ? (
		<AuthProvider token={"test-token"}>
			{globalStyles}
			<App />
		</AuthProvider>
	) : (
		<FullScreenLoader />
	);
};

root.render(<RenderApp />);

reportWebVitals(console.log);
