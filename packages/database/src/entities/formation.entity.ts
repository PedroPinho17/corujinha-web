import {
  BeforeInsert,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  UpdateDateColumn,
} from "typeorm";
import { newId } from "../cuid";
import { Entity as CmsEntity } from "./entity.entity";

@Entity({ name: "Formation" })
@Index(["active", "sortOrder"])
export class Formation {
  @PrimaryColumn("text")
  id!: string;

  @Column("int", { default: 0 })
  sortOrder!: number;

  @Column("text")
  name!: string;

  @Column("text", { nullable: true })
  description!: string | null;

  @Column("text", { nullable: true })
  duration!: string | null;

  @Column("text", { nullable: true })
  location!: string | null;

  @Index()
  @Column("text", { nullable: true })
  entityId!: string | null;

  @ManyToOne(() => CmsEntity, (e) => e.formations, { onDelete: "SET NULL", nullable: true })
  @JoinColumn({ name: "entityId" })
  entity!: CmsEntity | null;

  @Column("jsonb", { nullable: true })
  translations!: Record<string, unknown> | null;

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
