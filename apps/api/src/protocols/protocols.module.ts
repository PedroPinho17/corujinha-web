import { Module } from "@nestjs/common";
import { ProtocolsController } from "./protocols.controller";

@Module({ controllers: [ProtocolsController] })
export class ProtocolsModule {}
