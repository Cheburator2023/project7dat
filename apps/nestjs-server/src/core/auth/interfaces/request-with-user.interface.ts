import { JwtPayload } from "./jwt-payload.interface";
import { Request } from "express";

export interface RequestWithUser extends Request {
	user?: JwtPayload;
}
