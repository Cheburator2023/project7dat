import {
	Entity,
	PrimaryGeneratedColumn,
	Column,
	ManyToOne,
	JoinColumn,
} from "typeorm";
import { ChangeEntity } from "./change.entity";

@Entity("failed_mappings")
export class FailedMappingsEntity {
	@PrimaryGeneratedColumn()
	failed_mapping_id: number;

	@Column()
	change_id: number;

	@Column({ type: "varchar" })
	entity_name: string;

	@Column({ type: "text", nullable: true })
	error_description: string;

	@Column({ type: "text", nullable: true })
	unmatched_entities: string;

	@ManyToOne(() => ChangeEntity)
	@JoinColumn({ name: "change_id" })
	change: ChangeEntity;
}
