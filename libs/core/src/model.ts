import { KeysOfType, PickByType } from '@app-builder/utils';
import { Infer, ObjectSchemaAny } from './schema';

export abstract class Model<TSchema extends ObjectSchemaAny = ObjectSchemaAny> {
  constructor(readonly schema: TSchema) {}
}
export type ModelType<TModel extends Model> = Infer<TModel['schema']>;
export type ModelShape<TModel extends Model> = TModel['schema']['shape'];

export interface ModelConstructor<TModel extends Model> {
  new (schema: TModel['schema']): TModel;
}

type BaseReference<TReferencedModel extends Model> = {
  referencedModel: TReferencedModel;
};
export type HasMany<TReferencedModel extends Model> =
  BaseReference<TReferencedModel> & {
    referenceType: 'HAS_MANY';
  };
export declare function hasMany<TModel extends Model>(
  reference: () => TModel
): HasMany<TModel>;

export type ModelReference<TReferencedModel extends Model = Model> =
  HasMany<TReferencedModel>;
export type ModelReferences<TModel extends Model> = PickByType<
  TModel,
  ModelReference
>;
export type ModelReferenceKeys<TModel extends Model> = KeysOfType<
  TModel,
  ModelReference
>;

export type ReferencesObject = {
  [K: string]: ModelReference;
};

type ModelWithPrimaryKey<
  TSchema extends ObjectSchemaAny,
  TPrimaryKey extends readonly (keyof TSchema['shape'])[]
> = {
  primaryKey: TPrimaryKey;
};
export type PrimaryKeyShape<TModel extends Model> =
  TModel extends ModelWithPrimaryKey<infer _, infer TPrimaryKey>
    ? Pick<TModel['schema']['shape'], TPrimaryKey[number]>
    : never;
