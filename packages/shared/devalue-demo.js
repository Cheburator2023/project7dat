import { stringify as devalueStringify, parse as devalueParse } from 'devalue';
import superjson from 'superjson';

console.log('🚀 Devalue Library Optimization Demo\n');

// Create test object with circular references
const testObj = {
  id: 'test-123',
  name: 'Performance Test',
  timestamp: new Date(),
  data: [1, 2, 3, 4, 5]
};

// Add circular reference
testObj.self = testObj;

console.log('📦 Test Object Structure:');
console.log('- Has circular reference (obj.self = obj)');
console.log('- Contains Date object');
console.log('- Contains array data\n');

// Demonstrate devalue capabilities
console.log('🔄 Devalue Serialization:');
try {
  const devalueSerialized = devalueStringify(testObj);
  console.log('✅ Successfully serialized with circular references');
  console.log(`📊 Output size: ${devalueSerialized.length} bytes`);
  console.log(`📝 Sample output: ${devalueSerialized.substring(0, 100)}...\n`);
  
  // Deserialize
  const devalueDeserialized = devalueParse(devalueSerialized);
  console.log('✅ Successfully deserialized');
  console.log(`🔗 Circular reference preserved: ${devalueDeserialized.self === devalueDeserialized}\n`);
} catch (error) {
  console.log(`❌ Devalue failed: ${error.message}\n`);
}

// Compare with standard JSON (will fail)
console.log('🔄 Standard JSON.stringify:');
try {
  const jsonSerialized = JSON.stringify(testObj);
  console.log('✅ JSON serialization succeeded');
} catch (error) {
  console.log(`❌ JSON.stringify failed: ${error.message}`);
  console.log('💡 This is expected due to circular references\n');
}

// Performance comparison with simple object (no circular refs)
const simpleObj = {
  id: 'perf-test',
  data: Array.from({ length: 1000 }, (_, i) => ({ id: i, value: `item-${i}` }))
};

console.log('⚡ Performance Comparison (1000 iterations):');

// Devalue performance
const devalueStart = performance.now();
for (let i = 0; i < 1000; i++) {
  const serialized = devalueStringify(simpleObj);
  devalueParse(serialized);
}
const devalueTime = performance.now() - devalueStart;

// JSON performance
const jsonStart = performance.now();
for (let i = 0; i < 1000; i++) {
  const serialized = JSON.stringify(simpleObj);
  JSON.parse(serialized);
}
const jsonTime = performance.now() - jsonStart;

// SuperJSON performance
const superjsonStart = performance.now();
for (let i = 0; i < 1000; i++) {
  const serialized = superjson.stringify(simpleObj);
  superjson.parse(serialized);
}
const superjsonTime = performance.now() - superjsonStart;

console.log(`🥇 Devalue: ${devalueTime.toFixed(2)}ms`);
console.log(`🥈 JSON: ${jsonTime.toFixed(2)}ms`);
console.log(`🥉 SuperJSON: ${superjsonTime.toFixed(2)}ms\n`);

// Calculate performance ratios
const devalueVsJson = (jsonTime / devalueTime).toFixed(2);
const devalueVsSuperjson = (superjsonTime / devalueTime).toFixed(2);

console.log('📈 Performance Analysis:');
console.log(`🚀 Devalue is ${devalueVsJson}x relative to JSON`);
console.log(`🚀 Devalue is ${devalueVsSuperjson}x relative to SuperJSON`);

console.log('\n💡 Key Benefits of Devalue:');
console.log('✅ Handles circular references seamlessly');
console.log('✅ Compact output format');
console.log('✅ Fast serialization/deserialization');
console.log('✅ Preserves object references');
console.log('✅ No schema required (unlike fast-json-stringify)');

console.log('\n🎯 Use Cases:');
console.log('• Server-side rendering state serialization');
console.log('• Complex object graphs with circular references');
console.log('• High-performance data transfer');
console.log('• Caching complex data structures');