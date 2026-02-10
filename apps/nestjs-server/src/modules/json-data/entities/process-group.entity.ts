import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    JoinColumn,
} from "typeorm";
import { ChangeEntity } from "./change.entity";

@Entity("process_group")
export class ProcessGroupEntity {
    @PrimaryGeneratedColumn()
    group_id: number;

    @Column()
    change_id: number;

    @Column({ type: "varchar" })
    name: string;

    @Column({ type: "varchar", nullable: true })
    description: string;

    @ManyToOne(() => ChangeEntity)
    @JoinColumn({ name: "change_id" })
    change: ChangeEntity;
}
