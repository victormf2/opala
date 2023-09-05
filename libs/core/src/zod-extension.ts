import { z } from 'zod';

type NumberBitSize = 8 | 16 | 32 | 64;
declare module 'zod' {
  interface ZodNumber {
    size(numberSize: NumberBitSize): this;
  }

  interface ZodNumberDef {
    bitsize?: NumberBitSize;
  }
}

export function extendZodSchema(zod: typeof z) {
  extendZodNumber(zod);
}

function extendZodNumber(zod: typeof z) {
  if (typeof zod.ZodNumber.prototype.size !== 'undefined') {
    return;
  }
  zod.ZodNumber.prototype.size = function (numberSize) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any
    const result = new (this as any).constructor({
      ...this._def,
      bitsize: numberSize,
    });

    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return result;
  };
}
