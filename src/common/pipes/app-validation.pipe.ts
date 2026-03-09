import { BadRequestException, Injectable, ValidationError, ValidationPipe } from '@nestjs/common'

const toUnknownParamMessage = (property: string): string => `存在未定义参数: ${property}`

const pickConstraintMessage = (error: ValidationError): string[] => {
  const constraints = error.constraints
  if (!constraints) return []

  const values = Object.values(constraints)
  if (values.some((message) => message.includes('should not exist'))) {
    return [toUnknownParamMessage(error.property)]
  }

  if (constraints.isDefined) {
    return [constraints.isDefined]
  }

  if (constraints.isNotEmpty) {
    return [constraints.isNotEmpty]
  }

  const firstMessage = values[0]
  return firstMessage ? [firstMessage] : []
}

const collectValidationMessages = (errors: ValidationError[]): string[] => {
  console.error('Validation errors:', JSON.stringify(errors, null, 2))
  const messages: string[] = []

  const walk = (items: ValidationError[]) => {
    for (const error of items) {
      messages.push(...pickConstraintMessage(error))
      if (error.children?.length) {
        walk(error.children)
      }
    }
  }

  walk(errors)
  return [...new Set(messages)]
}

@Injectable()
export class AppValidationPipe extends ValidationPipe {
  /**
   * @description 全局参数校验与转换配置，后续扩展统一在这里维护
   */
  constructor() {
    super({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      exceptionFactory: (errors: ValidationError[]) => {
        return new BadRequestException(collectValidationMessages(errors))
      },
    })
  }
}
