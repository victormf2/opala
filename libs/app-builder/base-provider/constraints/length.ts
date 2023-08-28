import { AppBuilderError } from "../base";
import { Constraint, ValidationResult } from "./constraints.base";

export class InvalidLengthRestrictionsError extends AppBuilderError {}

export type LengthRestrictions = Readonly<{ min?: number; max?: number }>;
export class LengthConstraint<A extends unknown[] | string>
  implements Constraint<A>
{
  constructor(readonly restrictions: LengthRestrictions) {
    if (
      typeof restrictions.max !== "number" &&
      typeof restrictions.min !== "number"
    ) {
      throw new InvalidLengthRestrictionsError();
    }
  }
  validate(value: string | A): ValidationResult {
    return {
      valid: true,
    };
  }
}

export function length<A extends unknown[] | string>(
  min: number
): LengthConstraint<A>;
export function length<A extends unknown[] | string>(
  min: number,
  max: number
): LengthConstraint<A>;
export function length<A extends unknown[] | string>(restrictions: {
  max: number;
}): LengthConstraint<A>;
export function length<A extends unknown[] | string>(restrictions: {
  min: number;
}): LengthConstraint<A>;
export function length<A extends unknown[] | string>(restrictions: {
  min: number;
  max: number;
}): LengthConstraint<A>;
export function length<A extends unknown[] | string>(
  p0: number | LengthRestrictions,
  p1?: number
) {
  if (typeof p0 === "number") {
    if (typeof p1 === "number") {
      return new LengthConstraint({ min: p0, max: p1 });
    }
    return new LengthConstraint({ min: p0 });
  }
  return new LengthConstraint<A>(p0);
}
