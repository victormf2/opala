import { Schema } from "./schemas.base";

export class NumberSchema extends Schema<number> {}

export function number(...args: ConstructorParameters<typeof NumberSchema>) {
  return new NumberSchema(...args);
}
