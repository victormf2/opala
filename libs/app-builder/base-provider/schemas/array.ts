import { Constraint } from "../constraints/constraints.base";
import { Infer, Schema } from "./schemas.base";

export type ArraySchemaItem<RS extends ArraySchema> = Infer<RS>[number];

export class ArraySchema<S extends Schema = Schema> extends Schema<Infer<S>[]> {
  constructor(
    readonly itemSchema: S,
    constraints: Constraint<Infer<S>[]>[] = []
  ) {
    super(constraints);
  }
}

export function array<S extends Schema>(
  ...args: ConstructorParameters<typeof ArraySchema<S>>
) {
  return new ArraySchema(...args);
}
