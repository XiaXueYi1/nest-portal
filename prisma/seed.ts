import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'
import dotenv from 'dotenv'

dotenv.config({ path: process.env.ENV_FILE || '.env.development' })

const connectionString = process.env.DATABASE_URL || ''

function getSchemaFromConnectionString(url: string): string | null {
  try {
    const schema = new URL(url).searchParams.get('schema')?.trim()
    return schema || null
  } catch {
    return null
  }
}

async function main() {
  const schema = getSchemaFromConnectionString(connectionString)
  const adapter = schema ? new PrismaPg({ connectionString }, { schema }) : new PrismaPg({ connectionString })
  const prisma = new PrismaClient({ adapter })

  console.log('Seeding node templates...')

  await prisma.nodeTemplate.createMany({
    data: [
      // Vue 生态
      { name: 'Vue 3', category: 'VUE', description: 'Vue.js 渐进式 JavaScript 框架', version: '^3.4.0', sortOrder: 1 },
      { name: 'Pinia', category: 'VUE', description: 'Vue 官方状态管理库', version: '^2.1.0', sortOrder: 2 },
      { name: 'Vue Router', category: 'VUE', description: 'Vue 官方路由管理器', version: '^4.2.0', sortOrder: 3 },
      { name: 'Element Plus', category: 'VUE', description: 'Vue 3 UI 组件库', version: '^2.6.0', sortOrder: 4 },
      // React 生态
      { name: 'React 18', category: 'REACT', description: 'React 前端框架', version: '^18.2.0', sortOrder: 1 },
      { name: 'Redux', category: 'REACT', description: 'React 状态管理库', version: '^4.2.0', sortOrder: 2 },
      { name: 'React Router', category: 'REACT', description: 'React 路由管理库', version: '^6.0.0', sortOrder: 3 },
      { name: 'Ant Design', category: 'REACT', description: 'React UI 组件库', version: '^5.0.0', sortOrder: 4 },
      // 公共库
      { name: 'Axios', category: 'COMMON', description: '基于 Promise 的 HTTP 客户端', version: '^1.6.0', sortOrder: 1 },
      { name: 'Lodash', category: 'COMMON', description: 'JavaScript 实用工具库', version: '^4.17.0', sortOrder: 2 },
      { name: 'Dayjs', category: 'COMMON', description: '轻量级日期处理库', version: '^1.11.0', sortOrder: 3 },
    ],
  })

  console.log('Seeding complete.')
  await prisma.$disconnect()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
