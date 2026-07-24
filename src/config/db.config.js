import 'dotenv/config';
import { Sequelize } from 'sequelize'; 

const requiredEnvVars = ['DB_NAME', 'DB_USER', 'DB_PASSWORD', 'DB_HOST', 'DB_PORT'];
const missingEnvVars = requiredEnvVars.filter((key) => !process.env[key]);

if (missingEnvVars.length > 0) {
    throw new Error(`Missing required environment variables: ${missingEnvVars.join(', ')}`);
}

const sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    {
        host: process.env.DB_HOST,
        port: Number(process.env.DB_PORT),  
        dialect: 'postgres',
    }
);

const connectToDB = async () => {
    try {
        await sequelize.authenticate(); 
        console.log('DB connection established');
    } catch (error) {
        console.error('Unable to connect to DB:', error.message);
        process.exit(1); 
    }
}

export { sequelize, connectToDB };
