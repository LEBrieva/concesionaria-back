import { Controller, Post, Body, Get, Query } from '@nestjs/common';
import { RegistrarClienteUseCase } from '../../application/use-cases/registrar-cliente.use-case';
import { LoginClienteUseCase } from '../../application/use-cases/login-cliente.use-case';
import { VerificarEmailUseCase } from '../../application/use-cases/verificar-email.use-case';
import { RegistrarClienteDto } from '../../application/dtos/registro/registrar-cliente.dto';
import { LoginClienteDto } from '../../application/dtos/auth/login-cliente.dto';

@Controller('publico/clientes')
export class ClientesPublicoController {
  constructor(
    private readonly registrarClienteUseCase: RegistrarClienteUseCase,
    private readonly loginClienteUseCase: LoginClienteUseCase,
    private readonly verificarEmailUseCase: VerificarEmailUseCase,
  ) {}

  @Post('registrar')
  async registrar(@Body() dto: RegistrarClienteDto) {
    return await this.registrarClienteUseCase.execute(dto);
  }

  @Post('login')
  async login(@Body() dto: LoginClienteDto) {
    return await this.loginClienteUseCase.execute(dto);
  }

  @Get('verificar-email')
  async verificarEmail(@Query('token') token: string) {
    return await this.verificarEmailUseCase.execute(token);
  }
}
