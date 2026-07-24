import {sequelize, connectToDB} from './src/config/db.config.js'
import app from './src/app.js';
import express from 'express';
//import startBlacklistCleanupJob from './src/jobs/cleanupBlacklist.job.js';


const PORT = process.env.PORT || 3000;

async function startServer() {
    try {
        await connectToDB();
        await sequelize.sync({alter: true})
        console.log('Table synced')

        app.listen(PORT,() => {
            console.log(`server is listening on port ${PORT}`);
        });
    } catch (error) {
        console.error('Unable to start server:', error);
        process.exit(1);
    }
}

startServer();
//startBlacklistCleanupJob();
