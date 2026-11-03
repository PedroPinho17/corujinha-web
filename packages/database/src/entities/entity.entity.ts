import {
  BeforeInsert,
  Column,
  CreateDateColumn,
  Entity as TypeOrmEntity,
  Index,
  OneToMany,
  PrimaryColumn,
  UpdateDateColumn,
} from "typeorm";
import { newId } from "../cuid";
import { Formation } from "./formation.entity";

@TypeOrmEntity({ name: "Entity" })
@Index(["published", "sortOrder"])
export class Entity {
  @PrimaryColumn("text")
  id!: string;

  @Column("int", { default: 0 })
  sortOrder!: number;

  @Column("text")
  name!: string;

  @Column("text", { nullable: true })
  description!: string | null;

  @Column("text", { nullable: true })
  location!: string | null;

  @Column("text", { nullable: true })
  website!: string | null;

  @Column("jsonb", { nullable: true })
  translations!: Record<string, unknown> | null;

  @Column("boolean", { default: true })
  published!: boolean;

  @CreateDateColumn({ type: "timestamp" })
  createdAt!: Date;

  @UpdateDateColumn({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
  updatedAt!: Date;

  @OneToMany(() => Formation, (f) => f.entity)
  formations!: Formation[];

  @BeforeInsert()
  assignId() {
    if (!this.id) this.id = newId();
  }
}
