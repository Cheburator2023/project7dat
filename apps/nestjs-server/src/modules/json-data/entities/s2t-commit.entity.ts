import {
	Column,
	CreateDateColumn,
	Entity,
	JoinColumn,
	ManyToOne,
	PrimaryGeneratedColumn,
	UpdateDateColumn,
} from "typeorm";

export type S2tCommitState = "processing" | "done" | "failed";
export type S2tCommitType = "table" | "json" | "model";

@Entity("s2t_commits")
export class S2tCommitEntity {
	@PrimaryGeneratedColumn("uuid")
	id: string;

	@Column({ type: "uuid", nullable: true })
	parent_id: string | null;

	@ManyToOne(() => S2tCommitEntity, { nullable: true })
	@JoinColumn({ name: "parent_id" })
	parent: S2tCommitEntity | null;

	@Column({ type: "varchar", length: 500 })
	commit_name: string;

	@Column({ type: "text", nullable: true })
	commit_description: string | null;

	@Column({ type: "varchar", length: 50 })
	type: S2tCommitType;

	@Column({ type: "varchar", length: 50 })
	state: S2tCommitState;

	@Column({ type: "varchar", length: 200, nullable: true })
	user: string | null;

	@Column({ type: "jsonb" })
	payload: Record<string, any>;

	@Column({ type: "integer", nullable: true })
	change_id: number | null;

	@Column({ type: "text", nullable: true })
	error: string | null;

	@CreateDateColumn()
	created_at: Date;

	@UpdateDateColumn()
	updated_at: Date;
}
