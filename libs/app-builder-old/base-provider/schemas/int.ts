import { Rule } from "../rules/rules.base";
import { Schema } from "./schemas.base";

export type IntSize = 8 | 16 | 32;
export type Sign = "signed" | "unsigned";
export class IntSchema extends Schema<number> {
  readonly size: IntSize;
  readonly sign: Sign;
  constructor(size?: IntSize, rules?: Rule<number>[]);
  constructor(size?: IntSize, sign?: Sign, rules?: Rule<number>[]);
  constructor(
    size: IntSize = 32,
    p1?: Sign | Rule<number>[],
    p2?: Rule<number>[]
  ) {
    const rules = Array.isArray(p2) ? p2 : Array.isArray(p1) ? p1 : undefined;
    super(rules);

    this.size = size;
    this.sign = typeof p1 === "string" ? p1 : "signed";
  }
}

export function int(...args: ConstructorParameters<typeof IntSchema>) {
  return new IntSchema(...args);
}
