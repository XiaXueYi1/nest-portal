import { NestFactory } from '@nestjs/core'
import { AppModule } from '@/app.module'
import { setupApp } from '@/setup/app-bootstrap'

/**
 * @description 应用启动入口，注册全局管道/拦截器/过滤器
 */
async function bootstrap() {
  const app = await NestFactory.create(AppModule)
  setupApp(app)
  console.log('process.env.NODE_ENV:', process.env.NODE_ENV)
  console.log('process.env.PORT:', process.env.PORT)
  await app.listen(process.env.PORT ?? 3000)
}
void bootstrap()
