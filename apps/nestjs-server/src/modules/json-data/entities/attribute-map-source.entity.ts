import { Entity, PrimaryColumn, Column, ManyToOne, JoinColumn } from "typeorm";
import { ChangeEntity } from "./change.entity";
import { AttributeMapEntity } from "./attribute-map.entity";
import { AttributeEntity } from "./attribute.entity";

@Entity("attribute_map_source")
export class AttributeMapSourceEntity {
	@PrimaryColumn()
	attribute_map_id: number;

	@PrimaryColumn()
	source_attribute_id: number;

	@Column()
	change_id: number;

	@ManyToOne(() => ChangeEntity)
	@JoinColumn({ name: "change_id" })
	change: ChangeEntity;

	@ManyToOne(() => AttributeMapEntity)
	@JoinColumn({ name: "attribute_map_id" })
	attribute_map: AttributeMapEntity;

	@ManyToOne(() => AttributeEntity)
	@JoinColumn({ name: "source_attribute_id" })
	source_attribute: AttributeEntity;
}
