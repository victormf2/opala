import { HasMany, Model, ModelReferences, ModelType } from './model';
import { Operation } from './operation';

export class QueryBuilder<TModel extends Model, TOutput = ModelType<TModel>> {
  filter(queryFilter: QueryFilter<TModel>): QueryBuilder<TModel, TOutput> {
    throw new Error('not implemented');
  }
  all(): Operation<unknown, TOutput[]> {
    throw new Error('not implemented');
  }
  first(): Operation<unknown, TOutput | undefined> {
    throw new Error('not implemented');
  }
}

export abstract class FilterCommand {}
type QueryFilter<TModel extends Model> = (
  filter: ModelFilterCommands<TModel>
) => FilterCommand;

type FilterCommands<T> = T extends Model ? ModelFilterCommands<T> : never;

type ModelFilterCommands<TModel extends Model> = ObjectFilterCommands<
  ModelType<TModel>
> &
  ReferencesObjectFilterCommands<ModelReferences<TModel>>;

type ObjectFilterCommands<T> = {
  [K in keyof T]: ValueFilterCommands<T[K]> & Negation<T[K]>;
};
type Negation<TValue> = {
  not: ValueFilterCommands<TValue>;
};

type ValueFilterCommands<TValue> = IdentityFilterCommands<TValue> &
  StringFilterCommands<TValue>;

type IdentityFilterCommands<TValue> = {
  equals: (value: TValue) => FilterCommand;
};
type StringFilterCommands<TValue> = TValue extends string
  ? {
      includes: (value: string) => FilterCommand;
    }
  : unknown;
type ArrayFilterCommands<TValue> = TValue extends (infer TElement)[]
  ? {
      some: (
        each: (value: FilterCommands<TElement>) => FilterCommand
      ) => FilterCommand;
    }
  : unknown;

type ReferencesObjectFilterCommands<T> = {
  [K in keyof T]: ReferenceFilterCommands<T[K]> & ReferenceNegation<T[K]>;
};
type ReferenceNegation<TReference> = {
  not: ReferenceFilterCommands<TReference>;
};
type ReferenceFilterCommands<TReference> = HasManyFilterCommands<TReference>;

type HasManyFilterCommands<TReference> = TReference extends HasMany<
  infer TReferencedModel
>
  ? ArrayFilterCommands<TReferencedModel[]>
  : unknown;

export declare function and(...filterCommands: FilterCommand[]): FilterCommand;
export declare function or(...filterCommands: FilterCommand[]): FilterCommand;
