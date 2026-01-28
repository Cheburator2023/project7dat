import { Entity, PrimaryColumn, Column, ManyToOne, JoinColumn } from "typeorm";
import { ChangeEntity } from "./change.entity";

@Entity("dependency_type")
export class DependencyTypeEntity {
	@PrimaryColumn({ type: "varchar" })
	deptype_id: string;

	@Column()
	change_id: number;

	@Column({ type: "varchar" })
	name: string;

	@Column({ type: "text", nullable: true })
	description: string;

	@ManyToOne(() => ChangeEntity)
	@JoinColumn({ name: "change_id" })
	change: ChangeEntity;
}
