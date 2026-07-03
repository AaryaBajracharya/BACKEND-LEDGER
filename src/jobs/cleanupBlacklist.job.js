
import cron from 'node-cron';
import { Op } from 'sequelize';
import Blacklist from '../models/blacklist.model.js';

const startBlacklistCleanupJob = () => {
    cron.schedule('0 * * * *', async () => {
        try {
            const now = new Date();
            const deletedCount = await Blacklist.destroy({
                where: { expiresAt: { [Op.lt]: now } }
            });
            console.log(`Blacklist cleanup: removed ${deletedCount} expired entries`);
        } catch (err) {
            console.error('Blacklist cleanup job failed:', err);
        }
    });
};

export default startBlacklistCleanupJob;