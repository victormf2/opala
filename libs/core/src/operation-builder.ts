import { Create } from './create';
import { Model } from './model';
import { Operation } from './operation';
import { QueryBuilder } from './query';
import { Infer, Schema } from './schema';

export type Tables = {
  [tableName: string]: Model;
};
type TableNames<TTables extends Tables> = keyof TTables;

export declare function build<TTables extends Tables>(
  tables: TTables
): OperationsBuilder<TTables>;

export type OperationsBuilder<TTables extends Tables> = {
  using: <TSchema extends Schema>(schema: TSchema) => Chain<TSchema>;
  from: <TTableName extends TableNames<TTables>>(
    tableName: TTableName
  ) => QueryBuilder<TTables[TTableName]>;
  create: <TTableName extends TableNames<TTables>>(
    tableName: TTableName
  ) => Create<TTables[TTableName]>;
};

type Chain<TSchema extends Schema> = {
  do: <TOutput>(
    chain: (input: Infer<TSchema>) => Operation<unknown, TOutput>
  ) => Operation<Infer<TSchema>, TOutput>;
};
