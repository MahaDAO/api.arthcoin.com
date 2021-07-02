const cron = require('node-cron');

export const cronJob = async () => { 
    cron.schedule('* * * * *', () => {
        console.log('running a task every minute');
    });
}
