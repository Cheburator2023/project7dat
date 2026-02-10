import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    JoinColumn,
    Index,
} from "typeorm";
import { ChangeEntity } from "./change.entity";
import { ProcessTypeEntity } from "./process-type.entity";
import { ProcessGroupEntity } from "./process-group.entity";

@Entity("process")
@Index("idx_process_name", ["name"])
@Index("idx_process_change_id", ["change_id"])
@Index("idx_process_type", ["process_type"])
@Index("idx_process_group_id", ["group_id"])
export class ProcessEntity {
	@PrimaryGeneratedColumn()
	process_id: number;

	@Column()
	change_id: number;

	@Column()
	process_type: number;

	@Column({ type: "varchar", nullable: true })
	name: string;

    @Column({ nullable: true })
    group_id: number | null;

    @Column({ type: "varchar", nullable: true })
    description: string;

    @ManyToOne(() => ChangeEntity)
    @JoinColumn({ name: "change_id" })
    change: ChangeEntity;

    @ManyToOne(() => ProcessTypeEntity)
    @JoinColumn({ name: "process_type" })
    process_type_entity: ProcessTypeEntity;

    @ManyToOne(() => ProcessGroupEntity, { nullable: true })
    @JoinColumn({ name: "group_id" })
    process_group: ProcessGroupEntity;
}
