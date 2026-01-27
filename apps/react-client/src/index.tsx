import ReactDOM from "react-dom/client";

import { App } from "./App";

import { reportWebVitals } from "./reportWebVitals";
import { AuthProvider } from "@react-client/common/AuthProvider";
import { globalStyles } from "@react-client/theme/GlobalStyle";

(window as any).urlConfig = {
	SUM_FRONTEND: "http://test.host:8002/test",
	SUM_API: "https://test.host",
	SMART_ANKETA_FRONTEND: "http://test.host:8004",
	SMART_ANKETA_API: "http://test.host:8004",
	DATA_LINEAGE_API: "http://localhost:3000",
	//DATA_LINEAGE_API: "https://data-lineage-api-sumd.sumd.dk1-sumd01.innodev.local",
	SUM_RM_API: "https://test.host/api/rest/v1",
	KEYCLOAK_URL: "https://test.host/auth",
};

const root = ReactDOM.createRoot(
	document.getElementById("root") as HTMLElement,
);

root.render(
	<AuthProvider token={"test-token"}>
		{globalStyles}
		<App />
	</AuthProvider>,
);

reportWebVitals(console.log);
