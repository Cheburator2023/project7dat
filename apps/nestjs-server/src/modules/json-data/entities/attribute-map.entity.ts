import {
	Entity,
	PrimaryGeneratedColumn,
	Column,
	ManyToOne,
	JoinColumn,
} from "typeorm";
import { ChangeEntity } from "./change.entity";
import { EntityMapEntity } from "./entity-map.entity";
import { AttributeEntity } from "./attribute.entity";

@Entity("attribute_map")
export class AttributeMapEntity {
	@PrimaryGeneratedColumn()
	attribute_map_id: number;

	@Column()
	entity_map_id: number;

	@Column()
	attribute_id: number;

	@Column()
	change_id: number;

	@ManyToOne(() => ChangeEntity)
	@JoinColumn({ name: "change_id" })
	change: ChangeEntity;

	@ManyToOne(() => EntityMapEntity)
	@JoinColumn({ name: "entity_map_id" })
	entity_map: EntityMapEntity;

	@ManyToOne(() => AttributeEntity)
	@JoinColumn({ name: "attribute_id" })
	attribute: AttributeEntity;
}
