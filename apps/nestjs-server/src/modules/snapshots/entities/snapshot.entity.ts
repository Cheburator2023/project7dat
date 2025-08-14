import {
	Entity,
	PrimaryGeneratedColumn,
	Column,
	CreateDateColumn,
} from "typeorm";

@Entity("snapshots")
export class SnapshotEntity {
	@PrimaryGeneratedColumn("uuid")
	id: string;

	@Column({ type: "varchar", length: 255 })
	name: string;

	@Column({ type: "jsonb" })
	data: Record<string, any>;

	@Column({ type: "text", nullable: true })
	description?: string;

	@Column({ type: "varchar", length: 255 })
	sourceDataId: string;

	@Column({ type: "varchar", length: 50, default: "1.0.0" })
	version: string;

	@Column({ type: "jsonb", nullable: true })
	commits?: any[];

	@Column({ type: "varchar", length: 255, nullable: true })
	originalName?: string;

	@Column({ type: "text", nullable: true })
	originalDescription?: string;

	@CreateDateColumn()
	createdAt: Date;
}
