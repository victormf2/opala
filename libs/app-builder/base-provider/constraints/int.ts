import { Constraint, ValidationResult } from "./constraints.base";

export type IntRestrictions = Readonly<{
  unsigned?: true;
  size?: 8 | 16 | 32;
}>;
export class IntConstraint implements Constraint<number> {
  constructor(readonly restrictions: IntRestrictions = {}) {}
  validate(value: number): ValidationResult {
    return {
      valid: true,
    };
  }
}

export function int(...args: ConstructorParameters<typeof IntConstraint>) {
  return new IntConstraint(...args);
}
