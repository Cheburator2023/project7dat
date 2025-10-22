import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from "typeorm";

@Entity("changes")
export class ChangeEntity {
    @PrimaryGeneratedColumn()
    change_id: number;

    @CreateDateColumn({ type: "timestamp" })
    change_date: Date;

    @Column({ type: "varchar" })
    change_user: string;

    @Column({ type: "varchar" })
    change_name: string;

    @Column({ type: "varchar", nullable: true })
    app_id: string;

    @Column({ type: "varchar", default: "1.0" })
    schema_version: string;

    @Column({ type: "boolean", default: false })
    deprecation: boolean;

    @Column({ type: "varchar", nullable: true })
    user_id: string;

    @Column({ type: "text", nullable: true })
    raw_json: string;
}