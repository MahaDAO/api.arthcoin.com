import updateOracles from "./cron/updateOracles"
import cron from 'node-cron'

cron.schedule('*/10 * * * *', updateOracles);
updateOracles();
