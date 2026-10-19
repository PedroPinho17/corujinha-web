import { Module } from "@nestjs/common";
import { CentersController } from "./centers.controller";

@Module({ controllers: [CentersController] })
export class CentersModule {}
