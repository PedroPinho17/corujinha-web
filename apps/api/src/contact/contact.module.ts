import { Module } from "@nestjs/common";
import { BullModule } from "@nestjs/bullmq";
import { ContactController } from "./contact.controller";
import { ContactRetentionScheduler } from "./contact-retention.scheduler";
import { CONTACT_QUEUE } from "@corujinha/shared";
import { ContactProcessor } from "./contact.processor";
import { ContactService } from "./contact.service";

@Module({
  imports: [BullModule.registerQueue({ name: CONTACT_QUEUE })],
  controllers: [ContactController],
  providers: [ContactProcessor, ContactService, ContactRetentionScheduler],
})
export class ContactModule {}
