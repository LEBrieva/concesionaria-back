# Sistema de Roles de Usuario

## Descripción

El sistema implementa tres roles principales para los usuarios:

- **ADMIN**: Administrador del sistema con permisos completos
- **VENDEDOR**: Personal de ventas con permisos limitados
- **CLIENTE**: Usuario final con permisos básicos

## Roles y Permisos

### ADMIN
- ✅ Puede crear usuarios con cualquier rol (ADMIN, VENDEDOR, CLIENTE)
- ✅ Puede actualizar información de cualquier usuario
- ✅ Puede cambiar contraseñas de cualquier usuario
- ✅ Acceso completo a todas las funcionalidades

### VENDEDOR
- ✅ Puede crear usuarios con rol CLIENTE únicamente
- ✅ Puede actualizar información de otros usuarios
- ✅ Puede cambiar contraseñas de otros usuarios
- ❌ No puede crear usuarios ADMIN o VENDEDOR

### CLIENTE
- ❌ No puede crear otros usuarios (solo se puede registrar a sí mismo sin autenticación)
- ❌ No puede actualizar información de otros usuarios
- ❌ No puede cambiar contraseñas de otros usuarios

## Endpoints

### Crear Usuario (Público - Registro)
```http
POST /usuarios
Content-Type: application/json

{
  "nombre": "Juan",
  "apellido": "Pérez",
  "email": "juan@example.com",
  "password": "password123",
  "telefono": "+1234567890",
  "rol": "CLIENTE"  // Opcional, por defecto es CLIENTE
}
```

**Nota**: Este endpoint es público (sin autenticación) y solo permite crear usuarios con rol CLIENTE. Es para el registro de nuevos clientes.

### Crear Usuario (Administrativo)
```http
POST /usuarios/admin
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "nombre": "María",
  "apellido": "González",
  "email": "maria@example.com",
  "password": "password123",
  "telefono": "+1234567890",
  "rol": "VENDEDOR"  // ADMIN puede crear cualquier rol
}
```

**Requiere**: Rol ADMIN o VENDEDOR
**Permisos**: 
- ADMIN: Puede crear cualquier rol
- VENDEDOR: Solo puede crear rol CLIENTE
- CLIENTE: ❌ No tiene acceso a este endpoint

### Actualizar Usuario
```http
PUT /usuarios/:id
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "nombre": "Juan Carlos",
  "apellido": "Pérez López",
  "telefono": "+0987654321",
  "rol": "VENDEDOR"  // Solo ADMIN puede cambiar roles
}
```

**Requiere**: Rol ADMIN o VENDEDOR

### Cambiar Contraseña
```http
PUT /usuarios/:id/password
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "password": "newPassword123"
}
```

**Requiere**: Rol ADMIN o VENDEDOR

## Autenticación

Al hacer login, el JWT incluye el rol del usuario:

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid-here",
    "email": "user@example.com",
    "nombre": "Usuario",
    "rol": "ADMIN"
  }
}
```

## Validaciones

### Creación de Usuarios
- **Sin autenticación**: Solo se permite rol CLIENTE (registro público)
- **Con autenticación ADMIN**: Permite cualquier rol
- **Con autenticación VENDEDOR**: Solo permite rol CLIENTE
- **Con autenticación CLIENTE**: ❌ No puede crear usuarios

### Actualización de Usuarios
- Solo ADMIN y VENDEDOR pueden actualizar otros usuarios
- Los CLIENTE no pueden actualizar otros usuarios

### Cambio de Contraseñas
- Solo ADMIN y VENDEDOR pueden cambiar contraseñas de otros usuarios
- Los CLIENTE no pueden cambiar contraseñas de otros usuarios

## Flujo de Registro

### Para Clientes (Registro Público)
1. El cliente se registra usando `POST /usuarios` sin autenticación
2. Se crea automáticamente con rol CLIENTE
3. Puede hacer login normalmente

### Para Personal (Registro Administrativo)
1. Un ADMIN usa `POST /usuarios/admin` para crear VENDEDOR o ADMIN
2. Un VENDEDOR usa `POST /usuarios/admin` para crear CLIENTE
3. Se especifica el rol deseado en el payload

## Uso en Código

### Proteger Endpoints con Roles

```typescript
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/infrastructure/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/infrastructure/guards/roles.guard';
import { Roles } from '../auth/infrastructure/decorators/roles.decorator';
import { RolUsuario } from '../usuarios/domain/usuario.enum';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RolUsuario.ADMIN, RolUsuario.VENDEDOR)
@Get('admin-only')
async adminEndpoint() {
  // Solo ADMIN y VENDEDOR pueden acceder
}
```

### Obtener Usuario Actual

```typescript
import { CurrentUser } from '../auth/infrastructure/decorators/current-user.decorator';
import { AuthenticatedUser } from '../auth/domain/interfaces/authenticated-user.interface';

@Get('profile')
async getProfile(@CurrentUser() user: AuthenticatedUser) {
  console.log(user.rol); // ADMIN, VENDEDOR, o CLIENTE
  return user;
}
```

## Migración de Base de Datos

El sistema agregó el campo `rol` a la tabla `Usuario`:

```sql
-- Migración aplicada automáticamente
ALTER TABLE "Usuario" ADD COLUMN "rol" "RolUsuario" NOT NULL DEFAULT 'CLIENTE';
```

Todos los usuarios existentes tendrán rol CLIENTE por defecto. 