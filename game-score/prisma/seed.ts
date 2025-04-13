import {PrismaClient} from '@prisma/client'
const dotenv = require('dotenv');
dotenv.config();

const prisma = new PrismaClient();

async function main(){

    const roles= [ 
        {
            name: 'ADMIN'
    }, 
        {
            name: "PLAYER"
    },

        {
        name: "COPROPIETARIO"
    }

    ];

    //seed Roles 

    for (const role of roles) {
        await prisma.role.upsert({
            where: {name: role.name}, 
            update: {},
            create: role,
        });
    }

    console.log ("Database has been seeded")
}

main ()
    .catch ((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async() => {
        await prisma.$disconnect();
    })

