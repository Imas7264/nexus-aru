const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcrypt')

const prisma = new PrismaClient()

async function main() {
  const hashedPassword = await bcrypt.hash('123456', 10)

  const admin = await prisma.user.upsert({
    where: { moodleId: '23106093' },
    update: {},
    create: {
      moodleId: '23106093',
      password: hashedPassword,
      name: 'Sami Ansari',
      role: 'ADMIN',
      department: 'AIML',
      division: 'A',
      batch: 'A1',
    },
  })

  console.log('Admin user created:', admin)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })