import stream from 'stream';
import jsonstream from 'JSONStream';
import fs from 'fs';
import mongoose from 'mongoose';

const BATCH_LIMIT = 20;

const createStream = (dir: string, path: string): stream.PassThrough =>
  fs
    .createReadStream(dir)
    .pipe(jsonstream.parse(path))
    .pipe(
      new stream.PassThrough({
        objectMode: true,
      })
    );

export const importer = async <T extends typeof mongoose.Model>(
  dirs: string[],
  model: T,
  path: string
) => {
  let docs: T[] = [];

  for await (const dir of dirs) {
    for await (const transaction of createStream(dir, path)) {
      docs.push(transaction);
      if (docs.length === BATCH_LIMIT) {
        await model.insertMany(docs);
        docs = [];
      }
    }

    docs.length && model.insertMany(docs);
  }
};
