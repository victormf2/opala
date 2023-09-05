import { Transform } from "node:stream";
import { AppBuilderError } from "../base";
import { File, isFile } from "../schemas/file";
import { Rule, ValidationResult } from "./rules.base";

export class InvalidLengthRestrictionsError extends AppBuilderError {}

export type LengthRestrictions = Readonly<{ min?: number; max?: number }>;
type ValueWithLength = unknown[] | string | File;

export class LengthRule<A extends ValueWithLength> implements Rule<A> {
  constructor(readonly restrictions: LengthRestrictions) {
    if (
      typeof restrictions.max !== "number" &&
      typeof restrictions.min !== "number"
    ) {
      throw new InvalidLengthRestrictionsError();
    }
  }
  validate(value: A): ValidationResult<A> {
    if (isFile(value)) {
      const validatedFile: File = {
        ...value,
        data: value.data.pipe(
          new Transform({
            transform(chunk, encoding, callback) {},
          })
        ),
      };
      return {
        valid: true,
        value: validatedFile as A,
      };
    }
    return {
      valid: true,
      value,
    };
  }
}

export function length<A extends ValueWithLength>(min: number): LengthRule<A>;
export function length<A extends ValueWithLength>(
  min: number,
  max: number
): LengthRule<A>;
export function length<A extends ValueWithLength>(restrictions: {
  max: number;
}): LengthRule<A>;
export function length<A extends ValueWithLength>(restrictions: {
  min: number;
}): LengthRule<A>;
export function length<A extends ValueWithLength>(restrictions: {
  min: number;
  max: number;
}): LengthRule<A>;
export function length<A extends ValueWithLength>(
  p0: number | LengthRestrictions,
  p1?: number
) {
  if (typeof p0 === "number") {
    if (typeof p1 === "number") {
      return new LengthRule({ min: p0, max: p1 });
    }
    return new LengthRule({ min: p0 });
  }
  return new LengthRule<A>(p0);
}
