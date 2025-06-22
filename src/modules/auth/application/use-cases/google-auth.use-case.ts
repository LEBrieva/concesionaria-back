import { Injectable, Inject, UnauthorizedException, Logger } from '@nestjs/common';
import { FirebaseService, FirebaseUserData } from '../../../shared/services/firebase.service';
import { IUsuarioRepository } from '../../../usuarios/domain/usuario.repository';
import { Usuario } from '../../../usuarios/domain/usuario.entity';
import { RolUsuario } from '../../../usuarios/domain/usuario.enum';
import { AuthService, LoginResponse } from '../services/auth.service';
import { randomUUID } from 'crypto';

@Injectable()
export class GoogleAuthUseCase {
  private readonly logger = new Logger(GoogleAuthUseCase.name);

  constructor(
    private readonly firebaseService: FirebaseService,
    @Inject('IUsuarioRepository') private readonly usuarioRepository: IUsuarioRepository,
    private readonly authService: AuthService,
  ) {}

  async execute(firebaseToken: string): Promise<LoginResponse> {
    try {
      // 0. Validar que el token no esté vacío
      if (!firebaseToken || firebaseToken.trim() === '') {
        throw new UnauthorizedException('Token de Firebase requerido');
      }

      // 1. Verificar el token de Firebase
      const firebaseUser: FirebaseUserData = await this.firebaseService.verifyIdToken(firebaseToken);
      
      this.logger.log(`Usuario de Google autenticado: ${firebaseUser.email}`);

      // 2. Verificar que el email esté verificado
      if (!firebaseUser.emailVerified) {
        throw new UnauthorizedException('El email debe estar verificado para continuar');
      }

      // 3. Buscar o crear el usuario en nuestra base de datos (incluir inactivos para validar)
      let usuario = await this.buscarUsuarioPorEmailIncluirInactivos(firebaseUser.email);

      if (!usuario) {
        // Crear nuevo usuario cliente
        usuario = await this.crearUsuarioCliente(firebaseUser);
        this.logger.log(`Nuevo cliente creado: ${usuario.email}`);
      } else {
        // Verificar que el usuario existente sea un cliente
        if (usuario.rol !== RolUsuario.CLIENTE) {
          throw new UnauthorizedException('Este email está asociado a una cuenta de empleado. Use el login tradicional.');
        }

        // Actualizar información si es necesario (nombre, foto, etc.)
        usuario = await this.actualizarUsuarioSiEsNecesario(usuario, firebaseUser);
      }

      // 4. Verificar que el usuario esté activo
      if (!usuario.active) {
        throw new UnauthorizedException('La cuenta está desactivada');
      }

      // 5. Generar nuestro JWT
      const authenticatedUser = {
        id: usuario.id,
        email: usuario.email,
        nombre: usuario.nombre,
        rol: usuario.rol,
      };

      return await this.authService.login(authenticatedUser);

    } catch (error) {
      this.logger.error('Error en autenticación con Google:', error);
      
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      
      throw new UnauthorizedException('Error al autenticar con Google');
    }
  }

  private async crearUsuarioCliente(firebaseUser: FirebaseUserData): Promise<Usuario> {
    // Extraer nombre y apellido del nombre completo de Google
    const [nombre, ...apellidoParts] = firebaseUser.name.split(' ');
    const apellido = apellidoParts.join(' ') || 'Cliente';

    const nuevoUsuario = new Usuario({
      id: randomUUID(),
      nombre: nombre || 'Cliente',
      apellido: apellido,
      email: firebaseUser.email,
      password: randomUUID(), // Password random ya que no se usará
      rol: RolUsuario.CLIENTE,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: 'google-auth',
      updatedBy: 'google-auth',
      active: true,
    });

    return await this.usuarioRepository.crear(nuevoUsuario);
  }

  private async actualizarUsuarioSiEsNecesario(
    usuario: Usuario, 
    firebaseUser: FirebaseUserData
  ): Promise<Usuario> {
    // Extraer nombre y apellido del nombre completo de Google
    const [nombre, ...apellidoParts] = firebaseUser.name.split(' ');
    const apellido = apellidoParts.join(' ') || usuario.apellido;

    // Verificar si necesita actualización
    const necesitaActualizacion = 
      usuario.nombre !== (nombre || usuario.nombre) ||
      usuario.apellido !== apellido;

    if (necesitaActualizacion) {
      const usuarioActualizado = usuario.actualizarCon({
        nombre: nombre || usuario.nombre,
        apellido: apellido,
        updatedAt: new Date(),
        updatedBy: 'google-auth',
      });

      return await this.usuarioRepository.actualizar(usuario.id, usuarioActualizado);
    }

    return usuario;
  }

  private async buscarUsuarioPorEmailIncluirInactivos(email: string): Promise<Usuario | null> {
    // Inyectamos PrismaService directamente para hacer una consulta sin filtro de active
    const prismaService = (this.usuarioRepository as any).prisma;
    const prismaUsuario = await prismaService.usuario.findUnique({
      where: { email }
    });

    if (!prismaUsuario) {
      return null;
    }

    // Usar el mapper para convertir a entidad de dominio
    const UsuarioToPrismaMapper = require('../../../usuarios/infrastructure/mappers/usuario-to-prisma.mapper').UsuarioToPrismaMapper;
    return UsuarioToPrismaMapper.toDomain(prismaUsuario);
  }
} 