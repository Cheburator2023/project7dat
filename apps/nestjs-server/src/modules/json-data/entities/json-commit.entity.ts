import {
    Entity,
    PrimaryColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    JoinColumn,
    Index,
    BeforeInsert,
} from "typeorm";
import { v4 as uuidv4 } from "uuid";

@Entity("json_commits")
@Index("idx_json_commits_parent_id", ["parent_id"])
@Index("idx_json_commits_state", ["state"])
@Index("idx_json_commits_type", ["type"])
@Index("idx_json_commits_timestamp", ["timestamp"])
@Index("idx_json_commits_user", ["user"])
export class JsonCommitEntity {
    @PrimaryColumn("uuid")
    commit_id: string;

    @BeforeInsert()
    generateId() {
        if (!this.commit_id) {
            this.commit_id = uuidv4();
        }
    }

    @Column({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
    timestamp: Date;

    @Column({ name: "user_name", type: "varchar", length: 255 })
    user: string;

    @Column({ type: "uuid", nullable: true })
    parent_id: string | null;

    @ManyToOne(() => JsonCommitEntity, { nullable: true })
    @JoinColumn({ name: "parent_id" })
    parent: JsonCommitEntity | null;

    @Column({ type: "varchar", length: 255, nullable: true })
    commit_name: string;

    @Column({ type: "text", nullable: true })
    commit_description: string | null;

    @Column({
        type: "varchar",
        length: 50,
        default: "processing"
    })
    state: "processing" | "done";

    @Column({ type: "jsonb", nullable: true })
    commit: Record<string, any> | null;

    @Column({
        type: "varchar",
        length: 50
    })
    type: "table" | "json" | "model";

    @CreateDateColumn({ name: "created_at" })
    created_at: Date;

    @UpdateDateColumn({ name: "updated_at" })
    updated_at: Date;

    // Вспомогательные методы
    isOriginal(): boolean {
        return this.parent_id === null;
    }

    isProcessing(): boolean {
        return this.state === "processing";
    }

    isDone(): boolean {
        return this.state === "done";
    }

    canEdit(): boolean {
        return this.isProcessing() && !this.isDone();
    }
}
