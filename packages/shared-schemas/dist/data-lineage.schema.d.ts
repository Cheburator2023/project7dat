import { z } from 'zod';
export declare const DataLineageDescriptionSchema: z.ZodObject<{
    appId: z.ZodString;
    appName: z.ZodString;
}, "strip", z.ZodTypeAny, {
    appId: string;
    appName: string;
}, {
    appId: string;
    appName: string;
}>;
export declare const DataLineageAttributeSchema: z.ZodObject<{
    name: z.ZodString;
    type: z.ZodString;
    comment: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    type: string;
    name: string;
    comment?: string | undefined;
}, {
    type: string;
    name: string;
    comment?: string | undefined;
}>;
export declare const DataLineageEntitySchema: z.ZodObject<{
    id: z.ZodString;
    modified: z.ZodBoolean;
    type: z.ZodEnum<["table", "view"]>;
    namespace: z.ZodOptional<z.ZodString>;
    name: z.ZodString;
    attrSeq: z.ZodOptional<z.ZodArray<z.ZodObject<{
        name: z.ZodString;
        type: z.ZodString;
        comment: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        type: string;
        name: string;
        comment?: string | undefined;
    }, {
        type: string;
        name: string;
        comment?: string | undefined;
    }>, "many">>;
}, "strip", z.ZodTypeAny, {
    type: "table" | "view";
    name: string;
    id: string;
    modified: boolean;
    namespace?: string | undefined;
    attrSeq?: {
        type: string;
        name: string;
        comment?: string | undefined;
    }[] | undefined;
}, {
    type: "table" | "view";
    name: string;
    id: string;
    modified: boolean;
    namespace?: string | undefined;
    attrSeq?: {
        type: string;
        name: string;
        comment?: string | undefined;
    }[] | undefined;
}>;
export declare const AttributeMappingSchema: z.ZodObject<{
    src: z.ZodString;
    dst: z.ZodString;
}, "strip", z.ZodTypeAny, {
    src: string;
    dst: string;
}, {
    src: string;
    dst: string;
}>;
export declare const AttributeDependencySchema: z.ZodObject<{
    attr: z.ZodString;
    linktypes: z.ZodOptional<z.ZodArray<z.ZodEnum<["window", "join", "where", "groupby"]>, "many">>;
}, "strip", z.ZodTypeAny, {
    attr: string;
    linktypes?: ("join" | "window" | "where" | "groupby")[] | undefined;
}, {
    attr: string;
    linktypes?: ("join" | "window" | "where" | "groupby")[] | undefined;
}>;
export declare const EntityDependencySchema: z.ZodObject<{
    entityId: z.ZodString;
    attrMaps: z.ZodOptional<z.ZodArray<z.ZodObject<{
        src: z.ZodString;
        dst: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        src: string;
        dst: string;
    }, {
        src: string;
        dst: string;
    }>, "many">>;
    atrDeps: z.ZodOptional<z.ZodArray<z.ZodObject<{
        attr: z.ZodString;
        linktypes: z.ZodOptional<z.ZodArray<z.ZodEnum<["window", "join", "where", "groupby"]>, "many">>;
    }, "strip", z.ZodTypeAny, {
        attr: string;
        linktypes?: ("join" | "window" | "where" | "groupby")[] | undefined;
    }, {
        attr: string;
        linktypes?: ("join" | "window" | "where" | "groupby")[] | undefined;
    }>, "many">>;
}, "strip", z.ZodTypeAny, {
    entityId: string;
    attrMaps?: {
        src: string;
        dst: string;
    }[] | undefined;
    atrDeps?: {
        attr: string;
        linktypes?: ("join" | "window" | "where" | "groupby")[] | undefined;
    }[] | undefined;
}, {
    entityId: string;
    attrMaps?: {
        src: string;
        dst: string;
    }[] | undefined;
    atrDeps?: {
        attr: string;
        linktypes?: ("join" | "window" | "where" | "groupby")[] | undefined;
    }[] | undefined;
}>;
export declare const DataLineageMappingSchema: z.ZodObject<{
    id: z.ZodNumber;
    entityId: z.ZodString;
    deps: z.ZodOptional<z.ZodArray<z.ZodObject<{
        entityId: z.ZodString;
        attrMaps: z.ZodOptional<z.ZodArray<z.ZodObject<{
            src: z.ZodString;
            dst: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            src: string;
            dst: string;
        }, {
            src: string;
            dst: string;
        }>, "many">>;
        atrDeps: z.ZodOptional<z.ZodArray<z.ZodObject<{
            attr: z.ZodString;
            linktypes: z.ZodOptional<z.ZodArray<z.ZodEnum<["window", "join", "where", "groupby"]>, "many">>;
        }, "strip", z.ZodTypeAny, {
            attr: string;
            linktypes?: ("join" | "window" | "where" | "groupby")[] | undefined;
        }, {
            attr: string;
            linktypes?: ("join" | "window" | "where" | "groupby")[] | undefined;
        }>, "many">>;
    }, "strip", z.ZodTypeAny, {
        entityId: string;
        attrMaps?: {
            src: string;
            dst: string;
        }[] | undefined;
        atrDeps?: {
            attr: string;
            linktypes?: ("join" | "window" | "where" | "groupby")[] | undefined;
        }[] | undefined;
    }, {
        entityId: string;
        attrMaps?: {
            src: string;
            dst: string;
        }[] | undefined;
        atrDeps?: {
            attr: string;
            linktypes?: ("join" | "window" | "where" | "groupby")[] | undefined;
        }[] | undefined;
    }>, "many">>;
    unmatched: z.ZodOptional<z.ZodArray<z.ZodUnknown, "many">>;
}, "strip", z.ZodTypeAny, {
    id: number;
    entityId: string;
    deps?: {
        entityId: string;
        attrMaps?: {
            src: string;
            dst: string;
        }[] | undefined;
        atrDeps?: {
            attr: string;
            linktypes?: ("join" | "window" | "where" | "groupby")[] | undefined;
        }[] | undefined;
    }[] | undefined;
    unmatched?: unknown[] | undefined;
}, {
    id: number;
    entityId: string;
    deps?: {
        entityId: string;
        attrMaps?: {
            src: string;
            dst: string;
        }[] | undefined;
        atrDeps?: {
            attr: string;
            linktypes?: ("join" | "window" | "where" | "groupby")[] | undefined;
        }[] | undefined;
    }[] | undefined;
    unmatched?: unknown[] | undefined;
}>;
export declare const DataLineageGraphSchema: z.ZodObject<{
    desc: z.ZodObject<{
        appId: z.ZodString;
        appName: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        appId: string;
        appName: string;
    }, {
        appId: string;
        appName: string;
    }>;
    entities: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        modified: z.ZodBoolean;
        type: z.ZodEnum<["table", "view"]>;
        namespace: z.ZodOptional<z.ZodString>;
        name: z.ZodString;
        attrSeq: z.ZodOptional<z.ZodArray<z.ZodObject<{
            name: z.ZodString;
            type: z.ZodString;
            comment: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            type: string;
            name: string;
            comment?: string | undefined;
        }, {
            type: string;
            name: string;
            comment?: string | undefined;
        }>, "many">>;
    }, "strip", z.ZodTypeAny, {
        type: "table" | "view";
        name: string;
        id: string;
        modified: boolean;
        namespace?: string | undefined;
        attrSeq?: {
            type: string;
            name: string;
            comment?: string | undefined;
        }[] | undefined;
    }, {
        type: "table" | "view";
        name: string;
        id: string;
        modified: boolean;
        namespace?: string | undefined;
        attrSeq?: {
            type: string;
            name: string;
            comment?: string | undefined;
        }[] | undefined;
    }>, "many">;
    mappings: z.ZodArray<z.ZodObject<{
        id: z.ZodNumber;
        entityId: z.ZodString;
        deps: z.ZodOptional<z.ZodArray<z.ZodObject<{
            entityId: z.ZodString;
            attrMaps: z.ZodOptional<z.ZodArray<z.ZodObject<{
                src: z.ZodString;
                dst: z.ZodString;
            }, "strip", z.ZodTypeAny, {
                src: string;
                dst: string;
            }, {
                src: string;
                dst: string;
            }>, "many">>;
            atrDeps: z.ZodOptional<z.ZodArray<z.ZodObject<{
                attr: z.ZodString;
                linktypes: z.ZodOptional<z.ZodArray<z.ZodEnum<["window", "join", "where", "groupby"]>, "many">>;
            }, "strip", z.ZodTypeAny, {
                attr: string;
                linktypes?: ("join" | "window" | "where" | "groupby")[] | undefined;
            }, {
                attr: string;
                linktypes?: ("join" | "window" | "where" | "groupby")[] | undefined;
            }>, "many">>;
        }, "strip", z.ZodTypeAny, {
            entityId: string;
            attrMaps?: {
                src: string;
                dst: string;
            }[] | undefined;
            atrDeps?: {
                attr: string;
                linktypes?: ("join" | "window" | "where" | "groupby")[] | undefined;
            }[] | undefined;
        }, {
            entityId: string;
            attrMaps?: {
                src: string;
                dst: string;
            }[] | undefined;
            atrDeps?: {
                attr: string;
                linktypes?: ("join" | "window" | "where" | "groupby")[] | undefined;
            }[] | undefined;
        }>, "many">>;
        unmatched: z.ZodOptional<z.ZodArray<z.ZodUnknown, "many">>;
    }, "strip", z.ZodTypeAny, {
        id: number;
        entityId: string;
        deps?: {
            entityId: string;
            attrMaps?: {
                src: string;
                dst: string;
            }[] | undefined;
            atrDeps?: {
                attr: string;
                linktypes?: ("join" | "window" | "where" | "groupby")[] | undefined;
            }[] | undefined;
        }[] | undefined;
        unmatched?: unknown[] | undefined;
    }, {
        id: number;
        entityId: string;
        deps?: {
            entityId: string;
            attrMaps?: {
                src: string;
                dst: string;
            }[] | undefined;
            atrDeps?: {
                attr: string;
                linktypes?: ("join" | "window" | "where" | "groupby")[] | undefined;
            }[] | undefined;
        }[] | undefined;
        unmatched?: unknown[] | undefined;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    desc: {
        appId: string;
        appName: string;
    };
    entities: {
        type: "table" | "view";
        name: string;
        id: string;
        modified: boolean;
        namespace?: string | undefined;
        attrSeq?: {
            type: string;
            name: string;
            comment?: string | undefined;
        }[] | undefined;
    }[];
    mappings: {
        id: number;
        entityId: string;
        deps?: {
            entityId: string;
            attrMaps?: {
                src: string;
                dst: string;
            }[] | undefined;
            atrDeps?: {
                attr: string;
                linktypes?: ("join" | "window" | "where" | "groupby")[] | undefined;
            }[] | undefined;
        }[] | undefined;
        unmatched?: unknown[] | undefined;
    }[];
}, {
    desc: {
        appId: string;
        appName: string;
    };
    entities: {
        type: "table" | "view";
        name: string;
        id: string;
        modified: boolean;
        namespace?: string | undefined;
        attrSeq?: {
            type: string;
            name: string;
            comment?: string | undefined;
        }[] | undefined;
    }[];
    mappings: {
        id: number;
        entityId: string;
        deps?: {
            entityId: string;
            attrMaps?: {
                src: string;
                dst: string;
            }[] | undefined;
            atrDeps?: {
                attr: string;
                linktypes?: ("join" | "window" | "where" | "groupby")[] | undefined;
            }[] | undefined;
        }[] | undefined;
        unmatched?: unknown[] | undefined;
    }[];
}>;
export type DataLineageDescription = z.infer<typeof DataLineageDescriptionSchema>;
export type DataLineageAttribute = z.infer<typeof DataLineageAttributeSchema>;
export type DataLineageEntity = z.infer<typeof DataLineageEntitySchema>;
export type AttributeMapping = z.infer<typeof AttributeMappingSchema>;
export type AttributeDependency = z.infer<typeof AttributeDependencySchema>;
export type EntityDependency = z.infer<typeof EntityDependencySchema>;
export type DataLineageMapping = z.infer<typeof DataLineageMappingSchema>;
export type DataLineageGraph = z.infer<typeof DataLineageGraphSchema>;
export declare const CreateDataLineageGraphSchema: z.ZodObject<{
    desc: z.ZodObject<{
        appId: z.ZodString;
        appName: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        appId: string;
        appName: string;
    }, {
        appId: string;
        appName: string;
    }>;
    entities: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        modified: z.ZodBoolean;
        type: z.ZodEnum<["table", "view"]>;
        namespace: z.ZodOptional<z.ZodString>;
        name: z.ZodString;
        attrSeq: z.ZodOptional<z.ZodArray<z.ZodObject<{
            name: z.ZodString;
            type: z.ZodString;
            comment: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            type: string;
            name: string;
            comment?: string | undefined;
        }, {
            type: string;
            name: string;
            comment?: string | undefined;
        }>, "many">>;
    }, "strip", z.ZodTypeAny, {
        type: "table" | "view";
        name: string;
        id: string;
        modified: boolean;
        namespace?: string | undefined;
        attrSeq?: {
            type: string;
            name: string;
            comment?: string | undefined;
        }[] | undefined;
    }, {
        type: "table" | "view";
        name: string;
        id: string;
        modified: boolean;
        namespace?: string | undefined;
        attrSeq?: {
            type: string;
            name: string;
            comment?: string | undefined;
        }[] | undefined;
    }>, "many">;
    mappings: z.ZodArray<z.ZodObject<{
        id: z.ZodNumber;
        entityId: z.ZodString;
        deps: z.ZodOptional<z.ZodArray<z.ZodObject<{
            entityId: z.ZodString;
            attrMaps: z.ZodOptional<z.ZodArray<z.ZodObject<{
                src: z.ZodString;
                dst: z.ZodString;
            }, "strip", z.ZodTypeAny, {
                src: string;
                dst: string;
            }, {
                src: string;
                dst: string;
            }>, "many">>;
            atrDeps: z.ZodOptional<z.ZodArray<z.ZodObject<{
                attr: z.ZodString;
                linktypes: z.ZodOptional<z.ZodArray<z.ZodEnum<["window", "join", "where", "groupby"]>, "many">>;
            }, "strip", z.ZodTypeAny, {
                attr: string;
                linktypes?: ("join" | "window" | "where" | "groupby")[] | undefined;
            }, {
                attr: string;
                linktypes?: ("join" | "window" | "where" | "groupby")[] | undefined;
            }>, "many">>;
        }, "strip", z.ZodTypeAny, {
            entityId: string;
            attrMaps?: {
                src: string;
                dst: string;
            }[] | undefined;
            atrDeps?: {
                attr: string;
                linktypes?: ("join" | "window" | "where" | "groupby")[] | undefined;
            }[] | undefined;
        }, {
            entityId: string;
            attrMaps?: {
                src: string;
                dst: string;
            }[] | undefined;
            atrDeps?: {
                attr: string;
                linktypes?: ("join" | "window" | "where" | "groupby")[] | undefined;
            }[] | undefined;
        }>, "many">>;
        unmatched: z.ZodOptional<z.ZodArray<z.ZodUnknown, "many">>;
    }, "strip", z.ZodTypeAny, {
        id: number;
        entityId: string;
        deps?: {
            entityId: string;
            attrMaps?: {
                src: string;
                dst: string;
            }[] | undefined;
            atrDeps?: {
                attr: string;
                linktypes?: ("join" | "window" | "where" | "groupby")[] | undefined;
            }[] | undefined;
        }[] | undefined;
        unmatched?: unknown[] | undefined;
    }, {
        id: number;
        entityId: string;
        deps?: {
            entityId: string;
            attrMaps?: {
                src: string;
                dst: string;
            }[] | undefined;
            atrDeps?: {
                attr: string;
                linktypes?: ("join" | "window" | "where" | "groupby")[] | undefined;
            }[] | undefined;
        }[] | undefined;
        unmatched?: unknown[] | undefined;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    desc: {
        appId: string;
        appName: string;
    };
    entities: {
        type: "table" | "view";
        name: string;
        id: string;
        modified: boolean;
        namespace?: string | undefined;
        attrSeq?: {
            type: string;
            name: string;
            comment?: string | undefined;
        }[] | undefined;
    }[];
    mappings: {
        id: number;
        entityId: string;
        deps?: {
            entityId: string;
            attrMaps?: {
                src: string;
                dst: string;
            }[] | undefined;
            atrDeps?: {
                attr: string;
                linktypes?: ("join" | "window" | "where" | "groupby")[] | undefined;
            }[] | undefined;
        }[] | undefined;
        unmatched?: unknown[] | undefined;
    }[];
}, {
    desc: {
        appId: string;
        appName: string;
    };
    entities: {
        type: "table" | "view";
        name: string;
        id: string;
        modified: boolean;
        namespace?: string | undefined;
        attrSeq?: {
            type: string;
            name: string;
            comment?: string | undefined;
        }[] | undefined;
    }[];
    mappings: {
        id: number;
        entityId: string;
        deps?: {
            entityId: string;
            attrMaps?: {
                src: string;
                dst: string;
            }[] | undefined;
            atrDeps?: {
                attr: string;
                linktypes?: ("join" | "window" | "where" | "groupby")[] | undefined;
            }[] | undefined;
        }[] | undefined;
        unmatched?: unknown[] | undefined;
    }[];
}>;
export declare const UpdateDataLineageGraphSchema: z.ZodObject<{
    desc: z.ZodOptional<z.ZodObject<{
        appId: z.ZodString;
        appName: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        appId: string;
        appName: string;
    }, {
        appId: string;
        appName: string;
    }>>;
    entities: z.ZodOptional<z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        modified: z.ZodBoolean;
        type: z.ZodEnum<["table", "view"]>;
        namespace: z.ZodOptional<z.ZodString>;
        name: z.ZodString;
        attrSeq: z.ZodOptional<z.ZodArray<z.ZodObject<{
            name: z.ZodString;
            type: z.ZodString;
            comment: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            type: string;
            name: string;
            comment?: string | undefined;
        }, {
            type: string;
            name: string;
            comment?: string | undefined;
        }>, "many">>;
    }, "strip", z.ZodTypeAny, {
        type: "table" | "view";
        name: string;
        id: string;
        modified: boolean;
        namespace?: string | undefined;
        attrSeq?: {
            type: string;
            name: string;
            comment?: string | undefined;
        }[] | undefined;
    }, {
        type: "table" | "view";
        name: string;
        id: string;
        modified: boolean;
        namespace?: string | undefined;
        attrSeq?: {
            type: string;
            name: string;
            comment?: string | undefined;
        }[] | undefined;
    }>, "many">>;
    mappings: z.ZodOptional<z.ZodArray<z.ZodObject<{
        id: z.ZodNumber;
        entityId: z.ZodString;
        deps: z.ZodOptional<z.ZodArray<z.ZodObject<{
            entityId: z.ZodString;
            attrMaps: z.ZodOptional<z.ZodArray<z.ZodObject<{
                src: z.ZodString;
                dst: z.ZodString;
            }, "strip", z.ZodTypeAny, {
                src: string;
                dst: string;
            }, {
                src: string;
                dst: string;
            }>, "many">>;
            atrDeps: z.ZodOptional<z.ZodArray<z.ZodObject<{
                attr: z.ZodString;
                linktypes: z.ZodOptional<z.ZodArray<z.ZodEnum<["window", "join", "where", "groupby"]>, "many">>;
            }, "strip", z.ZodTypeAny, {
                attr: string;
                linktypes?: ("join" | "window" | "where" | "groupby")[] | undefined;
            }, {
                attr: string;
                linktypes?: ("join" | "window" | "where" | "groupby")[] | undefined;
            }>, "many">>;
        }, "strip", z.ZodTypeAny, {
            entityId: string;
            attrMaps?: {
                src: string;
                dst: string;
            }[] | undefined;
            atrDeps?: {
                attr: string;
                linktypes?: ("join" | "window" | "where" | "groupby")[] | undefined;
            }[] | undefined;
        }, {
            entityId: string;
            attrMaps?: {
                src: string;
                dst: string;
            }[] | undefined;
            atrDeps?: {
                attr: string;
                linktypes?: ("join" | "window" | "where" | "groupby")[] | undefined;
            }[] | undefined;
        }>, "many">>;
        unmatched: z.ZodOptional<z.ZodArray<z.ZodUnknown, "many">>;
    }, "strip", z.ZodTypeAny, {
        id: number;
        entityId: string;
        deps?: {
            entityId: string;
            attrMaps?: {
                src: string;
                dst: string;
            }[] | undefined;
            atrDeps?: {
                attr: string;
                linktypes?: ("join" | "window" | "where" | "groupby")[] | undefined;
            }[] | undefined;
        }[] | undefined;
        unmatched?: unknown[] | undefined;
    }, {
        id: number;
        entityId: string;
        deps?: {
            entityId: string;
            attrMaps?: {
                src: string;
                dst: string;
            }[] | undefined;
            atrDeps?: {
                attr: string;
                linktypes?: ("join" | "window" | "where" | "groupby")[] | undefined;
            }[] | undefined;
        }[] | undefined;
        unmatched?: unknown[] | undefined;
    }>, "many">>;
}, "strip", z.ZodTypeAny, {
    desc?: {
        appId: string;
        appName: string;
    } | undefined;
    entities?: {
        type: "table" | "view";
        name: string;
        id: string;
        modified: boolean;
        namespace?: string | undefined;
        attrSeq?: {
            type: string;
            name: string;
            comment?: string | undefined;
        }[] | undefined;
    }[] | undefined;
    mappings?: {
        id: number;
        entityId: string;
        deps?: {
            entityId: string;
            attrMaps?: {
                src: string;
                dst: string;
            }[] | undefined;
            atrDeps?: {
                attr: string;
                linktypes?: ("join" | "window" | "where" | "groupby")[] | undefined;
            }[] | undefined;
        }[] | undefined;
        unmatched?: unknown[] | undefined;
    }[] | undefined;
}, {
    desc?: {
        appId: string;
        appName: string;
    } | undefined;
    entities?: {
        type: "table" | "view";
        name: string;
        id: string;
        modified: boolean;
        namespace?: string | undefined;
        attrSeq?: {
            type: string;
            name: string;
            comment?: string | undefined;
        }[] | undefined;
    }[] | undefined;
    mappings?: {
        id: number;
        entityId: string;
        deps?: {
            entityId: string;
            attrMaps?: {
                src: string;
                dst: string;
            }[] | undefined;
            atrDeps?: {
                attr: string;
                linktypes?: ("join" | "window" | "where" | "groupby")[] | undefined;
            }[] | undefined;
        }[] | undefined;
        unmatched?: unknown[] | undefined;
    }[] | undefined;
}>;
export type CreateDataLineageGraphInput = z.infer<typeof CreateDataLineageGraphSchema>;
export type UpdateDataLineageGraphInput = z.infer<typeof UpdateDataLineageGraphSchema>;
//# sourceMappingURL=data-lineage.schema.d.ts.map