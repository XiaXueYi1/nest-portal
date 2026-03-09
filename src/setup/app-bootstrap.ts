import { INestApplication } from '@nestjs/common'
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston'

/**
 * @description 应用启动期统一初始化入口
 */
export const setupApp = (app: INestApplication): void => {
  app.useLogger(app.get(WINSTON_MODULE_NEST_PROVIDER))
}
