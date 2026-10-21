import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { ContactService } from "./contact.service";

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Runs GDPR contact anonymization shortly after boot, then about once a day.
 * Idempotent — safe across API restarts / replicas.
 */
@Injectable()
export class ContactRetentionScheduler implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ContactRetentionScheduler.name);
  private timer?: ReturnType<typeof setInterval>;
  private bootTimer?: ReturnType<typeof setTimeout>;

  constructor(private readonly contacts: ContactService) {}

  onModuleInit() {
    // Delay first run so migrations / healthchecks finish.
    this.bootTimer = setTimeout(() => void this.run(), 60_000);
    this.timer = setInterval(() => void this.run(), DAY_MS);
    this.logger.log("Contact GDPR retention scheduled (daily)");
  }

  onModuleDestroy() {
    if (this.bootTimer) clearTimeout(this.bootTimer);
    if (this.timer) clearInterval(this.timer);
  }

  private async run() {
    try {
      const result = await this.contacts.eraseExpired();
      if (result.erased > 0) {
        this.logger.log(
          `GDPR retention: erased ${result.erased} (cutoff ${result.cutoff}, ${result.retentionMonths} months)`,
        );
      }
    } catch (err) {
      this.logger.warn(`Contact GDPR retention failed: ${String(err)}`);
    }
  }
}
