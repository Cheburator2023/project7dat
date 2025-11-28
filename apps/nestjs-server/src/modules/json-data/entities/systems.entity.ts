import {
    Entity,
    PrimaryGeneratedColumn,
    Column
} from "typeorm";

@Entity("systems")
export class SystemsEntity {
    @PrimaryGeneratedColumn()
    system_id: number;

    @Column({ type: "varchar" })
    code: string;

    @Column({ type: "varchar" })
    name: string;
}
