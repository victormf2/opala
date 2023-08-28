import { int } from "./base-provider/constraints/int";
import { length } from "./base-provider/constraints/length";
import { uuid } from "./base-provider/constraints/uuid";
import { create } from "./base-provider/operations/create";
import { array } from "./base-provider/schemas/array";
import { number } from "./base-provider/schemas/number";
import { object } from "./base-provider/schemas/object";
import { withMany } from "./base-provider/schemas/reference";
import { Infer } from "./base-provider/schemas/schemas.base";
import { string } from "./base-provider/schemas/string";

export const S = {
  string,
  number,
  object,
  array,
  withMany,
};

export namespace S {
  export type infer<T> = Infer<T>;
}

export const C = {
  uuid,
  length,
  int,
};

export const O = {
  create,
};
