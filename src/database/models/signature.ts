const timestamps = require('mongoose-timestamp')
const mongoose = require('mongoose')

const Schema = mongoose.Schema;
const model = mongoose.model;
const Document = mongoose.Document;

export interface ISignature {
    text : string,
    signature : string,
    walletAddress: string
}

const signature = new Schema({
    text : String,
    signature : String,
    walletAddress: String
})

signature.plugin(timestamps)

export type ISignatureModel = ISignature & Document
export const Signature = model('Signature', signature)