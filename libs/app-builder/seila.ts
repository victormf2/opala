import { C, O, S } from "./base-provider";

const Address = S.object({
  line1: S.string(),
  line2: S.string(),
  line3: S.string(),
  banana: S.object({
    eita: S.array(
      S.object({
        seila: S.string(),
      }),
      [C.length({ min: 1 })]
    ),
  }),
});

const Category = S.object({
  id: S.number(),
  title: S.string(),
});

const Question = S.object({
  id: S.number(),
  title: S.string(),
  weight: S.number(),
  categories: S.withMany(() => S.array(Category), "id"),
  categories2: S.withMany(() => S.array(Category), "title"),
});
type Question = S.infer<typeof Question>;

const createQuestion = O.create(Question)
  .with("categories")
  .with("categories2");

createQuestion
  .execute({
    title: "questionTitle",
    weight: 12,
    categories: [1, 5, 12],
    categories2: ["aaaaan i"],
  })
  .then((id) => {
    console.log(`created Question ${id}`);
  });
