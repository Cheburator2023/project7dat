import {
    Entity,
    PrimaryGeneratedColumn,
    Column
} from "typeorm";

@Entity("stream_space")
export class StreamSpaceEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: "varchar", nullable: true })
    name_space: string;

    @Column({ type: "varchar", nullable: true })
    stream_name: string;
}
