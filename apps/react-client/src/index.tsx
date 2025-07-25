import "./theme/global.css";
import "@xyflow/react/dist/style.css";
import "@fontsource/inter";
// import "@joint/plus/joint-plus.css";

import { enableMapSet } from "immer";
import React from "react";
import ReactDOM from "react-dom/client";

enableMapSet();
import { App } from "./App";

import { reportWebVitals } from "./reportWebVitals";

const root = ReactDOM.createRoot(
	document.getElementById("root") as HTMLElement,
);
root.render(
	<React.StrictMode>
		<App />
	</React.StrictMode>,
);

reportWebVitals(console.log);
