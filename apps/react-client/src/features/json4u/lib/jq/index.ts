// @ts-ignore
import Aioli from "@biowasm/aioli";

let CLI: any = null;

export async function init() {
	CLI = await new Aioli(
		[
			{
				tool: "jq",
				version: "1.7",
				urlPrefix: `${window.location.origin}/jq/1.7`,
			},
		],
		{
			printInterleaved: false,
		},
	);
	console.log("load jq success.");
}

export async function jq(
	text?: string,
	filter?: string,
): Promise<{ output: string; error: string }> {
	if (!CLI) {
		await init();
	}

	const paths: string[] = await CLI.mount([
		{
			name: "text.txt",
			data: text || "",
		},
	]);

	const args = ["--monochrome-output", "--compact-output", filter || ""].concat(
		paths,
	);

	const { stdout, stderr } = await CLI.exec("jq", args);
	return { output: await stdout, error: stderr };
}
