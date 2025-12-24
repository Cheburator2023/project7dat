import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    JoinColumn,
    Unique,
    Index,
} from "typeorm";
import { ChangeEntity } from "./change.entity";
import { AttributeTypeEntity } from "./attribute-type.entity";
import { EntityEntity } from "./entity.entity";

@Entity("attribute")
@Index("idx_attribute_entity_id", ["entity_id"])
@Index("idx_attribute_change_id", ["change_id"])
@Index("idx_attribute_type_id", ["type_id"])
@Index("idx_attribute_name", ["name"])
@Unique("attribute_entity_id_name_unique", ["entity_id", "name"])
export class AttributeEntity {
	@PrimaryGeneratedColumn()
	attribute_id: number;

	@Column()
	change_id: number;

	@Column()
	type_id: number;

	@Column()
	entity_id: number;

	@Column({ type: "varchar", nullable: true })
	name: string;

	@Column({ type: "text", nullable: true })
	description: string;

	@ManyToOne(() => ChangeEntity)
	@JoinColumn({ name: "change_id" })
	change: ChangeEntity;

    @ManyToOne(() => AttributeTypeEntity)
    @JoinColumn({ name: "type_id" })
    attribute_type: AttributeTypeEntity;

	@ManyToOne(() => EntityEntity)
	@JoinColumn({ name: "entity_id" })
	entity: EntityEntity;
}
