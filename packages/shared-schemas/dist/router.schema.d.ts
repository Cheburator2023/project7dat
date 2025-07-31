import { z } from 'zod';
export declare const DataLineageRouterSchema: {
    readonly dataLineage: {
        readonly list: {
            readonly input: z.ZodObject<{
                page: z.ZodDefault<z.ZodNumber>;
                limit: z.ZodDefault<z.ZodNumber>;
                search: z.ZodOptional<z.ZodString>;
            }, "strip", z.ZodTypeAny, {
                page: number;
                limit: number;
                search?: string | undefined;
            }, {
                page?: number | undefined;
                limit?: number | undefined;
                search?: string | undefined;
            }>;
            readonly output: z.ZodObject<{
                total: z.ZodNumber;
                page: z.ZodNumber;
                limit: z.ZodNumber;
                totalPages: z.ZodNumber;
            } & {
                data: z.ZodArray<z.ZodObject<{
                    id: z.ZodString;
                    name: z.ZodString;
                    description: z.ZodOptional<z.ZodString>;
                    data: z.ZodObject<{
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
                    createdAt: z.ZodDate;
                    updatedAt: z.ZodDate;
                }, "strip", z.ZodTypeAny, {
                    name: string;
                    id: string;
                    data: {
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
                    };
                    createdAt: Date;
                    updatedAt: Date;
                    description?: string | undefined;
                }, {
                    name: string;
                    id: string;
                    data: {
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
                    };
                    createdAt: Date;
                    updatedAt: Date;
                    description?: string | undefined;
                }>, "many">;
            }, "strip", z.ZodTypeAny, {
                page: number;
                limit: number;
                data: {
                    name: string;
                    id: string;
                    data: {
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
                    };
                    createdAt: Date;
                    updatedAt: Date;
                    description?: string | undefined;
                }[];
                total: number;
                totalPages: number;
            }, {
                page: number;
                limit: number;
                data: {
                    name: string;
                    id: string;
                    data: {
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
                    };
                    createdAt: Date;
                    updatedAt: Date;
                    description?: string | undefined;
                }[];
                total: number;
                totalPages: number;
            }>;
        };
        readonly getById: {
            readonly input: z.ZodObject<{
                id: z.ZodString;
            }, "strip", z.ZodTypeAny, {
                id: string;
            }, {
                id: string;
            }>;
            readonly output: z.ZodNullable<z.ZodObject<{
                id: z.ZodString;
                name: z.ZodString;
                description: z.ZodOptional<z.ZodString>;
                data: z.ZodObject<{
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
                createdAt: z.ZodDate;
                updatedAt: z.ZodDate;
            }, "strip", z.ZodTypeAny, {
                name: string;
                id: string;
                data: {
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
                };
                createdAt: Date;
                updatedAt: Date;
                description?: string | undefined;
            }, {
                name: string;
                id: string;
                data: {
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
                };
                createdAt: Date;
                updatedAt: Date;
                description?: string | undefined;
            }>>;
        };
        readonly getCurrent: {
            readonly input: z.ZodObject<{}, "strip", z.ZodTypeAny, {}, {}>;
            readonly output: z.ZodNullable<z.ZodObject<{
                id: z.ZodString;
                name: z.ZodString;
                description: z.ZodOptional<z.ZodString>;
                data: z.ZodObject<{
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
                createdAt: z.ZodDate;
                updatedAt: z.ZodDate;
            }, "strip", z.ZodTypeAny, {
                name: string;
                id: string;
                data: {
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
                };
                createdAt: Date;
                updatedAt: Date;
                description?: string | undefined;
            }, {
                name: string;
                id: string;
                data: {
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
                };
                createdAt: Date;
                updatedAt: Date;
                description?: string | undefined;
            }>>;
        };
        readonly create: {
            readonly input: z.ZodObject<{
                name: z.ZodOptional<z.ZodString>;
                description: z.ZodOptional<z.ZodString>;
                data: z.ZodObject<{
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
            }, "strip", z.ZodTypeAny, {
                data: {
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
                };
                name?: string | undefined;
                description?: string | undefined;
            }, {
                data: {
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
                };
                name?: string | undefined;
                description?: string | undefined;
            }>;
            readonly output: z.ZodObject<{
                id: z.ZodString;
                name: z.ZodString;
                description: z.ZodOptional<z.ZodString>;
                data: z.ZodObject<{
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
                createdAt: z.ZodDate;
                updatedAt: z.ZodDate;
            }, "strip", z.ZodTypeAny, {
                name: string;
                id: string;
                data: {
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
                };
                createdAt: Date;
                updatedAt: Date;
                description?: string | undefined;
            }, {
                name: string;
                id: string;
                data: {
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
                };
                createdAt: Date;
                updatedAt: Date;
                description?: string | undefined;
            }>;
        };
        readonly update: {
            readonly input: z.ZodObject<{
                id: z.ZodString;
                data: z.ZodObject<{
                    name: z.ZodOptional<z.ZodString>;
                    description: z.ZodOptional<z.ZodString>;
                    data: z.ZodOptional<z.ZodObject<{
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
                    }>>;
                }, "strip", z.ZodTypeAny, {
                    name?: string | undefined;
                    data?: {
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
                    } | undefined;
                    description?: string | undefined;
                }, {
                    name?: string | undefined;
                    data?: {
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
                    } | undefined;
                    description?: string | undefined;
                }>;
            }, "strip", z.ZodTypeAny, {
                id: string;
                data: {
                    name?: string | undefined;
                    data?: {
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
                    } | undefined;
                    description?: string | undefined;
                };
            }, {
                id: string;
                data: {
                    name?: string | undefined;
                    data?: {
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
                    } | undefined;
                    description?: string | undefined;
                };
            }>;
            readonly output: z.ZodObject<{
                id: z.ZodString;
                name: z.ZodString;
                description: z.ZodOptional<z.ZodString>;
                data: z.ZodObject<{
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
                createdAt: z.ZodDate;
                updatedAt: z.ZodDate;
            }, "strip", z.ZodTypeAny, {
                name: string;
                id: string;
                data: {
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
                };
                createdAt: Date;
                updatedAt: Date;
                description?: string | undefined;
            }, {
                name: string;
                id: string;
                data: {
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
                };
                createdAt: Date;
                updatedAt: Date;
                description?: string | undefined;
            }>;
        };
        readonly delete: {
            readonly input: z.ZodObject<{
                id: z.ZodString;
            }, "strip", z.ZodTypeAny, {
                id: string;
            }, {
                id: string;
            }>;
            readonly output: z.ZodObject<{
                success: z.ZodBoolean;
            }, "strip", z.ZodTypeAny, {
                success: boolean;
            }, {
                success: boolean;
            }>;
        };
        readonly commit: {
            readonly input: z.ZodObject<{
                id: z.ZodString;
                commitData: z.ZodObject<{
                    message: z.ZodString;
                    data: z.ZodObject<{
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
                }, "strip", z.ZodTypeAny, {
                    message: string;
                    data: {
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
                    };
                }, {
                    message: string;
                    data: {
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
                    };
                }>;
            }, "strip", z.ZodTypeAny, {
                id: string;
                commitData: {
                    message: string;
                    data: {
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
                    };
                };
            }, {
                id: string;
                commitData: {
                    message: string;
                    data: {
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
                    };
                };
            }>;
            readonly output: z.ZodObject<{
                id: z.ZodString;
                name: z.ZodString;
                description: z.ZodOptional<z.ZodString>;
                data: z.ZodObject<{
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
                createdAt: z.ZodDate;
                updatedAt: z.ZodDate;
            }, "strip", z.ZodTypeAny, {
                name: string;
                id: string;
                data: {
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
                };
                createdAt: Date;
                updatedAt: Date;
                description?: string | undefined;
            }, {
                name: string;
                id: string;
                data: {
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
                };
                createdAt: Date;
                updatedAt: Date;
                description?: string | undefined;
            }>;
        };
    };
    readonly health: {
        readonly check: {
            readonly input: z.ZodObject<{}, "strip", z.ZodTypeAny, {}, {}>;
            readonly output: z.ZodObject<{
                status: z.ZodString;
                timestamp: z.ZodString;
                service: z.ZodString;
            }, "strip", z.ZodTypeAny, {
                status: string;
                timestamp: string;
                service: string;
            }, {
                status: string;
                timestamp: string;
                service: string;
            }>;
        };
    };
};
export type DataLineageRouterType = typeof DataLineageRouterSchema;
//# sourceMappingURL=router.schema.d.ts.map