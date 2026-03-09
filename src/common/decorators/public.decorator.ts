import { SetMetadata } from '@nestjs/common'

export const IS_PUBLIC_KEY = 'isPublic'

/**
 * @description 标记接口为公开路由，跳过全局 access token 鉴权
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true)
