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

@Entity({ name: "TeamMember" })
@Index(["published", "sortOrder"])
export class TeamMember {
  @PrimaryColumn("text")
  id!: string;

  @Column("int", { default: 0 })
  sortOrder!: number;

  @Column("text")
  name!: string;

  @Column("text", { nullable: true })
  description!: string | null;

  @Column("text", { nullable: true })
  imageKey!: string | null;

  @Column("jsonb", { nullable: true })
  translations!: Record<string, unknown> | null;

  @Column("boolean", { default: true })
  published!: boolean;

  @CreateDateColumn({ type: "timestamp" })
  createdAt!: Date;

  @UpdateDateColumn({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
  updatedAt!: Date;

  @BeforeInsert()
  assignId() {
    if (!this.id) this.id = newId();
  }
}
