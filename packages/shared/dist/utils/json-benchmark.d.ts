declare const performance: any;
declare const superjson: any;
declare const devalueStringify: any, devalueParse: any;
declare const jsonUtils: any;
declare const jsonUtil: any, devalueSerialize: any, devalueDeserialize: any;
declare const createTestData: () => any;
interface BenchmarkResult {
    library: string;
    operation: 'serialize' | 'deserialize';
    iterations: number;
    timeMs: number;
    avgTimePerOp: number;
    outputSize?: number;
    success: boolean;
    error?: string;
}
declare class JsonBenchmark {
    private iterations;
    private testData;
    runBenchmark(): Promise<BenchmarkResult[]>;
    private benchmarkDevalue;
    private benchmarkSuperjson;
    private benchmarkStandardJson;
    private benchmarkJsonUtil;
    private printResults;
}
declare const runJsonBenchmark: () => Promise<BenchmarkResult[]>;
//# sourceMappingURL=json-benchmark.d.ts.map