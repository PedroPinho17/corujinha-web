import {
  BeforeInsert,
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryColumn,
  UpdateDateColumn,
} from "typeorm";
import { newId } from "../cuid";
import { UserRole } from "../enums";
import { Account } from "./account.entity";
import { Passkey } from "./passkey.entity";
import { Session } from "./session.entity";

@Entity({ name: "user" })
export class User {
  @PrimaryColumn("text")
  id!: string;

  @Column("text")
  name!: string;

  @Column("text", { unique: true })
  email!: string;

  @Column("boolean", { default: false })
  emailVerified!: boolean;

  @Column("text", { nullable: true })
  image!: string | null;

  @Column({ type: "enum", enum: UserRole, enumName: "UserRole", default: UserRole.EDITOR })
  role!: UserRole;

  @Column("boolean", { default: false })
  mustChangePassword!: boolean;

  @CreateDateColumn({ type: "timestamp" })
  createdAt!: Date;

  @UpdateDateColumn({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
  updatedAt!: Date;

  @OneToMany(() => Session, (s) => s.user)
  sessions!: Session[];

  @OneToMany(() => Account, (a) => a.user)
  accounts!: Account[];

  @OneToMany(() => Passkey, (p) => p.user)
  passkeys!: Passkey[];

  @BeforeInsert()
  assignId() {
    if (!this.id) this.id = newId();
  }
}
