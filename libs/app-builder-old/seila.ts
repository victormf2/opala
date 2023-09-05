import { O, R, S } from "./base-provider";
import http = require("http");

import busboy = require("busboy");

http
  .createServer((req, res) => {
    if (req.method === "POST") {
      console.log("POST request");
      const bb = busboy({ headers: req.headers });
      bb.on("file", (name, file, info) => {
        const { filename, encoding, mimeType } = info;
        console.log(
          `File [${name}]: filename: %j, encoding: %j, mimeType: %j`,
          filename,
          encoding,
          mimeType
        );
        file
          .on("data", (data) => {
            console.log(`File [${name}] got ${data.length} bytes`);
          })
          .on("close", () => {
            console.log(`File [${name}] done`);
          });
      });
      bb.on("field", (name, val, info) => {
        console.log(`Field [${name}]: value: %j`, val);
      });
      bb.on("close", () => {
        console.log("Done parsing form!");
        res.writeHead(303, { Connection: "close", Location: "/" });
        res.end();
      });
      req.pipe(bb);
    } else if (req.method === "GET") {
      res.writeHead(200, { Connection: "close" });
      res.end(`
      <html>
        <head></head>
        <body>
          <form method="POST" enctype="multipart/form-data">
            <input type="file" name="filefield"><br />
            <input type="text" name="textfield"><br />
            <input type="submit">
          </form>
        </body>
      </html>
    `);
    }
  })
  .listen(8000, () => {
    console.log("Listening for requests");
  });

const Address = S.object({
  line1: S.string(),
  line2: S.string(),
  line3: S.string(),
  banana: S.object({
    eita: S.array(
      S.object({
        seila: S.string(),
      }),
      [R.length({ min: 1 })]
    ),
  }),
});

const Category = S.object({
  id: S.int(),
  title: S.string(),
});

const Question = S.object({
  id: S.int(32, "unsigned"),
  title: S.string(),
  weight: S.int(),
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
