import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    JoinColumn,
    Unique,
} from "typeorm";
import { ChangeEntity } from "./change.entity";

@Entity("entity_type")
@Unique("entity_type_name_unique", ["name"])
export class EntityTypeEntity {
    @PrimaryGeneratedColumn()
    entity_type_id: number;

    @Column()
    change_id: number;

    @Column({ type: "varchar" })
    name: string;

    @Column({ type: "text", nullable: true })
    description: string;

    @ManyToOne(() => ChangeEntity)
    @JoinColumn({ name: "change_id" })
    change: ChangeEntity;
}