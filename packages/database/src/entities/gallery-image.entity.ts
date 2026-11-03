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
import { Center } from "./center.entity";

@Entity({ name: "GalleryImage" })
@Index(["published", "sortOrder"])
@Index(["album"])
export class GalleryImage {
  @PrimaryColumn("text")
  id!: string;

  @Column("text")
  imageKey!: string;

  @Column("text", { nullable: true })
  alt!: string | null;

  @Column("text", { nullable: true })
  album!: string | null;

  @Index()
  @Column("text", { nullable: true })
  centerId!: string | null;

  @ManyToOne(() => Center, (c) => c.gallery, { onDelete: "SET NULL", nullable: true })
  @JoinColumn({ name: "centerId" })
  center!: Center | null;

  @Column("int", { default: 0 })
  sortOrder!: number;

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
