export interface Operation<in out TInput, out TOutput> {
  execute(input: TInput): Promise<TOutput>;
}
