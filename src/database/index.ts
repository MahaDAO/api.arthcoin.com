import nconf from "nconf";
import mongoose from "mongoose";

export const open = (url?: string) => {
  return new Promise<void>(async (resolve, reject) => {
    // Setup cache for mongoose
    // cachegoose(mongoose)
    console.log("opening mongodb connection");

    mongoose.connect(nconf.get("DATABASE_URI"), (error: any) => {
      if (error) {
        console.log(error);
        return reject(error);
      } else {
        console.log("Mongo Connected");
        resolve();
      }
    });
  });
};

export const close = () => mongoose.disconnect();
