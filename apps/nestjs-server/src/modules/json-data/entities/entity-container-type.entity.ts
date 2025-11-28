import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    JoinColumn,
} from "typeorm";
import { ChangeEntity } from "./change.entity";

@Entity("entity_container_type")
export class EntityContainerTypeEntity {
    @PrimaryGeneratedColumn()
    entity_container_type_id: number;

    @Column()
    change_id: number;

    @Column({ type: "varchar" })
    value: string;

    @Column({ type: "text", nullable: true })
    description: string;

    @ManyToOne(() => ChangeEntity)
    @JoinColumn({ name: "change_id" })
    change: ChangeEntity;
}
