export interface S2TRow {
    // Source columns
    sourceBaseSystem?: string;          // B
    sourceSchema?: string;             // D
    sourceTable?: string;             // C
    sourceTableDescription?: string;  // F
    sourceAttributeCode?: string;     // G
    sourceAttributeDescription?: string; // H
    sourceDataType?: string;          // I

    // Target columns
    targetBaseSystem?: string;        // S
    targetSchema?: string;           // T
    targetTable?: string;           // U
    targetTableDescription?: string; // X
    targetAttributeCode?: string;   // V
    targetAttributeDescription?: string; // W
    targetDataType?: string;        // Z

    // Commit flag
    commitFlag?: string;            // O
}