import { Schema } from "./schemas.base";

export class StringSchema extends Schema<string> {}

export function string(...args: ConstructorParameters<typeof StringSchema>) {
  return new StringSchema(...args);
}
