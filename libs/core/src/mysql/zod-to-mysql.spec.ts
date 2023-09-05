import { z } from 'zod';
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
      categories: z.lazy(() => z.array(ProductCategory)),
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
