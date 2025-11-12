import ReactDOM from "react-dom/client";

import { App } from "./App";

import { reportWebVitals } from "./reportWebVitals";
import { AuthProvider } from "@react-client/common/AuthProvider";

const root = ReactDOM.createRoot(
	document.getElementById("root") as HTMLElement,
);
root.render(
	<AuthProvider token={"test-token"}>
		<App />
	</AuthProvider>,
);

reportWebVitals(console.log);
