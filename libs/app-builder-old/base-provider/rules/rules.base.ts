export type ValidationResult<T> =
  | {
      valid: false;
      errors: string[];
    }
  | {
      valid: true;
      value: T;
    };

export interface Rule<T> {
  validate(value: T): ValidationResult<T>;
}
