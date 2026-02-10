import {
	Entity,
	PrimaryGeneratedColumn,
	Column,
	ManyToOne,
	JoinColumn,
} from "typeorm";
import { ChangeEntity } from "./change.entity";
import { EntityEntity } from "./entity.entity";

@Entity("entity_map")
export class EntityMapEntity {
	@PrimaryGeneratedColumn()
	entity_map_id: number;

	@Column()
	entity_id: number;

	@Column({ type: "varchar", nullable: true })
	description: string;

	@Column({ nullable: true })
	process_id: number;

	@Column()
	change_id: number;

	@ManyToOne(() => ChangeEntity)
	@JoinColumn({ name: "change_id" })
	change: ChangeEntity;

	@ManyToOne(() => EntityEntity)
	@JoinColumn({ name: "entity_id" })
	entity: EntityEntity;
}
