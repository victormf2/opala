import { capitalize } from '@app-builder/utils';
import {
  AnyZodObject,
  ZodArray,
  ZodBigInt,
  ZodBoolean,
  ZodLazy,
  ZodNullable,
  ZodNumber,
  ZodOptional,
  ZodString,
  ZodTypeAny,
} from 'zod';
import {
  MySqlColumn,
  MySqlNumericType,
  MySqlTable,
  NumericMySqlColumn,
  StringMySqlColumn,
} from './types';

export class ZodMySqlTables<TableMapping extends Record<string, AnyZodObject>> {
  private readonly map: Map<AnyZodObject, MySqlTable> = new Map();
  constructor(readonly schemas: TableMapping) {
    for (const tableName in schemas) {
      this.getTable(tableName);
    }
  }

  getTable(
    tableNameOrSchema: (keyof TableMapping & string) | AnyZodObject
  ): MySqlTable {
    const { schema, tableName } = this.getTableNameAndSchema(tableNameOrSchema);

    const computedTable = this.map.get(schema);
    if (computedTable != null) {
      return computedTable;
    }

    const shape = schema.shape;

    const referenceSchemas: { name: string; schema: ZodTypeAny }[] = [];
    const columnSchemas: { name: string; schema: ZodTypeAny }[] = [];
    for (const key in shape) {
      if (this.isReference(shape[key])) {
        referenceSchemas.push({ name: key, schema: shape[key] });
      } else {
        columnSchemas.push({ name: key, schema: shape[key] });
      }
    }

    const mySqlTable: MySqlTable = {
      name: tableName,
      columns: columnSchemas.map(({ name, schema }) =>
        getMySqlColumnForZodSchema(name, schema)
      ),
      primaryKey: ['id'],
      foreignKeys: [],
    };

    for (const { name, schema } of referenceSchemas) {
      this.addReference(mySqlTable, name, schema);
    }

    this.map.set(schema, mySqlTable);
    return mySqlTable;
  }

  private isReference(zodSchema: unknown) {
    return zodSchema instanceof ZodLazy;
  }

  private getTableNameAndSchema(
    tableNameOrSchema: (keyof TableMapping & string) | AnyZodObject
  ) {
    if (typeof tableNameOrSchema === 'string') {
      const tableName = tableNameOrSchema;
      const schema = this.schemas[tableName];
      return { schema, tableName };
    }

    for (const tableName in this.schemas) {
      const schema = this.schemas[tableName];
      if (schema === tableNameOrSchema) {
        return { tableName, schema };
      }
    }

    throw new Error('Could not find schema or table name');
  }

  private addReference(
    mySqlTable: MySqlTable,
    name: string,
    schema: ZodTypeAny
  ) {
    if (schema instanceof ZodLazy) {
      const innerSchema = schema.schema;
      if (innerSchema instanceof ZodArray) {
        const referenceSchema = innerSchema.element;
        const table = this.getTable(referenceSchema);
        table.foreignKeys.push({
          table: mySqlTable,
          references: this.getReferencesTo(mySqlTable),
        });
      }
    }
  }

  private getReferencesTo(table: MySqlTable) {
    return table.primaryKey.map((pkName) => table.name + capitalize(pkName));
  }
}

export function getMySqlColumnForZodSchema(
  columnName: string,
  schema: ZodTypeAny
): MySqlColumn {
  const nullable =
    schema instanceof ZodOptional || schema instanceof ZodNullable;
  const innerSchema = getInnerSchema(schema);

  if (innerSchema instanceof ZodString) {
    const stringColumn: StringMySqlColumn = {
      is: 'string',
      name: columnName,
      nullable,
      type: 'VARCHAR',
    };
    return stringColumn;
  }

  if (innerSchema instanceof ZodNumber) {
    const type = getNumericMySqlTypeForZodSchema(innerSchema);
    const numericColumn: NumericMySqlColumn = {
      is: 'numeric',
      name: columnName,
      nullable,
      type,
      signed: true,
    };
    return numericColumn;
  }

  if (innerSchema instanceof ZodBoolean) {
    const numericColumn: NumericMySqlColumn = {
      is: 'numeric',
      name: columnName,
      nullable,
      type: 'BOOLEAN',
      signed: true,
    };
    return numericColumn;
  }

  if (innerSchema instanceof ZodBigInt) {
    const numericColumn: NumericMySqlColumn = {
      is: 'numeric',
      name: columnName,
      nullable,
      type: 'BIGINT',
      signed: true,
    };
    return numericColumn;
  }

  throw new Error(
    `Unsupported zod type to mysql column mapping: ${getZodSchemaTypeName(
      innerSchema
    )}`
  );
}

function getInnerSchema(schema: ZodTypeAny): ZodTypeAny {
  if (schema instanceof ZodOptional) {
    return getInnerSchema(schema.unwrap());
  }
  if (schema instanceof ZodNullable) {
    return getInnerSchema(schema.unwrap());
  }
  return schema;
}

function getNumericMySqlTypeForZodSchema(schema: ZodNumber): MySqlNumericType {
  if (schema.isInt) {
    if (typeof schema._def.bitsize !== 'number') {
      return 'INT';
    }
    if (schema._def.bitsize === 8) {
      return 'TINYINT';
    }
    if (schema._def.bitsize === 16) {
      return 'SMALLINT';
    }
    if (schema._def.bitsize === 32) {
      return 'INT';
    }
    return 'BIGINT';
  }
  if (typeof schema._def.bitsize !== 'number') {
    return 'DOUBLE';
  }
  if (schema._def.bitsize === 64) {
    return 'DOUBLE';
  }
  return 'FLOAT';
}

function getZodSchemaTypeName(schema: ZodTypeAny) {
  return schema._def.typeName;
}
