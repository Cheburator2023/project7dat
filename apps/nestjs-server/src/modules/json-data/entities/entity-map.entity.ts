import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from "typeorm";
import { ChangeEntity } from "./change.entity";
import { EntityEntity } from "./entity.entity";
import { ProcessEntity } from "./process.entity";

@Entity("entity_map")
export class EntityMapEntity {
    @PrimaryGeneratedColumn()
    entity_map_id: number;

    @Column()
    entity_id: number;

    @Column({ type: "text", nullable: true })
    description: string;

    @Column()
    process_id: number;

    @Column()
    change_id: number;

    @ManyToOne(() => ChangeEntity)
    @JoinColumn({ name: "change_id" })
    change: ChangeEntity;

    @ManyToOne(() => EntityEntity)
    @JoinColumn({ name: "entity_id" })
    entity: EntityEntity;

    @ManyToOne(() => ProcessEntity)
    @JoinColumn({ name: "process_id" })
    process: ProcessEntity;
}