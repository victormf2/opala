import { Rule } from "../rules/rules.base";

export class Schema<T = any> {
  constructor(readonly rules: Rule<T>[] = []) {}
}

export type Infer<S> = S extends Schema<infer T> ? T : never;
