import { KeysOfType } from "../../utility-types";
import { Rule } from "../rules/rules.base";
import { Infer, Schema } from "./schemas.base";

export type Shape = {
  [k: string]: Schema<any>;
};
export type ShapeObject<S extends Shape> = Omit<
  {
    [K in keyof S]: Infer<S[K]>;
  },
  KeysOfType<S, Schema<void>>
>;

export class ObjectSchema<S extends Shape = Shape> extends Schema<
  ShapeObject<S>
> {
  constructor(readonly shape: S, rules: Rule<ShapeObject<S>>[] = []) {
    super(rules);
  }
}
export function object<S extends Shape>(
  ...args: ConstructorParameters<typeof ObjectSchema<S>>
) {
  return new ObjectSchema(...args);
}
