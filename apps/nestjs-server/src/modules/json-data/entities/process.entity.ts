import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from "typeorm";
import { ChangeEntity } from "./change.entity";

@Entity("process")
export class ProcessEntity {
    @PrimaryGeneratedColumn()
    process_id: number;

    @Column()
    change_id: number;

    @Column()
    process_type: number;

    @Column({ type: "varchar" })
    name: string;

    @Column({ nullable: true })
    group_id: number;

    @ManyToOne(() => ChangeEntity)
    @JoinColumn({ name: "change_id" })
    change: ChangeEntity;
}