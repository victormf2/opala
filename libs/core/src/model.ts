import { KeysOfType, PickByType } from '@app-builder/utils';
import { Infer, ObjectSchemaAny } from './schema';

export abstract class Model<TSchema extends ObjectSchemaAny = ObjectSchemaAny> {
  constructor(readonly schema: TSchema) {}
}
export type ModelType<TModel extends Model> = Infer<TModel['schema']>;
export type ModelShape<TModel extends Model> =
  TModel['schema']['config']['shape'];

export interface ModelConstructor<TModel extends Model> {
  new (schema: TModel['schema']): TModel;
}

export abstract class BaseReference<TReferencedModel extends Model> {
  abstract get referencedModel(): TReferencedModel;
}
export class HasMany<
  TReferencedModel extends Model
> extends BaseReference<TReferencedModel> {
  readonly referenceType = 'HAS_MANY' as const;

  constructor(private referenceFn: () => TReferencedModel) {
    super();
  }
  get referencedModel(): TReferencedModel {
    return this.referenceFn();
  }
}
export function hasMany<TModel extends Model>(
  reference: () => TModel
): HasMany<TModel> {
  return new HasMany(reference);
}

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
  TPrimaryKey extends readonly (keyof TSchema['config']['shape'])[]
> = {
  primaryKey: TPrimaryKey;
};
export type PrimaryKeyShape<TModel extends Model> =
  TModel extends ModelWithPrimaryKey<ObjectSchemaAny, infer TPrimaryKey>
    ? Pick<ModelShape<TModel>, TPrimaryKey[number]>
    : never;

export function hasPrimaryKey<TModel extends Model>(
  model: TModel
): model is TModel & { primaryKey: (keyof ModelShape<TModel>)[] } {
  return Array.isArray((model as any).primaryKey);
}
