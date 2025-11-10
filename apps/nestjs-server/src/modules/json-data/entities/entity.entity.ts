import {
	Entity,
	PrimaryGeneratedColumn,
	Column,
	ManyToOne,
	JoinColumn,
} from "typeorm";
import { ChangeEntity } from "./change.entity";

@Entity("entity")
export class EntityEntity {
	@PrimaryGeneratedColumn()
	entity_id: number;

	@Column()
	change_id: number;

	@Column()
	entity_type_id: number;

	@Column({ nullable: true })
	entity_container_id: number;

	@Column({ type: "varchar" })
	name: string;

	@Column({ type: "varchar" })
	full_name: string;

	@Column({ type: "text", nullable: true })
	description: string;

	@ManyToOne(() => ChangeEntity)
	@JoinColumn({ name: "change_id" })
	change: ChangeEntity;
}
