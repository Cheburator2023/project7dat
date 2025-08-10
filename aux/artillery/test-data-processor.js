const { faker } = require('@faker-js/faker');

function generateRandomString() {
  return faker.string.alphanumeric(8);
}

function generateTestEntity() {
  return {
    id: faker.string.uuid(),
    name: faker.company.name(),
    type: faker.helpers.arrayElement(['database', 'table', 'view', 'procedure']),
    properties: {
      schema: faker.database.column(),
      created: faker.date.past().toISOString()
    }
  };
}

function generateTestMapping() {
  return {
    id: faker.string.uuid(),
    sourceId: faker.string.uuid(),
    targetId: faker.string.uuid(),
    type: faker.helpers.arrayElement(['direct', 'transformation', 'aggregation']),
    properties: {
      confidence: faker.number.float({ min: 0.1, max: 1.0, fractionDigits: 2 })
    }
  };
}

function generateComplexTestData() {
  const entitiesCount = faker.number.int({ min: 5, max: 20 });
  const mappingsCount = faker.number.int({ min: 3, max: 15 });
  
  const entities = Array.from({ length: entitiesCount }, generateTestEntity);
  const mappings = Array.from({ length: mappingsCount }, generateTestMapping);
  
  return {
    entities,
    mappings,
    metadata: {
      version: faker.system.semver(),
      created: faker.date.recent().toISOString(),
      author: faker.person.fullName()
    }
  };
}

module.exports = {
  generateRandomString,
  generateTestEntity,
  generateTestMapping,
  generateComplexTestData,
  
  setRandomString: function(context, events, done) {
    context.vars.randomString = generateRandomString();
    return done();
  },
  
  setComplexData: function(context, events, done) {
    context.vars.complexData = generateComplexTestData();
    return done();
  },
  
  setTestDocument: function(context, events, done) {
    context.vars.testDocument = {
      name: `Тестовый документ ${generateRandomString()}`,
      description: `Автоматически созданный документ ${faker.lorem.sentence()}`,
      data: generateComplexTestData()
    };
    return done();
  }
};