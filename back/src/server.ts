import { env } from './config/env.js';
import { prisma } from './config/database.js';
import app from './app.js';

async function main() {
    try {
        await prisma.$connect();
        console.log('Conectado a la base de datos');
        app.listen(env.port, () => {
            console.log(`Server en http://localhost:${env.port}`);
            console.log(`API en http://localhost:${env.port}/api/v1`);
        });
    } catch (error) {
        console.error('Error al arrancar:', error);
        await prisma.$disconnect();
        process.exit(1);
    }
}

main();