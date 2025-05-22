import { init as dbInit } from "@react-client/features/json4u/lib/db/config";
import { setupGlobalGraphStyle } from "@react-client/features/json4u/lib/graph/layout";

import * as Comlink from "comlink";

import { compareText } from "@react-client/features/json4u/lib/compare";
import {
	escapeStr,
	unescapeStr,
} from "@react-client/features/json4u/lib/idgen";
import { compareTree } from "@react-client/features/json4u/lib/worker/command/compare";
import {
	csv2json,
	json2csv,
} from "@react-client/features/json4u/lib/worker/command/csv";
import { jsonPath } from "@react-client/features/json4u/lib/worker/command/jsonPath";
import { parseAndFormat } from "@react-client/features/json4u/lib/worker/command/parse";
import { pythonDictToJSON } from "@react-client/features/json4u/lib/worker/command/pythonDictToJSON";
import { urlToJSON } from "@react-client/features/json4u/lib/worker/command/urlToJSON";
import {
	clearGraphNodeSelected,
	computeGraphRevealPosition,
	createGraph,
	createTable,
	searchInView,
	setGraphSize,
	setGraphViewport,
	toggleGraphNodeHidden,
	toggleGraphNodeSelected,
	triggerGraphFoldSiblings,
} from "./stores/viewStore";

const worker = {
	parseAndFormat,
	compareText,
	compareTree,
	escapeStr,
	unescapeStr,
	pythonDictToJSON,
	urlToJSON,
	csv2json,
	json2csv,
	jsonPath,
	setupGlobalGraphStyle,
	createTable,
	createGraph,
	setGraphSize,
	setGraphViewport,
	toggleGraphNodeHidden,
	toggleGraphNodeSelected,
	clearGraphNodeSelected,
	triggerGraphFoldSiblings,
	computeGraphRevealPosition,
	searchInView,
};

export type MyWorker = typeof worker;

dbInit();
Comlink.expose(worker);
