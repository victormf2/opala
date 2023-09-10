import { AnyZodObject, ZodTypeAny, z } from 'zod';
import { extendZodSchema } from '../zod-extension';
import { MySqlTable, NumericMySqlColumn } from './types';
import { ZodMySqlTables, getMySqlColumnForZodSchema } from './zod-to-mysql';

extendZodSchema(z);

describe('getMySqlColumnForZodSchema', function () {
  describe('column name', function () {
    it('should assign column name', function () {
      const column = getMySqlColumnForZodSchema('column', z.string());

      expect(column.name).toBe('column');
    });
  });
  describe('supported zod schemas', function () {
    describe('nullable', function () {
      it('should return column definition with nullable = true', function () {
        const column = getMySqlColumnForZodSchema(
          'column',
          z.string().nullable()
        );

        expect(column.nullable).toBe(true);
      });
    });
    describe('optional', function () {
      it('should return column definition with nullable = true', function () {
        const column = getMySqlColumnForZodSchema(
          'column',
          z.string().optional()
        );

        expect(column.nullable).toBe(true);
      });
    });
    describe('nullish', function () {
      it('should return column definition with nullable = true', function () {
        const column = getMySqlColumnForZodSchema(
          'column',
          z.string().nullish()
        );

        expect(column.nullable).toBe(true);
      });
    });

    describe('number', function () {
      describe('not int', function () {
        it('should return column with DOUBLE type by default', function () {
          const column = getMySqlColumnForZodSchema('column', z.number());

          expect(column.type).toBe('DOUBLE');
        });
        it('should return column with DOUBLE type for size 64', function () {
          const column = getMySqlColumnForZodSchema(
            'column',
            z.number().size(64)
          );

          expect(column.type).toBe('DOUBLE');
        });
        it('should return column with FLOAT type for size less than 64', function () {
          const column = getMySqlColumnForZodSchema(
            'column',
            z.number().size(32)
          ) as NumericMySqlColumn;

          expect(column.type).toBe('FLOAT');
        });
      });

      describe('int', function () {
        it('should return column with INT type by default', function () {
          const column = getMySqlColumnForZodSchema('column', z.number().int());

          expect(column.type).toBe('INT');
        });

        it('should return column with TINYINT type for size 8', function () {
          const column = getMySqlColumnForZodSchema(
            'column',
            z.number().int().size(8)
          );

          expect(column.type).toBe('TINYINT');
        });

        it('should return column with SMALLINT type for size 16', function () {
          const column = getMySqlColumnForZodSchema(
            'column',
            z.number().int().size(16)
          );

          expect(column.type).toBe('SMALLINT');
        });

        it('should return column with INT type for size 32', function () {
          const column = getMySqlColumnForZodSchema(
            'column',
            z.number().int().size(32)
          );

          expect(column.type).toBe('INT');
        });

        it('should return column with BIGINT type for size 64', function () {
          const column = getMySqlColumnForZodSchema(
            'column',
            z.number().int().size(64)
          );

          expect(column.type).toBe('BIGINT');
        });
      });
    });

    describe('bigint', function () {
      it('should return column with BIGINT type by default', function () {
        const column = getMySqlColumnForZodSchema('column', z.bigint());

        expect(column.type).toBe('BIGINT');
      });
    });

    describe('boolean', function () {
      it('should return column with BOOLEAN type by default', function () {
        const column = getMySqlColumnForZodSchema('column', z.boolean());

        expect(column.type).toBe('BOOLEAN');
      });
    });
  });
});

describe('getMySqlTableForZodSchema', function () {
  it('should return table according to object shape', function () {
    const Product = z.object({
      id: z.number().int(),
      name: z.string(),
    });

    const ProductCategory = z.object({
      id: z.number().int(),
      name: z.string(),
      productId: z.number().int(),
    });
    const zodTables = new ZodMySqlTables({
      product: Product,
      productCategory: ProductCategory,
    });

    const productTable = zodTables.getTable('product');
    const table = zodTables.getTable('productCategory');
    expect(table).toEqual<MySqlTable>({
      name: 'productCategory',
      columns: [
        {
          is: 'numeric',
          name: 'id',
          nullable: false,
          signed: true,
          type: 'INT',
        },
        {
          is: 'string',
          name: 'name',
          nullable: false,
          type: 'VARCHAR',
        },
        {
          is: 'numeric',
          name: 'productId',
          nullable: false,
          signed: true,
          type: 'INT',
        },
      ],
      primaryKey: ['id'],
      foreignKeys: [
        {
          table: productTable,
          references: ['productId'],
        },
      ],
    });
  });
});

const Product = z.object({
  id: z.number().int(),
  name: z.string(),
});
const ProductCategory = z.object({
  id: z.number().int(),
  name: z.string(),
  productId: z.number().int(),
});

const n = {
  schema: ProductCategory,
  primaryKey: ['id'],
  references: {
    product: {
      belongsToOne: Product,
      referencedBy: ['productId'],
    },
  },
};

const f = {
  schema: Product,
  primaryKey: ['id'],
  references: {
    category: {
      hasOne: ProductCategory,
      referencedBy: ['productId'],
    },
  },
};

type HasOneReference<
  Schema extends AnyZodObject = AnyZodObject,
  ForeignKey extends (keyof Schema['shape'])[] = []
> = {
  hasOne: Schema;
  referencedBy: ForeignKey;
};
type BelongsToOneReference<
  ParentSchema extends AnyZodObject = AnyZodObject,
  ChildSchema extends AnyZodObject = AnyZodObject,
  ForeignKey extends (keyof ChildSchema['shape'])[] = (keyof ChildSchema['shape'])[]
> = {
  belongsToOne: ParentSchema;
  referencedBy: ForeignKey;
};
type Reference<
  Schema extends AnyZodObject = AnyZodObject,
  SchemaForeignKey extends (keyof Schema['shape'])[] = (keyof Schema['shape'])[],
  RelatedSchema extends AnyZodObject = AnyZodObject,
  RelatedSchemaForeignKey extends (keyof RelatedSchema['shape'])[] = (keyof RelatedSchema['shape'])[]
> =
  | HasOneReference<RelatedSchema, RelatedSchemaForeignKey>
  | BelongsToOneReference<RelatedSchema, Schema, SchemaForeignKey>;

type SchemaDefinition<
  Schema extends AnyZodObject,
  PrimaryKey extends (keyof Schema['shape'])[],
  References extends Record<string, Reference<Schema>>
> = {
  schema: Schema;
  primaryKey: PrimaryKey;
  references: References;
};

function n2<
  Schema extends AnyZodObject,
  PrimaryKey extends (keyof Schema['shape'])[],
  References extends Record<string, Reference>
>(s: SchemaDefinition<Schema, PrimaryKey, References>) {
  return null;
}

interface Model<Schema extends AnyZodObject> {
  schema: Schema;
  hasPrimaryKey<PrimaryKey extends (keyof Schema['shape'])[]>(
    primaryKey: PrimaryKey
  ): this & { primaryKey: PrimaryKey };
  hasOne<
    Key extends string,
    RelatedSchema extends AnyZodObject,
    ForeignKey extends (keyof RelatedSchema['shape'])[]
  >(
    key: Key,
    relatedSchema: RelatedSchema,
    foreignKey: ForeignKey
  ): this & {
    references: {
      [K in Key]: { hasOne: RelatedSchema; referencedBy: ForeignKey };
    };
  };
  hasMany<
    Key extends string,
    RelatedSchema extends AnyZodObject,
    ForeignKey extends (keyof RelatedSchema['shape'])[]
  >(
    key: Key,
    relatedSchema: RelatedSchema,
    foreignKey: ForeignKey
  ): this & {
    references: {
      [K in Key]: { hasMany: RelatedSchema; referencedBy: ForeignKey };
    };
  };
}

function model<Schema extends AnyZodObject>(schema: Schema): Model<Schema> {
  throw new Error('nor implemented');
}

const ProductModel = model(Product)
  .hasPrimaryKey(['id'])
  .hasMany('cateogories', ProductCategory, ['productId'])
  .hasOne('category', ProductCategory, ['productId']);

// getAll(ProductModel).withMany('categories')

type KeysOfType<T, Type> = {
  [K in keyof T]: T[K] extends Type ? K : never;
}[keyof T];

type HasManyReference = {
  hasMany: AnyZodObject;
};

type HasManyReferenceKeys<T> = T extends { references: infer R }
  ? KeysOfType<R, { hasMany: AnyZodObject }>
  : never;

type GetHasManyReferenceType<T, K> = T extends { references: infer R }
  ? K extends keyof R
    ? R[K] extends { hasMany: infer Schema }
      ? Schema extends ZodTypeAny
        ? z.infer<Schema>[]
        : never
      : never
    : never
  : never;
interface GetAll<
  SchemaModel extends Model<AnyZodObject>,
  T = z.infer<SchemaModel['schema']>
> {
  withMany<Key extends HasManyReferenceKeys<SchemaModel>>(
    key: Key
  ): GetAll<
    SchemaModel,
    T & { [K in Key]: GetHasManyReferenceType<SchemaModel, K> }
  >;
  execute(): T;
}

function getAll<SchemaModel extends Model<AnyZodObject>>(
  model: SchemaModel
): GetAll<SchemaModel> {
  throw new Error('not implemented');
}

const all = getAll(ProductModel).withMany('cateogories').execute();
