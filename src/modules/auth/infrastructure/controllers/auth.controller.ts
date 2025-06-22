import { Controller, Post, UseGuards, Request, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService, LoginResponse } from '../../application/services/auth.service';
import { AuthenticatedUser } from '../../domain/interfaces/authenticated-user.interface';
import { GoogleAuthUseCase } from '../../application/use-cases/google-auth.use-case';
import { GoogleAuthDto } from '../../application/dtos/google-auth.dto';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @IsEmail({}, { message: 'Debe ser un email válido' })
  email: string;

  @IsString({ message: 'La contraseña debe ser una cadena de texto' })
  @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres' })
  password: string;
}

interface RequestWithUser extends Request {
  user: AuthenticatedUser;
}

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private googleAuthUseCase: GoogleAuthUseCase,
  ) {}

  @UseGuards(AuthGuard('local'))
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Request() req: RequestWithUser, @Body() loginDto: LoginDto): Promise<LoginResponse> {
    return this.authService.login(req.user);
  }

  @Post('google')
  @HttpCode(HttpStatus.OK)
  async googleAuth(@Body() googleAuthDto: GoogleAuthDto): Promise<LoginResponse> {
    return this.googleAuthUseCase.execute(googleAuthDto.firebaseToken);
  }
} 