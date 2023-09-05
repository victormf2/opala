import { Rule } from "../rules/rules.base";
import { Infer, Schema } from "./schemas.base";

export type ArraySchemaItem<RS extends ArraySchema> = Infer<RS>[number];

export class ArraySchema<S extends Schema = Schema> extends Schema<Infer<S>[]> {
  constructor(readonly itemSchema: S, rules: Rule<Infer<S>[]>[] = []) {
    super(rules);
  }
}

export function array<S extends Schema>(
  ...args: ConstructorParameters<typeof ArraySchema<S>>
) {
  return new ArraySchema(...args);
}
