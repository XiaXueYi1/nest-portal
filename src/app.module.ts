import { Module } from '@nestjs/common'
import { appImports } from '@/setup/app-imports'
import { appProviders } from '@/setup/app-providers'

@Module({
  imports: appImports,
  providers: appProviders,
})
export class AppModule {}
