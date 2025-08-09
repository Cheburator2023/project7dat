import {
	Entity,
	PrimaryGeneratedColumn,
	Column,
	CreateDateColumn,
} from "typeorm";

export enum ChangelogActionType {
	CREATED = "created",
	COMMIT = "commit",
	SNAPSHOT_CREATED = "snapshot_created",
	SNAPSHOT_APPLIED = "snapshot_applied",
	ROLLBACK = "rollback",
	UPDATED = "updated",
	DELETED = "deleted",
	SET_CURRENT = "set_current",
}

@Entity("changelog")
export class ChangelogEntity {
	@PrimaryGeneratedColumn("uuid")
	id: string;

	@Column({ name: "graph_id" })
	graphId: string;

	@Column({ name: "graph_name" })
	graphName: string;

	@Column({
		type: "enum",
		enum: ChangelogActionType,
		name: "action_type",
	})
	actionType: ChangelogActionType;

	@Column({ name: "action_description" })
	actionDescription: string;

	@Column({ type: "text", nullable: true })
	details: string;

	@Column({ nullable: true })
	author: string;

	@Column({ name: "commit_id", nullable: true })
	commitId: string;

	@Column({ name: "snapshot_id", nullable: true })
	snapshotId: string;

	@Column({ name: "version", nullable: true })
	version: string;

	@CreateDateColumn({ name: "created_at" })
	createdAt: Date;
}
