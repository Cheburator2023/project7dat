import {
	Entity,
	PrimaryGeneratedColumn,
	Column,
	ManyToOne,
	JoinColumn,
} from "typeorm";
import { ChangeEntity } from "./change.entity";
import { EntityContainerTypeEntity } from "./entity-container-type.entity";
import { SystemsEntity } from "./systems.entity";

@Entity("entity_container")
export class EntityContainerEntity {
	@PrimaryGeneratedColumn()
	entity_container_id: number;

	@Column()
	change_id: number;

	@Column()
	entity_container_type_id: number;

	@Column({ type: "text", nullable: true })
	description: string;

	@Column({ type: "varchar", nullable: true })
	value: string;

	@Column()
	system_id: number;

	@ManyToOne(() => ChangeEntity)
	@JoinColumn({ name: "change_id" })
	change: ChangeEntity;

	@ManyToOne(() => EntityContainerTypeEntity)
	@JoinColumn({ name: "entity_container_type_id" })
	entity_container_type: EntityContainerTypeEntity;

	@ManyToOne(() => SystemsEntity)
	@JoinColumn({ name: "system_id" })
	system: SystemsEntity;
}
