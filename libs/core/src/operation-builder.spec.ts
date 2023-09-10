/* eslint-disable @typescript-eslint/no-unused-vars */
import { Expect, ExpectExtends } from '@type-challenges/utils';
import { Model, hasMany } from './model';
import { Operation } from './operation';
import { build } from './operation-builder';
import { or } from './query';
import { Infer, number, object, string } from './schema';

const ProductSchema = object({
  id: number().autoGenerated(),
  name: string(),
});
class ProductModel extends Model<typeof ProductSchema> {
  primaryKey = ['id', 'name'] as const;
  categories = hasMany(() => tables.categories);
}

const CategorySchema = object({
  id: number().autoGenerated(),
  name: string(),
});
class CategoryModel extends Model<typeof CategorySchema> {
  primaryKey = ['id'] as const;
  products = hasMany(() => tables.products);
}

const tables = {
  products: new ProductModel(ProductSchema),
  categories: new CategoryModel(CategorySchema),
};

const $ = build(tables);

const simpleCreate = $.create('products');
type SimpleCreate = Expect<
  ExpectExtends<
    Operation<
      {
        id?: number;
        name: string;
      },
      unknown
    >,
    typeof simpleCreate
  >
>;

const getAll = $.using(object({ name: string() })).do(({ name }) =>
  $.from('products')
    .filter((product) =>
      or(
        product.name.includes(name),
        product.categories.some((category) => category.name.includes(name))
      )
    )
    .all()
);
type GetAll = Expect<
  ExpectExtends<
    Operation<
      {
        name: string;
      },
      Infer<typeof ProductSchema>[]
    >,
    typeof getAll
  >
>;

const getFirst = $.using(object({ id: number() })).do(({ id }) =>
  $.from('categories')
    .filter((category) => category.id.equals(id))
    .first()
);
type GetFirst = Expect<
  ExpectExtends<
    Operation<
      {
        id: number;
      },
      Infer<typeof CategorySchema> | undefined
    >,
    typeof getFirst
  >
>;
