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

@Entity({ name: "SchoolProtocol" })
@Index(["active", "sortOrder"])
export class SchoolProtocol {
  @PrimaryColumn("text")
  id!: string;

  @Column("text")
  schoolName!: string;

  @Column("text", { nullable: true })
  link!: string | null;

  @Column("text", { nullable: true })
  description!: string | null;

  @Column("text", { nullable: true })
  documentKey!: string | null;

  @Column("int", { default: 0 })
  sortOrder!: number;

  @Column("boolean", { default: true })
  active!: boolean;

  @CreateDateColumn({ type: "timestamp" })
  createdAt!: Date;

  @UpdateDateColumn({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
  updatedAt!: Date;

  @BeforeInsert()
  assignId() {
    if (!this.id) this.id = newId();
  }
}
