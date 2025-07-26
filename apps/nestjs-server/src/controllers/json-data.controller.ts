import {
	Controller,
	Post,
	Get,
	Put,
	Delete,
	Body,
	Param,
	Query,
} from "@nestjs/common";
import { JsonDataService } from "../services/json-data.service";
import {
	CreateJsonDataInput,
	UpdateJsonDataInput,
	GetJsonDataListInput,
} from "../schemas/json-data.schema";

@Controller("api/json-data")
export class JsonDataController {
	constructor(private readonly jsonDataService: JsonDataService) {}

	@Post()
	async create(@Body() createJsonDataDto: CreateJsonDataInput) {
		return await this.jsonDataService.create(createJsonDataDto);
	}

	@Get()
	async findAll(@Query() query: GetJsonDataListInput) {
		return await this.jsonDataService.findAll(query);
	}

	@Get(":id")
	async findOne(@Param("id") id: string) {
		return await this.jsonDataService.findOne(id);
	}

	@Put(":id")
	async update(
		@Param("id") id: string,
		@Body() updateJsonDataDto: UpdateJsonDataInput,
	) {
		return await this.jsonDataService.update(id, updateJsonDataDto);
	}

	@Delete(":id")
	async remove(@Param("id") id: string) {
		await this.jsonDataService.remove(id);
		return { success: true };
	}
}
