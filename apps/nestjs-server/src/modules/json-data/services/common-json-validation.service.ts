import { Injectable, Logger } from "@nestjs/common";
import { ValidationReport } from "../types/validation.types";
import { JsonValidationOrchestratorService } from "./json-validation-orchestrator.service";

@Injectable()
export class CommonJsonValidationService {
    private readonly logger = new Logger(CommonJsonValidationService.name);

    constructor(
        private readonly validationOrchestrator: JsonValidationOrchestratorService,
    ) {}

    async performCommonValidation(data: any): Promise<ValidationReport> {
        this.logger.log("Выполнение общей валидации JSON");
        return this.validationOrchestrator.generateValidationReport(data);
    }

    async performComprehensiveValidation(data: any): Promise<any> {
        this.logger.log("Выполнение комплексной валидации JSON");
        return this.validationOrchestrator.validate(data);
    }
}
