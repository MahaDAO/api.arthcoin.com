require('dotenv').config()

import mongoose from 'mongoose'
import * as Bluebird from 'bluebird'
import * as nconf from 'nconf'

// @ts-ignore
mongoose.Promise = Promise
// mongoose.set('debug', true)


export const open = (url?: string) => {
  return new Promise<void>(async (resolve, reject) => {
    // Setup cache for mongoose
    // cachegoose(mongoose)
    console.log('opening mongodb connection');

    const options:any = {
      useCreateIndex: true,
      useNewUrlParser: true,
      useFindAndModify: false
    }

    mongoose.connect(process.env.DATABASE_URI, (error: any) => {
          if (error) {
              console.log(error)
              return reject(error)
          } else {
              console.log("Mongo Connected")
              resolve()
          }
      })
  })
}


export const close = () => mongoose.disconnect()