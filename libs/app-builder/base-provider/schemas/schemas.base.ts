import { Constraint } from "../constraints/constraints.base";

export class Schema<T = any> {
  constructor(readonly constraints: Constraint<T>[] = []) {}
}

export type Infer<S> = S extends Schema<infer T> ? T : never;
