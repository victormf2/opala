import { ObjectSchema } from "../schemas/object";
import {
  GetWithManyIdType,
  WithManyKeys,
  WithManySchema,
} from "../schemas/reference";
import { Infer } from "../schemas/schemas.base";

export class CreateOperation<S extends ObjectSchema, TInput> {
  constructor(readonly schema: S, readonly attributes: (keyof S["shape"])[]) {}

  execute(input: TInput): Promise<Infer<S["shape"]["id"]>> {
    throw new Error("Method not implemented.");
  }

  with<K extends WithManyKeys<S>>(
    attribute: K
  ): CreateOperation<S, GetWithManyIdType<S, K> & TInput> {
    return new CreateOperation<S, GetWithManyIdType<S, K> & TInput>(
      this.schema,
      [...this.attributes, attribute]
    );
  }
}

export function create<OS extends ObjectSchema>(schema: OS) {
  return new CreateOperation<OS, Omit<Infer<OS>, "id" | WithManyKeys<OS>>>(
    schema,
    Object.keys(schema).filter((key) => {
      return key !== "id" && !(schema.shape[key] instanceof WithManySchema);
    })
  );
}
