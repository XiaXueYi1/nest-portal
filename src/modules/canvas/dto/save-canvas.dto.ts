import { Type } from 'class-transformer'
import { IsArray, IsNumber, IsOptional, IsString, MaxLength, ValidateNested } from 'class-validator'

class SaveNodeDto {
  @IsString({ message: 'id 必须是字符串' })
  id: string

  @IsOptional()
  @IsString({ message: 'templateId 必须是字符串' })
  templateId?: string

  @IsString({ message: 'label 必须是字符串' })
  @MaxLength(128)
  label: string

  @IsOptional()
  @IsString({ message: 'note 必须是字符串' })
  note?: string

  @IsString({ message: 'category 必须是字符串' })
  category: string

  @IsOptional()
  @IsString({ message: 'description 必须是字符串' })
  description?: string

  @IsNumber({}, { message: 'positionX 必须是数字' })
  positionX: number

  @IsNumber({}, { message: 'positionY 必须是数字' })
  positionY: number
}

class SaveEdgeDto {
  @IsString({ message: 'id 必须是字符串' })
  id: string

  @IsString({ message: 'sourceId 必须是字符串' })
  sourceId: string

  @IsString({ message: 'targetId 必须是字符串' })
  targetId: string

  @IsOptional()
  @IsString({ message: 'sourcePortId 必须是字符串' })
  sourcePortId?: string

  @IsOptional()
  @IsString({ message: 'targetPortId 必须是字符串' })
  targetPortId?: string

  @IsOptional()
  @IsString({ message: 'label 必须是字符串' })
  label?: string

  @IsOptional()
  style?: Record<string, unknown>
}

export class SaveCanvasDto {
  @IsOptional()
  @IsString({ message: 'id 必须是字符串' })
  id?: string

  @IsOptional()
  @IsString({ message: 'name 必须是字符串' })
  @MaxLength(128)
  name?: string

  @IsOptional()
  @IsString({ message: 'description 必须是字符串' })
  description?: string

  @IsOptional()
  @IsString({ message: 'framework 必须是字符串' })
  framework?: string

  @IsOptional()
  @IsString({ message: 'thumbnail 必须是字符串' })
  thumbnail?: string

  @IsOptional()
  @IsArray({ message: 'nodes 必须是数组' })
  @ValidateNested({ each: true })
  @Type(() => SaveNodeDto)
  nodes?: SaveNodeDto[]

  @IsOptional()
  @IsArray({ message: 'edges 必须是数组' })
  @ValidateNested({ each: true })
  @Type(() => SaveEdgeDto)
  edges?: SaveEdgeDto[]
}
