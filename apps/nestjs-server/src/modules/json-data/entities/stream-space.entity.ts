import {
    Entity,
    PrimaryGeneratedColumn,
    Column
} from "typeorm";

@Entity("stream_space")
export class StreamSpaceEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: "varchar" })
    name_space: string;

    @Column({ type: "varchar" })
    stream_name: string;
}
