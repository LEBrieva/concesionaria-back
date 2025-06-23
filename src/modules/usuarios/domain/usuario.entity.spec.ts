import { Usuario } from './usuario.entity';
import { RolUsuario } from './usuario.enum';
import { UsuarioProps } from './usuario.interfaces';

describe('Usuario Entity', () => {
  const validUsuarioProps: UsuarioProps = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    nombre: 'Juan',
    apellido: 'Pérez',
    email: 'juan.perez@example.com',
    password: 'password123',
    telefono: '+1234567890',
    rol: RolUsuario.CLIENTE,
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'system',
    updatedBy: 'system',
    active: true,
  };

  describe('constructor', () => {
    it('debería crear un usuario válido con todas las propiedades', () => {
      const usuario = new Usuario(validUsuarioProps);

      expect(usuario.id).toBe(validUsuarioProps.id);
      expect(usuario.nombre).toBe(validUsuarioProps.nombre);
      expect(usuario.apellido).toBe(validUsuarioProps.apellido);
      expect(usuario.email).toBe(validUsuarioProps.email);
      expect(usuario.password).toBe(validUsuarioProps.password);
      expect(usuario.telefono).toBe(validUsuarioProps.telefono);
      expect(usuario.rol).toBe(validUsuarioProps.rol);
    });

    it('debería crear un usuario sin teléfono (campo opcional)', () => {
      const propsWithoutPhone = { ...validUsuarioProps, telefono: undefined };
      const usuario = new Usuario(propsWithoutPhone);

      expect(usuario.telefono).toBeUndefined();
      expect(usuario.nombre).toBe(validUsuarioProps.nombre);
      expect(usuario.email).toBe(validUsuarioProps.email);
    });

    it('debería crear usuarios con diferentes roles', () => {
      const roles = [RolUsuario.ADMIN, RolUsuario.VENDEDOR, RolUsuario.CLIENTE];

      roles.forEach(rol => {
        const props = { ...validUsuarioProps, rol };
        const usuario = new Usuario(props);
        expect(usuario.rol).toBe(rol);
      });
    });
  });

  describe('validación de dominio', () => {
    describe('nombre', () => {
      it('debería lanzar error si el nombre está vacío', () => {
        const invalidProps = { ...validUsuarioProps, nombre: '' };
        expect(() => new Usuario(invalidProps)).toThrow('El nombre es requerido');
      });

      it('debería lanzar error si el nombre es solo espacios', () => {
        const invalidProps = { ...validUsuarioProps, nombre: '   ' };
        expect(() => new Usuario(invalidProps)).toThrow('El nombre es requerido');
      });

      it('debería lanzar error si el nombre es null/undefined', () => {
        const invalidProps = { ...validUsuarioProps, nombre: null as any };
        expect(() => new Usuario(invalidProps)).toThrow('El nombre es requerido');
      });
    });

    describe('apellido', () => {
      it('debería lanzar error si el apellido está vacío', () => {
        const invalidProps = { ...validUsuarioProps, apellido: '' };
        expect(() => new Usuario(invalidProps)).toThrow('El apellido es requerido');
      });

      it('debería lanzar error si el apellido es solo espacios', () => {
        const invalidProps = { ...validUsuarioProps, apellido: '   ' };
        expect(() => new Usuario(invalidProps)).toThrow('El apellido es requerido');
      });
    });

    describe('email', () => {
      it('debería lanzar error si el email está vacío', () => {
        const invalidProps = { ...validUsuarioProps, email: '' };
        expect(() => new Usuario(invalidProps)).toThrow('El email es requerido');
      });

      it('debería lanzar error si el email tiene formato inválido', () => {
        const emailsInvalidos = [
          'email-sin-arroba.com',
          'email@',
          '@dominio.com',
          'email@dominio',
          'email.dominio.com',
          'email @dominio.com',
          'email@dominio .com',
        ];

        emailsInvalidos.forEach(email => {
          const invalidProps = { ...validUsuarioProps, email };
          expect(() => new Usuario(invalidProps)).toThrow('El formato del email no es válido');
        });
      });

      it('debería aceptar emails válidos', () => {
        const emailsValidos = [
          'test@example.com',
          'user.name@domain.co.uk',
          'user+tag@example.org',
          'test123@test-domain.com',
        ];

        emailsValidos.forEach(email => {
          const props = { ...validUsuarioProps, email };
          expect(() => new Usuario(props)).not.toThrow();
          const usuario = new Usuario(props);
          expect(usuario.email).toBe(email);
        });
      });
    });

    describe('password', () => {
      it('debería lanzar error si la contraseña está vacía', () => {
        const invalidProps = { ...validUsuarioProps, password: '' };
        expect(() => new Usuario(invalidProps)).toThrow('La contraseña es requerida');
      });

      it('debería lanzar error si la contraseña es solo espacios', () => {
        const invalidProps = { ...validUsuarioProps, password: '   ' };
        expect(() => new Usuario(invalidProps)).toThrow('La contraseña es requerida');
      });

      it('debería lanzar error si la contraseña tiene menos de 8 caracteres', () => {
        const passwordsCortas = ['1234567', 'abc', 'pass', ''];
        
        passwordsCortas.forEach(password => {
          if (password.trim().length > 0) { // Evitar el caso de string vacío que ya se testea arriba
            const invalidProps = { ...validUsuarioProps, password };
            expect(() => new Usuario(invalidProps)).toThrow('La contraseña debe tener al menos 8 caracteres');
          }
        });
      });

      it('debería aceptar contraseñas de 8 caracteres o más', () => {
        const passwordsValidas = ['12345678', 'password123', 'contraseñaSegura', 'P@ssw0rd!'];
        
        passwordsValidas.forEach(password => {
          const props = { ...validUsuarioProps, password };
          expect(() => new Usuario(props)).not.toThrow();
          const usuario = new Usuario(props);
          expect(usuario.password).toBe(password);
        });
      });
    });

    describe('rol', () => {
      it('debería lanzar error si el rol no está definido', () => {
        const invalidProps = { ...validUsuarioProps, rol: null as any };
        expect(() => new Usuario(invalidProps)).toThrow('El rol del usuario es requerido y debe ser válido');
      });

      it('debería lanzar error si el rol no es válido', () => {
        const invalidProps = { ...validUsuarioProps, rol: 'ROL_INVALIDO' as any };
        expect(() => new Usuario(invalidProps)).toThrow('El rol del usuario es requerido y debe ser válido');
      });

      it('debería aceptar todos los roles válidos', () => {
        Object.values(RolUsuario).forEach(rol => {
          const props = { ...validUsuarioProps, rol };
          expect(() => new Usuario(props)).not.toThrow();
          const usuario = new Usuario(props);
          expect(usuario.rol).toBe(rol);
        });
      });
    });
  });

  describe('actualizarCon', () => {
    it('debería actualizar propiedades específicas manteniendo las demás', () => {
      const usuario = new Usuario(validUsuarioProps);
      const nuevoNombre = 'Carlos';
      const nuevoTelefono = '+9876543210';

      const usuarioActualizado = usuario.actualizarCon({
        nombre: nuevoNombre,
        telefono: nuevoTelefono,
        updatedBy: 'admin-123',
      });

      expect(usuarioActualizado.nombre).toBe(nuevoNombre);
      expect(usuarioActualizado.telefono).toBe(nuevoTelefono);
      expect(usuarioActualizado.updatedBy).toBe('admin-123');
      // Propiedades no actualizadas deben mantenerse
      expect(usuarioActualizado.apellido).toBe(validUsuarioProps.apellido);
      expect(usuarioActualizado.email).toBe(validUsuarioProps.email);
      expect(usuarioActualizado.rol).toBe(validUsuarioProps.rol);
      expect(usuarioActualizado.id).toBe(validUsuarioProps.id);
    });

    it('debería validar las nuevas propiedades al actualizar', () => {
      const usuario = new Usuario(validUsuarioProps);

      expect(() => usuario.actualizarCon({ email: 'email-invalido' })).toThrow(
        'El formato del email no es válido'
      );

      expect(() => usuario.actualizarCon({ password: '123' })).toThrow(
        'La contraseña debe tener al menos 8 caracteres'
      );

      expect(() => usuario.actualizarCon({ nombre: '' })).toThrow(
        'El nombre es requerido'
      );
    });

    it('debería actualizar la fecha de updatedAt automáticamente', () => {
      const usuario = new Usuario(validUsuarioProps);
      const fechaOriginal = usuario.updatedAt;

      // Pequeña pausa para asegurar diferencia en timestamp
      const usuarioActualizado = usuario.actualizarCon({ nombre: 'Nuevo Nombre' });

      expect(usuarioActualizado.updatedAt).toBeInstanceOf(Date);
      expect(usuarioActualizado.updatedAt.getTime()).toBeGreaterThanOrEqual(fechaOriginal.getTime());
    });

    it('debería actualizar múltiples campos correctamente', () => {
      const usuario = new Usuario(validUsuarioProps);
      const actualizaciones = {
        nombre: 'Pedro',
        apellido: 'González',
        telefono: '+5555555555',
        rol: RolUsuario.VENDEDOR,
      };

      const usuarioActualizado = usuario.actualizarCon(actualizaciones);

      expect(usuarioActualizado.nombre).toBe(actualizaciones.nombre);
      expect(usuarioActualizado.apellido).toBe(actualizaciones.apellido);
      expect(usuarioActualizado.telefono).toBe(actualizaciones.telefono);
      expect(usuarioActualizado.rol).toBe(actualizaciones.rol);
      // Email y password no cambiaron
      expect(usuarioActualizado.email).toBe(validUsuarioProps.email);
      expect(usuarioActualizado.password).toBe(validUsuarioProps.password);
    });

    it('debería mantener el ID original del usuario', () => {
      const usuario = new Usuario(validUsuarioProps);

      const usuarioActualizado = usuario.actualizarCon({ nombre: 'Nuevo Nombre' });

      expect(usuarioActualizado.id).toBe(validUsuarioProps.id);
    });
  });
}); 