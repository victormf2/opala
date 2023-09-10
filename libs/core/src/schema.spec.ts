import { Schema, SchemaConfig, object } from './schema';

describe('optional', function () {
  it('should clone schema with isOptional: true', function () {
    const schema = object({}).optional();
    expect(schema.config.isOptional).toBe(true);
  });
  it('should not erase other schema config attributs', function () {
    class FakeSchema extends Schema<
      unknown,
      SchemaConfig & { a: number; b: string }
    > {
      constructor() {
        super({ a: 12, b: 'cd' });
      }
    }
    const schema = new FakeSchema().optional();
    expect(schema.config.a).toBe(12);
    expect(schema.config.b).toBe('cd');
  });
});
