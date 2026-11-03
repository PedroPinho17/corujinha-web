import {
  BeforeInsert,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryColumn,
  UpdateDateColumn,
} from "typeorm";
import { newId } from "../cuid";
import { ContactKind, ContactStatus } from "../enums";

@Entity({ name: "ContactMessage" })
@Index(["status", "createdAt"])
@Index(["readAt", "createdAt"])
@Index(["kind", "createdAt"])
@Index(["erasedAt"])
export class ContactMessage {
  @PrimaryColumn("text")
  id!: string;

  @Column("text")
  name!: string;

  @Column("text")
  email!: string;

  @Column("text", { nullable: true })
  phone!: string | null;

  @Column("text")
  message!: string;

  @Column({ type: "enum", enum: ContactKind, enumName: "ContactKind", default: ContactKind.GENERAL })
  kind!: ContactKind;

  @Column("text", { nullable: true })
  subject!: string | null;

  @Column("text", { nullable: true })
  schoolYear!: string | null;

  @Column("text", { nullable: true })
  location!: string | null;

  @Column({
    type: "enum",
    enum: ContactStatus,
    enumName: "ContactStatus",
    default: ContactStatus.NEW,
  })
  status!: ContactStatus;

  @Column("timestamp", { nullable: true })
  readAt!: Date | null;

  @Column("text", { nullable: true })
  adminNotes!: string | null;

  @Column("boolean", { default: false })
  privacyConsent!: boolean;

  @Column("timestamp", { nullable: true })
  consentAt!: Date | null;

  @Column("timestamp", { nullable: true })
  erasedAt!: Date | null;

  @CreateDateColumn({ type: "timestamp" })
  createdAt!: Date;

  @UpdateDateColumn({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
  updatedAt!: Date;

  @BeforeInsert()
  assignId() {
    if (!this.id) this.id = newId();
  }
}
