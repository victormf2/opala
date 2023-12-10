import { KeysOfType, PickByType } from '@app-builder/utils'
import { Infer, ObjectSchemaAny, isPrimaryKey, isUnique } from './schema'

export type Index = Readonly<{
  name: string
  isUnique: boolean
  attributes: string[]
}>
export abstract class Model<TSchema extends ObjectSchemaAny = ObjectSchemaAny> {
  readonly primaryKeyAttributes: readonly string[]
  readonly indexes: readonly Index[]
  constructor(readonly schema: TSchema) {
    const primaryKeyAttributes: string[] = []
    const indexes: Index[] = []
    for (const attributeName in schema.config.shape) {
      const attributeSchema = schema.config.shape[attributeName]

      if (isPrimaryKey(attributeSchema)) {
        primaryKeyAttributes.push(attributeName)
      }
      if (isUnique(attributeSchema)) {
        const uniquenessKey =
          attributeSchema.config.uniquenessKey ?? `${attributeName}_unique`
        const index = indexes.find((index) => index.name === uniquenessKey)
        if (index != null) {
          index.attributes.push(attributeName)
        } else {
          const newIndex: Index = {
            name: uniquenessKey,
            isUnique: true,
            attributes: [attributeName],
          }
          indexes.push(newIndex)
        }
      }
    }

    if (primaryKeyAttributes.length === 0) {
      throw new Error('Schema must have at least one primary key attribute')
    }

    this.primaryKeyAttributes = primaryKeyAttributes
    this.indexes = indexes
  }
}
export type ModelType<TModel extends Model> = Infer<TModel['schema']>
export type ModelShape<TModel extends Model> =
  TModel['schema']['config']['shape']

export interface ModelConstructor<TModel extends Model> {
  new (schema: TModel['schema']): TModel
}

export abstract class BaseReference<TReferencedModel extends Model> {
  constructor(protected referenceFn: () => TReferencedModel) {}

  get referencedModel(): TReferencedModel {
    return this.referenceFn()
  }
}
export class HasMany<
  TReferencedModel extends Model
> extends BaseReference<TReferencedModel> {
  readonly referenceType = 'HAS_MANY' as const
}
export function hasMany<TModel extends Model>(
  reference: () => TModel
): HasMany<TModel> {
  return new HasMany(reference)
}

export class HasOne<
  TReferencedModel extends Model
> extends BaseReference<TReferencedModel> {
  readonly referenceType = 'HAS_ONE' as const
}
export function hasOne<TModel extends Model>(
  reference: () => TModel
): HasOne<TModel> {
  return new HasOne(reference)
}

export class BelongToMany<
  TReferencedModel extends Model
> extends BaseReference<TReferencedModel> {
  readonly referenceType = 'BELONGS_TO_MANY' as const
}
export function belongsToMany<TModel extends Model>(
  reference: () => TModel
): BelongToMany<TModel> {
  return new BelongToMany(reference)
}

export class BelongToOne<
  TReferencedModel extends Model
> extends BaseReference<TReferencedModel> {
  readonly referenceType = 'BELONGS_TO_ONE' as const
}
export function belongsToOne<TModel extends Model>(
  reference: () => TModel
): BelongToOne<TModel> {
  return new BelongToOne(reference)
}

export type ModelReference<TReferencedModel extends Model = Model> =
  | HasMany<TReferencedModel>
  | HasOne<TReferencedModel>
  | BelongToMany<TReferencedModel>
  | BelongToOne<TReferencedModel>
export type ModelReferences<TModel extends Model> = PickByType<
  TModel,
  ModelReference
>
export type ModelReferenceKeys<TModel extends Model> = KeysOfType<
  TModel,
  ModelReference
>

export type ReferencesObject = {
  [K: string]: ModelReference
}

// type ModelWithPrimaryKey<
//   TSchema extends ObjectSchemaAny,
//   TPrimaryKey extends readonly (keyof TSchema['config']['shape'])[]
// > = {
//   primaryKey: TPrimaryKey;
// };
// export type PrimaryKeyShape<TModel extends Model> =
//   TModel extends ModelWithPrimaryKey<ObjectSchemaAny, infer TPrimaryKey>
//     ? Pick<ModelShape<TModel>, TPrimaryKey[number]>
//     : never;

// export function hasPrimaryKey<TModel extends Model>(
//   model: TModel
// ): model is TModel & { primaryKey: (keyof ModelShape<TModel>)[] } {
//   return Array.isArray((model as any).primaryKey);
// }
