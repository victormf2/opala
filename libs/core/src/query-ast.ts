import { Model, ModelType } from './model';

class QueryExpression {}
class DataSourceExpression<T> extends QueryExpression {
  private readonly _source?: T;
}
class ModelDataSourceExpression<
  TModel extends Model
> extends DataSourceExpression<ModelType<TModel>> {
  constructor(readonly model: TModel) {
    super();
  }
}
class ConditionalExpression extends QueryExpression {}
class OrExpression extends ConditionalExpression {
  constructor(readonly conditions: ConditionalExpression[]) {
    super();
  }
}
class StringIncludesExpression extends ConditionalExpression {
  constructor(
    readonly value: ValueExpression<string>,
    readonly includes: ValueExpression<string>
  ) {
    super();
  }
}
class ArraySomeExpression<T> extends ConditionalExpression {
  constructor(
    readonly array: ValueExpression<T[]>,
    readonly predicate: ConditionalExpression
  ) {
    super();
  }
}
class ValueExpression<T> extends QueryExpression {
  // Branded
  private readonly _value?: T;
}
class LiteralExpression<T> extends ValueExpression<T> {
  constructor(readonly value: T) {
    super();
  }
}
class PropertyAccessorExpression<
  TValue,
  TKey extends keyof TValue
> extends ValueExpression<TValue[TKey]> {
  constructor(readonly value: ValueExpression<TValue>, readonly key: TKey) {
    super();
  }
}
class ModelExpression<TModel extends Model> extends ValueExpression<
  ModelType<TModel>
> {}
