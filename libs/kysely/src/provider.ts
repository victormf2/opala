import { CreateOperation, Operation } from '@app-builder/core';
export const n = 12;

export class KyselyProvider {
  execute<TInput, TOutput>(
    operation: Operation<TInput, TOutput>,
    input: TInput
  ): Promise<TOutput> {
    if (operation instanceof CreateOperation) {
      operation;
    }
  }
}
