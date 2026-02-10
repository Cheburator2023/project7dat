import {
	Entity,
	PrimaryGeneratedColumn,
	Column,
	ManyToOne,
	JoinColumn,
	Index,
} from "typeorm";
import { ChangeEntity } from "./change.entity";
import { EntityTypeEntity } from "./entity-type.entity";
import { EntityContainerEntity } from "./entity-container.entity";

@Entity("entity")
@Index("idx_entity_full_name", ["full_name"])
@Index("idx_entity_name", ["name"])
@Index("idx_entity_change_id", ["change_id"])
@Index("idx_entity_container_id", ["entity_container_id"])
@Index("idx_entity_type_id", ["entity_type_id"])
export class EntityEntity {
	@PrimaryGeneratedColumn()
	entity_id: number;

	@Column()
	change_id: number;

	@Column()
	entity_type_id: number;

	@Column({ nullable: true })
	entity_container_id: number | null;

	@Column({ type: "varchar", nullable: true })
	name: string;

	@Column({ type: "varchar", nullable: true })
	full_name: string;

	@Column({ type: "varchar", nullable: true })
	description: string;

	@ManyToOne(() => ChangeEntity)
	@JoinColumn({ name: "change_id" })
	change: ChangeEntity;

	@ManyToOne(() => EntityTypeEntity)
	@JoinColumn({ name: "entity_type_id" })
	entity_type: EntityTypeEntity;

	@ManyToOne(() => EntityContainerEntity, { nullable: true })
	@JoinColumn({ name: "entity_container_id" })
	entity_container: EntityContainerEntity;
}
