import { z } from 'zod';

const Product = z.object({
  name: z.string(),
});

function generateCreateCommand<T, ZodSchema extends z.ZodSchema<T>>(
  tableName: string,
  schema: ZodSchema
) {
  if (schema instanceof z.ZodObject) {
    const shape = schema.shape();
    const properties = Object.entries(shape);
    const createColumns = properties.map(
      ([columnName, schema]) =>
        '  ' + generateCreateColumn(columnName, schema as z.ZodSchema)
    );
    return `CREATE TABLE ${tableName} (
${createColumns.join(',\n')}
);`;
  }
}

function generateCreateColumn<T, ZodSchema extends z.ZodSchema<T>>(
  columnName: string,
  schema: ZodSchema
) {
  const columnType = generateColumnType(schema);

  return `${columnName} ${columnType}`;
}

function generateColumnType(schema: z.ZodSchema) {
  if (schema instanceof z.ZodString) {
    return 'VARCHAR(255)';
  }
  const unsupportedZodTypeName = (schema._def as { typeName: string }).typeName;

  throw new Error(
    `${unsupportedZodTypeName} is not supported to column mapping.`
  );
}
