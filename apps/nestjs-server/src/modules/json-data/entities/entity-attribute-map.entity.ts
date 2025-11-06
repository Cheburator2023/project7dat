import { Entity, PrimaryColumn, Column, ManyToOne, JoinColumn } from "typeorm";
import { ChangeEntity } from "./change.entity";
import { EntityMapEntity } from "./entity-map.entity";
import { AttributeEntity } from "./attribute.entity";

@Entity("entity_attribute_map")
export class EntityAttributeMapEntity {
    @PrimaryColumn()
    entity_map_id: number;

    @PrimaryColumn()
    source_attribute_id: number;

    @PrimaryColumn({ type: "varchar" })
    deptype_id: string;

    @Column()
    change_id: number;

    @ManyToOne(() => ChangeEntity)
    @JoinColumn({ name: "change_id" })
    change: ChangeEntity;

    @ManyToOne(() => EntityMapEntity)
    @JoinColumn({ name: "entity_map_id" })
    entity_map: EntityMapEntity;

    @ManyToOne(() => AttributeEntity)
    @JoinColumn({ name: "source_attribute_id" })
    source_attribute: AttributeEntity;
}