/* eslint-disable @typescript-eslint/no-explicit-any */
export type SchemaConfig = {
  isOptional?: boolean
}
export abstract class Schema<
  T = unknown,
  TConfig extends SchemaConfig = SchemaConfig
> {
  // Branding
  private readonly _value?: T
  optional(): this & OptionalSchema {
    return this.withConfig({
      isOptional: true,
    })
  }

  constructor(readonly config: TConfig) {}

  protected withConfig<const TConfig extends Record<string, unknown>>(
    config: TConfig
  ): this & { config: TConfig } {
    return new (this.constructor as any)({
      ...this.config,
      ...config,
    })
  }
}

export type Infer<S> = S extends Schema<infer T> ? T : never

export type Shape = {
  [k: string | symbol]: Schema<unknown>
}
export type ShapeObject<S extends Shape> = {
  [K in keyof S]: Infer<S[K]>
}

export class ObjectSchema<TShape extends Shape = Shape> extends Schema<
  ShapeObject<TShape>,
  SchemaConfig & {
    shape: TShape
  }
> {
  constructor(config: { shape: TShape }) {
    super(config)
  }
  extend<TOverrideShape extends Shape>(
    overrideShape: TOverrideShape
  ): ObjectSchema<TShape & TOverrideShape> {
    const newShape = {
      ...this.config.shape,
      ...overrideShape,
    }
    return new ObjectSchema({
      ...this.config,
      shape: newShape,
    })
  }

  omit<Keys extends (keyof TShape)[]>(
    ...keys: Keys
  ): ObjectSchema<Omit<TShape, Keys[number]>> {
    const newShape = {} as any
    for (const key in this.config.shape) {
      if (!keys.includes(key)) {
        newShape[key] = this.config.shape[key]
      }
    }
    return new ObjectSchema({
      ...this.config,
      shape: newShape,
    })
  }

  pick<Keys extends (keyof TShape)[]>(
    ...keys: Keys
  ): ObjectSchema<Pick<TShape, Keys[number]>> {
    const newShape = {} as any
    for (const key in this.config.shape) {
      if (keys.includes(key)) {
        newShape[key] = this.config.shape[key]
      }
    }
    return new ObjectSchema({
      ...this.config,
      shape: newShape,
    })
  }
}
export function object<S extends Shape>(shape: S): ObjectSchema<S> {
  return new ObjectSchema({ shape })
}

export type ObjectSchemaAny = ObjectSchema<Shape>

export type ArraySchemaItem<RS extends ArraySchema> = Infer<RS>[number]
export class ArraySchema<S extends Schema = Schema> extends Schema<
  Infer<S>[],
  SchemaConfig & { itemSchema: S }
> {}
export function array<S extends Schema>(itemSchema: S): ArraySchema<S> {
  return new ArraySchema({ itemSchema })
}

export type StringAutoGenerationMethods = 'uuid'
export type LengthConfig =
  | {
      min: number
    }
  | {
      max: number
    }
  | {
      min: number
      max: number
    }
export class StringSchema extends Schema<string> {
  primaryKey(): this & PrimaryKeySchema {
    return this.withConfig({
      isPrimaryKey: true,
    })
  }
  autoGenerated(
    generationMethod: StringAutoGenerationMethods
  ): this & AutoGeneratedSchema {
    return this.withConfig({
      isAutoGenerated: true,
      autoGenerationMethod: generationMethod,
    })
  }
  unique(uniquenessKey?: string): this & UniqueSchema {
    if (typeof uniquenessKey === 'string') {
      return this.withConfig({
        isUnique: true,
        uniquenessKey,
      })
    }
    return this.withConfig({
      isUnique: true,
    })
  }
  length<TLengthConfig>(
    length: TLengthConfig
  ): this & { length: TLengthConfig } {
    return this.withConfig({
      length: length,
    }) as any
  }
}
export function string(): StringSchema {
  return new StringSchema({})
}

export class NumberSchema extends Schema<number> {
  autoGenerated(): this & AutoGeneratedSchema {
    return this.withConfig({
      isAutoGenerated: true,
    })
  }
  positive() {
    return this.greaterThan(0)
  }

  greaterThan(value: number): this & GreaterThanSchema<number> {
    return this.withConfig({
      greaterThan: value,
    })
  }
}
export function number(): NumberSchema {
  return new NumberSchema({})
}

export class OneOfSchema<
  TValidValues extends readonly unknown[]
> extends Schema<
  TValidValues[number],
  SchemaConfig & {
    validValues: TValidValues
  }
> {}
export function oneOf<const TValidValues extends readonly unknown[]>(
  validValues: TValidValues
) {
  return new OneOfSchema({ validValues })
}

export type AutoGeneratedSchema = {
  config: {
    isAutoGenerated: true
    autoGenerationMethod?: string
  }
}
export function isAutoGenerated(
  schema: Schema
): schema is Schema & AutoGeneratedSchema {
  return (schema.config as any).isAutoGenerated
}

export type OptionalSchema = {
  config: {
    isOptional: true
  }
}
export function isOptional(schema: Schema): schema is Schema & OptionalSchema {
  return (schema.config as any).isOptional
}

export type PrimaryKeySchema = {
  config: {
    isPrimaryKey: true
  }
}
export function isPrimaryKey(
  schema: Schema
): schema is Schema & AutoGeneratedSchema {
  return (schema.config as any).isPrimaryKey
}

export type UniqueSchema = {
  config: {
    isUnique: true
    uniquenessKey?: string
  }
}
export function isUnique(schema: Schema): schema is Schema & UniqueSchema {
  return (schema.config as any).isUnique
}

export type GreaterThanSchema<T> = {
  config: {
    greaterThan: T
  }
}

export function canBeAutoGenerated(
  schema: Schema
): schema is Schema & { config: { isAutoGenerated: boolean } } {
  return schema instanceof NumberSchema
}
