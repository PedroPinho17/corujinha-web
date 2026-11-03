import {
  BeforeInsert,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
} from "typeorm";
import { newId } from "../cuid";
import { User } from "./user.entity";

@Entity({ name: "passkey" })
export class Passkey {
  @PrimaryColumn("text")
  id!: string;

  @Column("text", { nullable: true })
  name!: string | null;

  @Column("text")
  publicKey!: string;

  @Index()
  @Column("text")
  userId!: string;

  @ManyToOne(() => User, (u) => u.passkeys, { onDelete: "CASCADE" })
  @JoinColumn({ name: "userId" })
  user!: User;

  @Column("text")
  credentialID!: string;

  @Column("int")
  counter!: number;

  @Column("text")
  deviceType!: string;

  @Column("boolean")
  backedUp!: boolean;

  @Column("text", { nullable: true })
  transports!: string | null;

  @CreateDateColumn({ type: "timestamp", nullable: true })
  createdAt!: Date | null;

  @Column("text", { nullable: true })
  aaguid!: string | null;

  @BeforeInsert()
  assignId() {
    if (!this.id) this.id = newId();
  }
}
