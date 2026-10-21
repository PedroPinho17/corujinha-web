import { InjectQueue } from "@nestjs/bullmq";
import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { Queue } from "bullmq";
import { CONTACT_QUEUE, CONTACT_RETENTION_JOB } from "./contact.processor";

/**
 * Schedules daily GDPR retention anonymization via BullMQ repeatable job.
 * Fixed jobId keeps a single schedule across API restarts / replicas.
 */
@Injectable()
export class ContactRetentionScheduler implements OnModuleInit {
  private readonly logger = new Logger(ContactRetentionScheduler.name);

  constructor(@InjectQueue(CONTACT_QUEUE) private readonly queue: Queue) {}

  async onModuleInit() {
    try {
      await this.queue.add(
        CONTACT_RETENTION_JOB,
        {},
        {
          jobId: "contact-gdpr-retention-daily",
          repeat: { pattern: "0 4 * * *" },
          removeOnComplete: 20,
          removeOnFail: 50,
        },
      );
      this.logger.log("Scheduled daily contact GDPR retention (04:00)");
    } catch (err) {
      this.logger.warn(`Could not schedule contact GDPR retention: ${String(err)}`);
    }
  }
}
