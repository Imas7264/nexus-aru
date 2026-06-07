const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcrypt')

const prisma = new PrismaClient()

async function main() {
  const hashedPassword = await bcrypt.hash('123456', 10)

  const admin = await prisma.user.upsert({
    where: { moodleId: 'admin001' },
    update: {},
    create: {
      moodleId: '23106090',
      password: hashedPassword,
      name: 'Admin',
      role: 'ADMIN',
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