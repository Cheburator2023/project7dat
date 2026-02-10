import {
    Entity,
    PrimaryColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    BeforeInsert,
} from "typeorm";
import { v4 as uuidv4 } from "uuid";

@Entity("snapshots")
export class SnapshotEntity {
    @PrimaryColumn("uuid")
    snapshot_id: string;

    @BeforeInsert()
    generateId() {
        if (!this.snapshot_id) {
            this.snapshot_id = uuidv4();
        }
    }

    @Column({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
    timestamp: Date;

    @Column({ name: "user_name", type: "varchar", length: 255 })
    user: string;

    @Column({ type: "jsonb" })
    snapshot_json: Record<string, any>;

    @CreateDateColumn({ name: "created_at" })
    created_at: Date;

    @UpdateDateColumn({ name: "updated_at" })
    updated_at: Date;
}
