import { Controller, Post, UseGuards, Request, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Throttle } from '@nestjs/throttler';
import { AuthService, LoginResponse } from '../../application/services/auth.service';
import { AuthenticatedUser } from '../../domain/interfaces/authenticated-user.interface';
import { GoogleAuthUseCase } from '../../application/use-cases/google-auth.use-case';
import { GoogleAuthDto } from '../../application/dtos/google-auth.dto';
import { FirebaseProtectionGuard } from '../guards/firebase-protection.guard';
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
  @Throttle({ default: { limit: 5, ttl: 60000 } }) // 5 intentos por minuto
  async login(@Request() req: RequestWithUser, @Body() loginDto: LoginDto): Promise<LoginResponse> {
    return this.authService.login(req.user);
  }

  @Post('google')
  @HttpCode(HttpStatus.OK)
  @UseGuards(FirebaseProtectionGuard)
  @Throttle({ default: { limit: 10, ttl: 60000 } }) // 10 intentos por minuto para Google Auth
  async googleAuth(@Body() googleAuthDto: GoogleAuthDto): Promise<LoginResponse> {
    return this.googleAuthUseCase.execute(googleAuthDto.firebaseToken);
  }
} 