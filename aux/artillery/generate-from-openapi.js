const fs = require('fs');
const path = require('path');

async function fetchOpenApiSpec() {
  try {
    const response = await fetch('http://localhost:3000/api/docs-json');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Ошибка при получении OpenAPI спецификации:', error);
    
    try {
      const specPath = path.join(__dirname, './', 'openapi-spec.json');
      const specContent = fs.readFileSync(specPath, 'utf8');
      return JSON.parse(specContent);
    } catch (fileError) {
      console.error('Ошибка при чтении файла спецификации:', fileError);
      throw error;
    }
  }
}

function generateTestScenario(path, method, operation) {
  const scenario = {
    name: `${method.toUpperCase()} ${path}`,
    flow: []
  };

  const step = {
    [method]: {
      url: path
    }
  };

  if (operation.parameters) {
    const queryParams = operation.parameters.filter(p => p.in === 'query');
    const pathParams = operation.parameters.filter(p => p.in === 'path');
    
    if (queryParams.length > 0) {
      step[method].qs = {};
      queryParams.forEach(param => {
        if (param.schema && param.schema.example) {
          step[method].qs[param.name] = param.schema.example;
        } else if (param.schema && param.schema.type === 'number') {
          step[method].qs[param.name] = 10;
        } else if (param.schema && param.schema.type === 'string') {
          step[method].qs[param.name] = 'тест';
        }
      });
    }

    if (pathParams.length > 0) {
      pathParams.forEach(param => {
        const placeholder = `{{ ${param.name} }}`;
        step[method].url = step[method].url.replace(`{${param.name}}`, placeholder);
      });
    }
  }

  if (operation.requestBody && operation.requestBody.content && operation.requestBody.content['application/json']) {
    const schema = operation.requestBody.content['application/json'].schema;
    step[method].json = generateExampleData(schema);
  }

  if (operation.responses && operation.responses['200']) {
    step[method].expect = [{ statusCode: 200 }];
  } else if (operation.responses && operation.responses['201']) {
    step[method].expect = [{ statusCode: 201 }];
  }

  scenario.flow.push(step);
  return scenario;
}

function generateExampleData(schema) {
  if (!schema || !schema.properties) {
    return {};
  }

  const example = {};
  
  Object.keys(schema.properties).forEach(key => {
    const prop = schema.properties[key];
    
    if (prop.example !== undefined) {
      example[key] = prop.example;
    } else if (prop.type === 'string') {
      example[key] = `Тестовое значение для ${key}`;
    } else if (prop.type === 'number') {
      example[key] = 123;
    } else if (prop.type === 'boolean') {
      example[key] = true;
    } else if (prop.type === 'object') {
      example[key] = generateExampleData(prop);
    } else if (prop.type === 'array') {
      example[key] = [];
    }
  });

  return example;
}

function generateArtilleryConfig(openApiSpec) {
  const config = {
    config: {
      target: 'http://localhost:3000',
      phases: [
        {
          duration: 60,
          arrivalRate: 5,
          name: "Автоматически сгенерированный тест"
        }
      ],
      defaults: {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    },
    scenarios: []
  };

  Object.keys(openApiSpec.paths).forEach(path => {
    const pathItem = openApiSpec.paths[path];
    
    Object.keys(pathItem).forEach(method => {
      if (['get', 'post', 'put', 'delete', 'patch'].includes(method)) {
        const operation = pathItem[method];
        const scenario = generateTestScenario(path, method, operation);
        config.scenarios.push(scenario);
      }
    });
  });

  return config;
}

async function main() {
  try {
    console.log('Получение OpenAPI спецификации...');
    const openApiSpec = await fetchOpenApiSpec();
    
    console.log('Генерация конфигурации Artillery...');
    const artilleryConfig = generateArtilleryConfig(openApiSpec);
    
    const yamlContent = `# Автоматически сгенерированный тест из OpenAPI спецификации
# Сгенерировано: ${new Date().toISOString()}

config:
  target: '${artilleryConfig.config.target}'
  phases:
${artilleryConfig.config.phases.map(phase => 
  `    - duration: ${phase.duration}
      arrivalRate: ${phase.arrivalRate}
      name: "${phase.name}"`
).join('\n')}
  defaults:
    headers:
      Content-Type: 'application/json'

scenarios:
${artilleryConfig.scenarios.map((scenario, index) => 
  `  - name: "${scenario.name}"
    weight: ${Math.floor(100 / artilleryConfig.scenarios.length)}
    flow:
${scenario.flow.map(step => {
  const method = Object.keys(step)[0];
  const stepConfig = step[method];
  let stepYaml = `      - ${method}:\n          url: "${stepConfig.url}"`;
  
  if (stepConfig.qs) {
    stepYaml += '\n          qs:';
    Object.keys(stepConfig.qs).forEach(key => {
      stepYaml += `\n            ${key}: "${stepConfig.qs[key]}"`;
    });
  }
  
  if (stepConfig.json) {
    stepYaml += '\n          json:';
    stepYaml += '\n            ' + JSON.stringify(stepConfig.json, null, 12).split('\n').join('\n            ');
  }
  
  if (stepConfig.expect) {
    stepYaml += '\n          expect:';
    stepConfig.expect.forEach(expectation => {
      stepYaml += `\n            - statusCode: ${expectation.statusCode}`;
    });
  }
  
  return stepYaml;
}).join('\n')}`
).join('\n\n')}`;

    const outputPath = path.join(__dirname, 'auto-generated-test.yml');
    fs.writeFileSync(outputPath, yamlContent);
    
    console.log(`✅ Конфигурация Artillery сохранена в: ${outputPath}`);
    console.log(`📊 Сгенерировано ${artilleryConfig.scenarios.length} сценариев тестирования`);
    console.log('\nДля запуска теста выполните:');
    console.log(`artillery run ${outputPath}`);
    
  } catch (error) {
    console.error('❌ Ошибка при генерации тестов:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { generateArtilleryConfig, fetchOpenApiSpec };