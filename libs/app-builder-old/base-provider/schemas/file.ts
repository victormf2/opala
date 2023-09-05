import { Readable } from "node:stream";
import { Schema } from "./schemas.base";

export type File = {
  filename: string;
  encoding: string;
  mimeType: string;
  data: Readable;
};
export function isFile(value: unknown): value is File {
  const valueAsFile = value as File;
  return (
    valueAsFile != null &&
    typeof value === "object" &&
    typeof valueAsFile.encoding === "string" &&
    typeof valueAsFile.filename === "string" &&
    typeof valueAsFile.mimeType === "string" &&
    valueAsFile.data instanceof Readable
  );
}
export class FileSchema extends Schema<File> {}

export function file(...args: ConstructorParameters<typeof FileSchema>) {
  return new FileSchema(...args);
}
