import { Module } from "@nestjs/common";
import { FormationsController } from "./formations.controller";

@Module({ controllers: [FormationsController] })
export class FormationsModule {}
