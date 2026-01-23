import { ApiProperty } from "@nestjs/swagger";

export class S2tConvertToCommitResponseDto {
	@ApiProperty({
		description: "Conversion metadata",
		example: {
			fileName: "prod_dm_dadm_pvr.pd_mb_behaviour_online.xlsx",
			generatedAt: "2024-01-23T12:00:00.000Z",
		},
	})
	meta!: {
		fileName?: string;
		generatedAt: string;
	};

	@ApiProperty({
		description: "Commit JSON in DataLineageSchema format",
		example: {
			desc: {
				appId: "PD MB Behaviour Online",
				appName: "PD MB Behaviour Online",
			},
			entities: [],
			mappings: [],
			failedMappings: [],
		},
	})
	commitJson!: {
		desc: {
			appId: string;
			appName: string;
		};
		entities: Array<any>;
		mappings: Array<any>;
		failedMappings: Array<any>;
	};
}
