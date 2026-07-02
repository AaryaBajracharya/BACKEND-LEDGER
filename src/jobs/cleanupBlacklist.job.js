
import cron from 'node-cron';
import { Op } from 'sequelize';
import Blacklist from '../models/blacklist.model.js';

const startBlacklistCleanupJob = () => {
    cron.schedule('0 * * * *', async () => {
        try {
            const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
            const deletedCount = await Blacklist.destroy({
                where: { blacklistedAt: { [Op.lt]: oneHourAgo } }
            });
            console.log(`Blacklist cleanup: removed ${deletedCount} expired entries`);
        } catch (err) {
            console.error('Blacklist cleanup job failed:', err);
        }
    });
};

export default startBlacklistCleanupJob;