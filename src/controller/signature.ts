require('dotenv').config()

import { Signature } from '../database/models/signature'

const { GoogleSpreadsheet } = require('google-spreadsheet');
const doc = new GoogleSpreadsheet('1mtNZW5gj3mPz4rafvwomsXkeyb5Kj1Hi_bXtRgO_Ggk');

export const checkSignature = async (req, res) => {
    let walletAddress = req.body.walletAddress
    let text = req.body.text

    const checkApproval = await Signature.findOne({
        walletAddress: walletAddress,
        text: text
    })

    if(checkApproval) {
        res.send({ signature: String(checkApproval.signature) })
    } else {
        res.send({ signature: "" })
    }
}

export const writeSignature = async (req, res) => {
    console.log('body', req.body);
    
    let walletAddress = req.body.walletAddress
    let text = req.body.text
    let signature = req.body.signature
    
    if(!walletAddress) {
        res.send({ error: "Body does not contains walletAddress"})
    }

    if(!text) {
        res.send({ error: "Body does not contains text"})
    }

    if(!signature) {
        res.send({ error: "Body does not contains signature"})
    }

    await doc.useServiceAccountAuth({
        client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
    });
    
    await doc.loadInfo(); 
    const sheet = doc.sheetsById[0]

    const safeCheck = await Signature.findOne({
        text : text,
        signature : signature,
        walletAddress: walletAddress 
    })

    if(!safeCheck) {
        const writeSignature = new Signature({
            text : text,
            signature : signature,
            walletAddress: walletAddress
        })
    
        await writeSignature.save()
        const addRow = await sheet.addRow({ 
            Address: walletAddress, 
            Signature: signature,
            Text: signature
        });

        res.send({ success: true })
    } else {
        res.send({ success: false })
    }
}