export type PickByType<T, V> = {
  [K in keyof T as T[K] extends V | undefined ? K : never]: T[K];
};

export type PartialByKey<T, K extends keyof T> = Omit<T, K> &
  Partial<Pick<T, K>>;

export type PartialByType<T, V> = PartialByKey<T, KeysOfType<T, V>>;

export type KeysOfType<T, V> = {
  [K in keyof T]: T[K] extends V | undefined ? K : never;
}[keyof T];

export type Incompatible<A, B> = {
  type: A;
  isNotAssignableTo: B;
};
