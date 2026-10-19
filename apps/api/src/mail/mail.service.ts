import { Injectable } from "@nestjs/common";
import { sendMail, type SendMailOpts } from "./send-mail";

@Injectable()
export class MailService {
  async send(opts: SendMailOpts) {
    await sendMail(opts);
  }
}
