import {
	BeforeInsert,
	Column,
	CreateDateColumn,
	Entity,
	Index,
	PrimaryColumn,
	UpdateDateColumn,
} from "typeorm";
import { v4 as uuidv4 } from "uuid";

export type MergeSessionState = "pending" | "merging" | "done" | "failed";

@Entity("merge_sessions")
@Index("idx_merge_sessions_commit_id", ["commit_id"])
@Index("idx_merge_sessions_status", ["merge_status"])
@Index("idx_merge_sessions_created_at", ["created_at"])
export class MergeSessionEntity {
	@PrimaryColumn("uuid")
	id: string;

	@BeforeInsert()
	generateId() {
		if (!this.id) {
			this.id = uuidv4();
		}
	}

	@Column({ type: "uuid" })
	commit_id: string;

	@Column({ type: "varchar", length: 500 })
	commit_name: string;

	@Column({ type: "boolean", default: false })
	had_existing_cycles: boolean;

	@Column({ type: "varchar", length: 32, default: "pending" })
	merge_status: MergeSessionState;

	@Column({ type: "integer", default: 0 })
	progress: number;

	@Column({ type: "varchar", length: 255, default: "Ожидание подтверждения" })
	stage: string;

	@Column({ type: "timestamp", nullable: true })
	started_at: Date | null;

	@Column({ type: "uuid", nullable: true })
	snapshot_id: string | null;

	@Column({ type: "text", nullable: true })
	error_message: string | null;

	@Column({ type: "integer", nullable: true })
	estimated_seconds_left: number | null;

	@Column({ type: "boolean", default: false })
	cancel_requested: boolean;

	@CreateDateColumn({ name: "created_at" })
	created_at: Date;

	@UpdateDateColumn({ name: "updated_at" })
	updated_at: Date;
}
