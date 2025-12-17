import {
	Entity,
	PrimaryGeneratedColumn,
	Column,
	CreateDateColumn,
	ManyToOne,
	JoinColumn,
} from "typeorm";
import { JsonDataEntity } from "./json-data.entity";

/**
 * Структура изменений коммита для entities и mappings
 */
export interface CommitChangesData {
	entities: {
		added: Array<{
			id: string;
			type: string;
			name: string | null;
			namespace?: string;
			data: Record<string, any>;
		}>;
		removed: Array<{
			id: string;
			type?: string;
			name?: string | null;
		}>;
		modified: Array<{
			id: string;
			type: string;
			name: string | null;
			changes: Array<{ field: string; oldValue: any; newValue: any }>;
			oldData?: Record<string, any>;
			newData?: Record<string, any>;
		}>;
	};
	mappings: {
		added: Array<{
			id: number;
			entityId: string;
			data: Record<string, any>;
		}>;
		removed: Array<{
			id: number;
			entityId?: string;
		}>;
		modified: Array<{
			id: number;
			entityId: string;
			changes: Array<{ field: string; oldValue: any; newValue: any }>;
			oldData?: Record<string, any>;
			newData?: Record<string, any>;
		}>;
	};
	summary: {
		totalChanges: number;
		entities: { added: number; removed: number; modified: number };
		mappings: { added: number; removed: number; modified: number };
	};
}

@Entity("json_commits")
export class JsonCommitEntity {
	@PrimaryGeneratedColumn("uuid")
	id: string;

	@Column({ type: "varchar", length: 500 })
	message: string;

	@Column({ type: "jsonb" })
	diff: Record<string, any>;

	/**
	 * Структурированные изменения коммита с детализацией по entities и mappings
	 */
	@Column({ type: "jsonb", nullable: true })
	changes: CommitChangesData | null;

	@Column({ type: "uuid" })
	graphId: string;

	@Column({ type: "varchar", length: 20 })
	version: string;

	@Column({ type: "varchar", length: 50 })
	status: string;

	@ManyToOne(() => JsonDataEntity, { onDelete: "CASCADE" })
	@JoinColumn({ name: "graphId" })
	jsonData: JsonDataEntity;

	@Column({ nullable: true })
	authorName: string;

	@CreateDateColumn()
	createdAt: Date;
}
