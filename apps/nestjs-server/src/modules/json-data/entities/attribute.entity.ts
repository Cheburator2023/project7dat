import {
	Entity,
	PrimaryGeneratedColumn,
	Column,
	ManyToOne,
	JoinColumn,
} from "typeorm";
import { ChangeEntity } from "./change.entity";
import { EntityEntity } from "./entity.entity";

@Entity("attribute")
export class AttributeEntity {
	@PrimaryGeneratedColumn()
	attribute_id: number;

	@Column()
	change_id: number;

	@Column()
	type_id: number;

	@Column()
	entity_id: number;

	@Column({ type: "varchar" })
	name: string;

	@Column({ type: "text", nullable: true })
	description: string;

	@ManyToOne(() => ChangeEntity)
	@JoinColumn({ name: "change_id" })
	change: ChangeEntity;

	@ManyToOne(() => EntityEntity)
	@JoinColumn({ name: "entity_id" })
	entity: EntityEntity;
}
