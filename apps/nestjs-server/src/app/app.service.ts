import { Injectable } from "@nestjs/common";

@Injectable()
export class AppService {
	getHello(): string {
		return "Data Lineage API сервер запущен! Документация доступна по адресу /api";
	}
}
