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

@Entity({ name: "Post" })
@Index(["published", "featured", "sortOrder"])
@Index(["publishedAt"])
export class Post {
  @PrimaryColumn("text")
  id!: string;

  @Column("int", { default: 0 })
  sortOrder!: number;

  @Column("text")
  title!: string;

  @Column("text", { nullable: true })
  content!: string | null;

  @Column("text", { nullable: true })
  link!: string | null;

  @Column("text", { nullable: true })
  phone!: string | null;

  @Column("text", { nullable: true })
  email!: string | null;

  @Column("boolean", { default: false })
  featured!: boolean;

  @Column("text", { nullable: true })
  imageKey!: string | null;

  @Column("jsonb", { nullable: true })
  translations!: Record<string, unknown> | null;

  @Column("boolean", { default: true })
  published!: boolean;

  @Column("timestamp", { nullable: true })
  publishedAt!: Date | null;

  @CreateDateColumn({ type: "timestamp" })
  createdAt!: Date;

  @UpdateDateColumn({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
  updatedAt!: Date;

  @BeforeInsert()
  assignId() {
    if (!this.id) this.id = newId();
  }
}
