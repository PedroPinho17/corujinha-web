import {
  BeforeInsert,
  Column,
  CreateDateColumn,
  Entity,
  PrimaryColumn,
  UpdateDateColumn,
} from "typeorm";
import { newId } from "../cuid";

@Entity({ name: "SiteSettings" })
export class SiteSettings {
  @PrimaryColumn("text")
  id!: string;

  @Column("text", { default: "Corujinha" })
  brandingName!: string;

  @Column("text", { nullable: true })
  brandingLogoKey!: string | null;

  @Column("text", { nullable: true })
  contactEmail!: string | null;

  @Column("text", { nullable: true })
  contactPhone!: string | null;

  @Column("text", { nullable: true })
  address!: string | null;

  @Column("text", { nullable: true })
  facebookUrl!: string | null;

  @Column("text", { nullable: true })
  instagramUrl!: string | null;

  @Column("jsonb", { nullable: true })
  content!: Record<string, unknown> | null;

  @UpdateDateColumn({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
  updatedAt!: Date;

  @CreateDateColumn({ type: "timestamp" })
  createdAt!: Date;

  @BeforeInsert()
  assignId() {
    if (!this.id) this.id = newId();
  }
}
