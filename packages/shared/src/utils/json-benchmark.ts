const { _performance: _performance } = require('perf_hooks');
const superjson = require('superjson');
const { stringify: devalueStringify, parse: devalueParse } = require('devalue');
const jsonUtils = require('./json');
const { jsonUtil, devalueSerialize, devalueDeserialize } = jsonUtils;

// Test data with circular references and complex structures
const createTestData = () => {
  const obj: any = {
    id: 'test-123',
    name: 'Performance Test Object',
    timestamp: new Date(),
    numbers: [1, 2, 3, 4, 5],
    nested: {
      level1: {
        level2: {
          data: 'deep nested value',
          array: Array.from({ length: 100 }, (_, i) => ({ id: i, value: `item-${i}` }))
        }
      }
    },
    metadata: new Map<string, any>([
      ['key1', 'value1'],
      ['key2', { complex: true, data: [1, 2, 3] }]
    ]),
    tags: new Set(['tag1', 'tag2', 'tag3'])
  };
  
  // Add circular reference
  obj.self = obj;
  obj.nested.parent = obj;
  
  return obj;
};

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

class JsonBenchmark {
  private iterations = 10000;
  private testData = createTestData();
  
  async runBenchmark(): Promise<BenchmarkResult[]> {
    const results: BenchmarkResult[] = [];
    
    console.log('🚀 Starting JSON Performance Benchmark');
    console.log(`📊 Test iterations: ${this.iterations}`);
    console.log(`📦 Test data complexity: ${JSON.stringify(this.testData).length} chars (without circular refs)`);
    console.log('\n' + '='.repeat(80));
    
    // Benchmark devalue
    results.push(await this.benchmarkDevalue());
    
    // Benchmark superjson
    results.push(await this.benchmarkSuperjson());
    
    // Benchmark standard JSON (will fail with circular refs)
    results.push(await this.benchmarkStandardJson());
    
    // Benchmark our utility functions
    results.push(await this.benchmarkJsonUtil());
    
    this.printResults(results);
    return results;
  }
  
  private async benchmarkDevalue(): Promise<BenchmarkResult> {
    console.log('🔄 Benchmarking devalue...');
    
    try {
      // Serialize benchmark
      const start = _performance.now();
      let serialized: string = '';
      
      for (let i = 0; i < this.iterations; i++) {
        serialized = devalueStringify(this.testData);
      }
      
      const serializeTime = _performance.now() - start;
      
      // Deserialize benchmark
      const deserializeStart = _performance.now();
      
      for (let i = 0; i < this.iterations; i++) {
        devalueParse(serialized);
      }
      
      const deserializeTime = _performance.now() - deserializeStart;
      
      return {
        library: 'devalue',
        operation: 'serialize',
        iterations: this.iterations,
        timeMs: serializeTime,
        avgTimePerOp: serializeTime / this.iterations,
        outputSize: serialized.length,
        success: true
      };
    } catch (error) {
      return {
        library: 'devalue',
        operation: 'serialize',
        iterations: 0,
        timeMs: 0,
        avgTimePerOp: 0,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
  
  private async benchmarkSuperjson(): Promise<BenchmarkResult> {
    console.log('🔄 Benchmarking superjson...');
    
    try {
      // Remove circular references for superjson test
      const testDataCopy = { ...this.testData };
      delete testDataCopy.self;
      delete testDataCopy.nested.parent;
      
      const start = _performance.now();
      let serialized: string = '';
      
      for (let i = 0; i < this.iterations; i++) {
        serialized = superjson.stringify(testDataCopy);
      }
      
      const serializeTime = _performance.now() - start;
      
      return {
        library: 'superjson',
        operation: 'serialize',
        iterations: this.iterations,
        timeMs: serializeTime,
        avgTimePerOp: serializeTime / this.iterations,
        outputSize: serialized.length,
        success: true
      };
    } catch (error) {
      return {
        library: 'superjson',
        operation: 'serialize',
        iterations: 0,
        timeMs: 0,
        avgTimePerOp: 0,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
  
  private async benchmarkStandardJson(): Promise<BenchmarkResult> {
    console.log('🔄 Benchmarking standard JSON.stringify...');
    
    try {
      // Remove circular references for standard JSON test
      const testDataCopy = { ...this.testData };
      delete testDataCopy.self;
      delete testDataCopy.nested.parent;
      // Convert Map and Set to plain objects/arrays
      testDataCopy.metadata = Object.fromEntries(testDataCopy.metadata);
      testDataCopy.tags = Array.from(testDataCopy.tags);
      
      const start = _performance.now();
      let serialized: string = '';
      
      for (let i = 0; i < this.iterations; i++) {
        serialized = JSON.stringify(testDataCopy);
      }
      
      const serializeTime = _performance.now() - start;
      
      return {
        library: 'JSON.stringify',
        operation: 'serialize',
        iterations: this.iterations,
        timeMs: serializeTime,
        avgTimePerOp: serializeTime / this.iterations,
        outputSize: serialized.length,
        success: true
      };
    } catch (error) {
      return {
        library: 'JSON.stringify',
        operation: 'serialize',
        iterations: 0,
        timeMs: 0,
        avgTimePerOp: 0,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
  
  private async benchmarkJsonUtil(): Promise<BenchmarkResult> {
    console.log('🔄 Benchmarking jsonUtil with devalue optimization...');
    
    try {
      const start = _performance.now();
      let serialized: string = '';
      
      for (let i = 0; i < this.iterations; i++) {
        serialized = jsonUtil.serialize(this.testData);
      }
      
      const serializeTime = _performance.now() - start;
      
      return {
        library: 'jsonUtil (devalue)',
        operation: 'serialize',
        iterations: this.iterations,
        timeMs: serializeTime,
        avgTimePerOp: serializeTime / this.iterations,
        outputSize: serialized.length,
        success: true
      };
    } catch (error) {
      return {
        library: 'jsonUtil (devalue)',
        operation: 'serialize',
        iterations: 0,
        timeMs: 0,
        avgTimePerOp: 0,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
  
  private printResults(results: BenchmarkResult[]): void {
    console.log('\n📈 BENCHMARK RESULTS');
    console.log('='.repeat(80));
    
    const successfulResults = results.filter(r => r.success);
    
    if (successfulResults.length === 0) {
      console.log('❌ No successful benchmarks');
      return;
    }
    
    // Sort by _performance (fastest first)
    successfulResults.sort((a, b) => a.timeMs - b.timeMs);
    
    console.log('\n🏆 PERFORMANCE RANKING (Serialization):');
    successfulResults.forEach((result, index) => {
      const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '  ';
      const speedup = index === 0 ? '' : ` (${(result.timeMs / successfulResults[0].timeMs).toFixed(2)}x slower)`;
      
      console.log(`${medal} ${result.library}:`);
      console.log(`   ⏱️  Total time: ${result.timeMs.toFixed(2)}ms`);
      console.log(`   ⚡ Avg per op: ${(result.avgTimePerOp * 1000).toFixed(3)}μs${speedup}`);
      console.log(`   📦 Output size: ${result.outputSize} bytes`);
      console.log('');
    });
    
    // Show failed benchmarks
    const failedResults = results.filter(r => !r.success);
    if (failedResults.length > 0) {
      console.log('❌ FAILED BENCHMARKS:');
      failedResults.forEach(result => {
        console.log(`   ${result.library}: ${result.error}`);
      });
      console.log('');
    }
    
    // Performance insights
    if (successfulResults.length >= 2) {
      const fastest = successfulResults[0];
      const slowest = successfulResults[successfulResults.length - 1];
      const improvement = (slowest.timeMs / fastest.timeMs).toFixed(2);
      
      console.log('💡 KEY INSIGHTS:');
      console.log(`   🚀 ${fastest.library} is ${improvement}x faster than ${slowest.library}`);
      
      const devalueResult = successfulResults.find(r => r.library === 'devalue');
      if (devalueResult) {
        console.log(`   🔄 devalue handles circular references seamlessly`);
        console.log(`   📊 devalue output: ${devalueResult.outputSize} bytes`);
      }
      
      console.log(`   ⚡ Best _performance: ${(fastest.avgTimePerOp * 1000).toFixed(3)}μs per operation`);
    }
    
    console.log('\n' + '='.repeat(80));
  }
}

// Export for use in tests or manual execution
const runJsonBenchmark = async (): Promise<BenchmarkResult[]> => {
  const benchmark = new JsonBenchmark();
  return benchmark.runBenchmark();
};

// Auto-run if this file is executed directly
if (require.main === module) {
  runJsonBenchmark().catch(console.error);
}

module.exports = { runJsonBenchmark };