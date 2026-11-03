import {
  BeforeInsert,
  Column,
  CreateDateColumn,
  Entity,
  PrimaryColumn,
  UpdateDateColumn,
} from "typeorm";
import { newId } from "../cuid";

@Entity({ name: "verification" })
export class Verification {
  @PrimaryColumn("text")
  id!: string;

  @Column("text")
  identifier!: string;

  @Column("text")
  value!: string;

  @Column("timestamp")
  expiresAt!: Date;

  @CreateDateColumn({ type: "timestamp" })
  createdAt!: Date;

  @UpdateDateColumn({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
  updatedAt!: Date;

  @BeforeInsert()
  assignId() {
    if (!this.id) this.id = newId();
  }
}
