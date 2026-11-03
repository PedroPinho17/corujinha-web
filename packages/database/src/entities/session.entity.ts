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
import { User } from "./user.entity";

@Entity({ name: "session" })
export class Session {
  @PrimaryColumn("text")
  id!: string;

  @Column("timestamp")
  expiresAt!: Date;

  @Column("text", { unique: true })
  token!: string;

  @CreateDateColumn({ type: "timestamp" })
  createdAt!: Date;

  @UpdateDateColumn({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
  updatedAt!: Date;

  @Column("text", { nullable: true })
  ipAddress!: string | null;

  @Column("text", { nullable: true })
  userAgent!: string | null;

  @Index()
  @Column("text")
  userId!: string;

  @ManyToOne(() => User, (u) => u.sessions, { onDelete: "CASCADE" })
  @JoinColumn({ name: "userId" })
  user!: User;

  @BeforeInsert()
  assignId() {
    if (!this.id) this.id = newId();
  }
}
