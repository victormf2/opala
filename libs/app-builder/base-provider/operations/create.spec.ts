import { S } from "../../base-provider";
import { Infer } from "../schemas/schemas.base";
import { CreateConfiguration, create } from "./create";

const TestReference = S.object({
  something: S.number(),
});
const Test = S.object({
  str: S.string(),
  num: S.number(),
  obj: S.object({
    p0: S.string(),
    p1: S.string(),
  }),
  arr: S.array(S.string()),
  nested0: S.object({
    a: S.object({
      ap0: S.string(),
    }),
    b: S.string(),
    c: S.string(),
  }),
});

type Test = Infer<typeof Test>;

describe("constructor", function () {
  it("should generate configuration for all attributes", function () {
    const createOperation = create(Test);
    expect(createOperation.configuration).toEqual<CreateConfiguration<Test>>({
      str: true,
      num: true,
      obj: {
        p0: true,
        p1: true,
      },
      arr: true,
      nested0: {
        a: {
          ap0: true,
        },
        b: true,
        c: true,
      },
    });
  });
});

describe("with", function () {
  it("should generate configuration for attribute names specified", function () {
    const createOperation = create(Test).with("str", "obj");
    expect(createOperation.configuration).toEqual<CreateConfiguration<Test>>({
      str: true,
      obj: {
        p0: true,
        p1: true,
      },
    });
  });

  it("should generate configuration for attribute object specified", function () {
    const createOperation = create(Test).with({
      str: true,
      obj: ["p0"],
    });
    expect(createOperation.configuration).toEqual<CreateConfiguration<Test>>({
      str: true,
      obj: {
        p0: true,
      },
    });
  });
});
