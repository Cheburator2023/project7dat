import { Entity, PrimaryColumn, Column, ManyToOne, JoinColumn } from "typeorm";
import { ChangeEntity } from "./change.entity";
import { EntityMapEntity } from "./entity-map.entity";
import { EntityEntity } from "./entity.entity";

@Entity("entity_map_source")
export class EntityMapSourceEntity {
	@PrimaryColumn()
	entity_map_id: number;

	@PrimaryColumn()
	source_entity_id: number;

	@Column()
	change_id: number;

	@ManyToOne(() => ChangeEntity)
	@JoinColumn({ name: "change_id" })
	change: ChangeEntity;

	@ManyToOne(() => EntityMapEntity)
	@JoinColumn({ name: "entity_map_id" })
	entity_map: EntityMapEntity;

	@ManyToOne(() => EntityEntity)
	@JoinColumn({ name: "source_entity_id" })
	source_entity: EntityEntity;
}
