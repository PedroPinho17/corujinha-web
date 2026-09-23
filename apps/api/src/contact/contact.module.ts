import { Module } from "@nestjs/common";
import { BullModule } from "@nestjs/bullmq";
import { ContactController } from "./contact.controller";
import { ContactProcessor, CONTACT_QUEUE } from "./contact.processor";

@Module({
  imports: [BullModule.registerQueue({ name: CONTACT_QUEUE })],
  controllers: [ContactController],
  providers: [ContactProcessor],
})
export class ContactModule {}
