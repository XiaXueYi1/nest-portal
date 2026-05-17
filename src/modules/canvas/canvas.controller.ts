import { Body, Controller, Delete, Get, Param, Put, Query, Req } from '@nestjs/common'
import { DateRangeQueryDto } from '@/common/dto/date-range-query.dto'
import { PaginationQueryDto } from '@/common/dto/pagination-query.dto'
import type { AuthenticatedRequest } from '@/modules/auth/types/auth.types'
import { CanvasService } from './canvas.service'
import { SaveCanvasDto } from './dto/save-canvas.dto'

@Controller('canvas')
export class CanvasController {
  constructor(private readonly canvasService: CanvasService) {}

  @Get('templates')
  async findTemplates() {
    return this.canvasService.findTemplates()
  }

  @Get()
  async findAll(@Query() query: PaginationQueryDto, @Req() req: AuthenticatedRequest) {
    return this.canvasService.findAll(req.user!.sub, query)
  }

  @Get('statistics')
  async statistics(@Query() query: DateRangeQueryDto) {
    return this.canvasService.statistics(query)
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.canvasService.findOne(id, req.user!.sub)
  }

  @Put('save')
  async save(@Body() dto: SaveCanvasDto, @Req() req: AuthenticatedRequest) {
    return this.canvasService.save(req.user!.sub, dto)
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    await this.canvasService.remove(id, req.user!.sub)
    return { deleted: true }
  }
}
