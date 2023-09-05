import { create } from "./operations/create";
import { length } from "./rules/length";
import { uuid } from "./rules/uuid";
import { array } from "./schemas/array";
import { file } from "./schemas/file";
import { int } from "./schemas/int";
import { object } from "./schemas/object";
import { withMany } from "./schemas/reference";
import { Infer } from "./schemas/schemas.base";
import { string } from "./schemas/string";

export const S = {
  string,
  int,
  object,
  array,
  file,
  withMany,
};

export namespace S {
  export type infer<T> = Infer<T>;
}

export const R = {
  uuid,
  length,
};

export const O = {
  create,
};
