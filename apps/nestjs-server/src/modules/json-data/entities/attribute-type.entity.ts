import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    JoinColumn,
} from "typeorm";
import { ChangeEntity } from "./change.entity";

@Entity("attribute_type")
export class AttributeTypeEntity {
    @PrimaryGeneratedColumn()
    type_id: number;

    @Column()
    change_id: number;

    @Column({ type: "varchar" })
    name: string;

    @Column({ type: "text", nullable: true })
    description: string;

    @Column({ type: "varchar" })
    type_group: string;

    @ManyToOne(() => ChangeEntity)
    @JoinColumn({ name: "change_id" })
    change: ChangeEntity;
}
