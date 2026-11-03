import {
  BeforeInsert,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryColumn,
  UpdateDateColumn,
} from "typeorm";
import { newId } from "../cuid";
import { GalleryImage } from "./gallery-image.entity";

@Entity({ name: "Center" })
@Index(["published", "sortOrder"])
export class Center {
  @PrimaryColumn("text")
  id!: string;

  @Column("text", { unique: true })
  slug!: string;

  @Column("text")
  name!: string;

  @Column("text", { nullable: true })
  shortName!: string | null;

  @Column("text", { nullable: true })
  address!: string | null;

  @Column("text", { nullable: true })
  city!: string | null;

  @Column("text", { nullable: true })
  postalCode!: string | null;

  @Column("text", { nullable: true })
  phone!: string | null;

  @Column("text", { nullable: true })
  email!: string | null;

  @Column("boolean", { default: false })
  isPrimary!: boolean;

  @Column("int", { default: 0 })
  sortOrder!: number;

  @Column("boolean", { default: true })
  published!: boolean;

  @CreateDateColumn({ type: "timestamp" })
  createdAt!: Date;

  @UpdateDateColumn({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
  updatedAt!: Date;

  @OneToMany(() => GalleryImage, (g) => g.center)
  gallery!: GalleryImage[];

  @BeforeInsert()
  assignId() {
    if (!this.id) this.id = newId();
  }
}
