import { Rule, ValidationResult } from "./rules.base";

export class UuidRule implements Rule<string> {
  validate(value: string): ValidationResult<string> {
    return {
      valid: true,
      value,
    };
  }
}

export function uuid(...args: ConstructorParameters<typeof UuidRule>) {
  return new UuidRule(...args);
}
