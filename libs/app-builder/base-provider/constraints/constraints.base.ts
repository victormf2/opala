export type ValidationResult =
  | {
      valid: false;
      errors: string[];
    }
  | {
      valid: true;
    };

export interface Constraint<T> {
  validate(value: T): ValidationResult;
}
