import { Controller, Get } from "@nestjs/common";
import type { HomeService } from "./service";

@Controller()
export class HomeController {
	constructor(private readonly homeService: HomeService) {}

	@Get()
	getHello(): string {
		return this.homeService.getHello();
	}
}
