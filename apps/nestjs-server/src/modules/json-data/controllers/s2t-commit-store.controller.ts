import { Body, Controller, Get, Param, Post, Query } from "@nestjs/common";
import {
	ApiBearerAuth,
	ApiOperation,
	ApiParam,
	ApiQuery,
	ApiResponse,
	ApiTags,
} from "@nestjs/swagger";
import { RealmRole } from "src/core/auth/decorators/realm-role.decorator";
import { Permission } from "src/core/auth/permissions";
import { CreateS2tCommitRequestDto } from "../dto/requests/create-s2t-commit-request.dto";
import { ApplyS2tCommitRequestDto } from "../dto/requests/apply-s2t-commit-request.dto";
import { S2tCommitStoreService } from "../services/s2t-commit-store.service";

@ApiBearerAuth("JWT-auth")
@ApiTags("S2T Commits")
@Controller("s2t-commits")
export class S2tCommitStoreController {
	constructor(private readonly service: S2tCommitStoreService) {}

	@Post()
	@RealmRole(Permission.DL_CREATE_COMMITS)
	@ApiOperation({ summary: "Save S2T commit (original or edited)" })
	@ApiResponse({ status: 201 })
	async createOrUpdate(@Body() body: CreateS2tCommitRequestDto) {
		return await this.service.createOrUpdate(body);
	}

	@Get()
	@RealmRole(Permission.DL_VIEW_COMMITS)
	@ApiOperation({ summary: "List S2T commits" })
	@ApiQuery({ name: "state", required: false })
	@ApiQuery({ name: "type", required: false })
	@ApiResponse({ status: 200 })
	async list(@Query("state") state?: string, @Query("type") type?: string) {
		return await this.service.list({ state, type });
	}

	@Get(":id")
	@RealmRole(Permission.DL_VIEW_COMMITS)
	@ApiOperation({ summary: "Get S2T commit by id" })
	@ApiParam({ name: "id", type: String })
	@ApiResponse({ status: 200 })
	async getById(@Param("id") id: string) {
		return await this.service.findById(id);
	}

	@Post(":id/apply")
	@RealmRole(Permission.DL_UPDATE_COMMITS)
	@ApiOperation({ summary: "Apply/merge S2T commit into DL" })
	@ApiParam({ name: "id", type: String })
	@ApiResponse({ status: 200 })
	async apply(@Param("id") id: string, @Body() body: ApplyS2tCommitRequestDto) {
		return await this.service.applyCommit({
			id,
			user: body.user,
			sourceType: body.sourceType,
		});
	}
}
