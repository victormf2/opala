import { KeysOfType } from "../../utility-types";
import { Constraint } from "../constraints/constraints.base";
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
  constructor(
    readonly shape: S,
    constraints: Constraint<ShapeObject<S>>[] = []
  ) {
    super(constraints);
  }
}
export function object<S extends Shape>(
  ...args: ConstructorParameters<typeof ObjectSchema<S>>
) {
  return new ObjectSchema(...args);
}
