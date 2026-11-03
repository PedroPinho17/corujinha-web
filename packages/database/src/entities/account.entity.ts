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

@Entity({ name: "account" })
export class Account {
  @PrimaryColumn("text")
  id!: string;

  @Column("text")
  accountId!: string;

  @Column("text")
  providerId!: string;

  @Index()
  @Column("text")
  userId!: string;

  @ManyToOne(() => User, (u) => u.accounts, { onDelete: "CASCADE" })
  @JoinColumn({ name: "userId" })
  user!: User;

  @Column("text", { nullable: true })
  accessToken!: string | null;

  @Column("text", { nullable: true })
  refreshToken!: string | null;

  @Column("text", { nullable: true })
  idToken!: string | null;

  @Column("timestamp", { nullable: true })
  accessTokenExpiresAt!: Date | null;

  @Column("timestamp", { nullable: true })
  refreshTokenExpiresAt!: Date | null;

  @Column("text", { nullable: true })
  scope!: string | null;

  @Column("text", { nullable: true })
  password!: string | null;

  @CreateDateColumn({ type: "timestamp" })
  createdAt!: Date;

  @UpdateDateColumn({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
  updatedAt!: Date;

  @BeforeInsert()
  assignId() {
    if (!this.id) this.id = newId();
  }
}
