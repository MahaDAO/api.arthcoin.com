import { updateOracles } from "../Oracle"

const cron = require('node-cron');

export const cronJob = async () => {
    //cron.schedule('* * * * *', () => {
    cron.schedule('*/10 * * * *', () => {
        console.log('running a task every 10 mins');
        updateOracles();
    });
};

updateOracles();
