import { init as dbInit } from "@react-client/features/json4u/lib/db/config";
import { setupGlobalGraphStyle } from "@react-client/features/json4u/lib/graph/layout";

import * as Comlink from "comlink";
import { compareText, compareTree } from "./command/compare";
import { csv2json, json2csv } from "./command/csv";
import { escapeStr, unescapeStr } from "./command/escape";
import { jsonPath } from "./command/jsonPath";
import { parseAndFormat } from "./command/parse";
import { pythonDictToJSON } from "./command/pythonDictToJSON";
import { urlToJSON } from "./command/urlToJSON";
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
