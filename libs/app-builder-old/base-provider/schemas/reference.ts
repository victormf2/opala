import { ArraySchema, ArraySchemaItem } from "./array";
import { ObjectSchema } from "./object";
import { Schema } from "./schemas.base";

export type WithManyKeys<OS extends ObjectSchema> = {
  [K in keyof OS["shape"]]: OS["shape"][K] extends WithManySchema<
    infer RS,
    infer RK
  >
    ? K
    : never;
}[keyof OS["shape"]];

export type GetWithManyIdType<
  OS extends ObjectSchema,
  K extends keyof OS["shape"]
> = OS["shape"][K] extends WithManySchema<infer RS, infer RK>
  ? { [SK in K]: ArraySchemaItem<RS>[RK][] }
  : {};

export type WithMany<R, K extends keyof R> = {
  key: K;
};

export class WithManySchema<
  RS extends ArraySchema,
  K extends keyof ArraySchemaItem<RS>
> extends Schema<void> {
  constructor(readonly fn: () => RS, readonly key: K) {
    super([]);
  }
}

export function withMany<
  RS extends ArraySchema,
  K extends keyof ArraySchemaItem<RS>
>(fn: () => RS, key: K) {
  return new WithManySchema<RS, K>(fn, key);
}
