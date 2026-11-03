import { z } from "zod";

/** Payload do job "send" na fila contact-email. */
export const contactEmailJobSchema = z.object({
  contactId: z.string().min(1),
});

export type ContactEmailJob = z.infer<typeof contactEmailJobSchema>;

/** Payload do job de email de auth (reset password, etc.). */
export const authEmailJobSchema = z.object({
  to: z.string().email(),
  subject: z.string().min(1),
  text: z.string().min(1),
  html: z.string().optional(),
});

export type AuthEmailJob = z.infer<typeof authEmailJobSchema>;