import { Constraint, ValidationResult } from "./constraints.base";

export class UuidConstraint implements Constraint<string> {
  validate(value: string): ValidationResult {
    return {
      valid: true,
    };
  }
}

export function uuid(...args: ConstructorParameters<typeof UuidConstraint>) {
  return new UuidConstraint(...args);
}
