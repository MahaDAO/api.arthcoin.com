import { updateOracles } from "../Oracle"

const cron = require('node-cron');

export const cronJob = async () => {
    cron.schedule('0 * * * *', () => {
        //updateOracles()
        console.log('running a task every hour');
    });
}
