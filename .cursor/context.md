# Contexto del Proyecto

Este proyecto utiliza NestJS con Domain-Driven Design (DDD). La estructura está organizada por módulos funcionales y cada uno tiene sus capas bien separadas:

- **Domain**: contiene entidades, enums, interfaces y validaciones.
- **Application**: contiene casos de uso, DTOs y mappers.
- **Infrastructure**: contiene controladores, adaptadores y repositorios concretos.

---

## 🧠 Reglas de arquitectura y buenas prácticas

### 1. Lógica de negocio
- Toda lógica de negocio debe ir exclusivamente en los **use-cases**.
- Los controladores solo deben delegar, no contener lógica.
- Los use-cases deben tener un único método público llamado `execute` o `ejecutar`.

### 2. Entidades de dominio
- Las entidades deben validarse a sí mismas en el constructor mediante un método privado `validarDominio()`.
- Las propiedades deben ser `readonly` y accesibles públicamente para lectura.
- Nunca deben usar DTOs como parámetros en constructores o métodos.
- Deben tener un método `actualizarCon()` que retorne una nueva instancia con los cambios.
- Las props privadas deben almacenarse para poder ser reutilizadas en `actualizarCon()`.

### 3. DTOs y validación
- Los DTOs deben estar decorados con `class-validator` y usarse solo en `application` y `controllers`.
- No se deben importar DTOs dentro de `domain`.
- Los DTOs de respuesta deben tener el sufijo `ResponseDTO` o `Response`.

### 4. Controladores
- Solo reciben DTOs, llaman al `use-case` correspondiente y devuelven la respuesta mapeada.
- No deben contener lógica de transformación o validación extra.
- Deben usar guards de autenticación (`@UseGuards(JwtAuthGuard)`) y autorización (`@UseGuards(RolesGuard)`).
- Deben usar el decorador `@CurrentUser()` para obtener el usuario autenticado.

### 5. Mappers
- Se deben usar mappers explícitos para convertir Entidades ↔ DTOs (por ejemplo: `AutoMapper.toHttp()`).
- Los mappers de infraestructura deben convertir entre entidades de dominio y modelos de Prisma.
- Los mappers de aplicación deben convertir entre entidades de dominio y DTOs de respuesta.

### 6. Repositorios
- **CRÍTICO**: Hay inconsistencia en el naming. Algunos usan interfaces abstractas (`UsuarioRepository`) y otros interfaces con prefijo I (`IAutoRepository`).
- **DECISIÓN**: Usar siempre interfaces con prefijo `I` (ej: `IAutoRepository`, `IUsuarioRepository`).
- El repositorio concreto debe ir en `infrastructure/prisma/` con el nombre `Prisma[Entidad]Repository`.
- La inyección debe usar `@Inject('I[Entidad]Repository')` en los use-cases.
- Los módulos deben proveer con `provide: 'I[Entidad]Repository'`.

### 7. Inyección de dependencias
- Los use-cases deben inyectar repositorios usando `@Inject('I[Entidad]Repository')`.
- Los módulos deben configurar la inyección con el token string correspondiente.
- Servicios compartidos (como `PasswordService`) se inyectan directamente por clase.

### 8. Testing
- **REGLA CRÍTICA**: Todos los tests e2e deben usar una base de datos exclusiva para tests, nunca la de desarrollo.
- Siempre hardcodear la conexión a la BD de test en los archivos de test.
- Configurar el PrismaService para usar esta URL específica en el entorno de testing.

### 9. Estructura de archivos
- Los casos de uso deben estar en carpetas por entidad: `application/use-cases/[entidad]/`.
- Los DTOs deben estar organizados por entidad y acción: `application/dtos/[entidad]/[accion]/`.
- Los mappers deben seguir el patrón: `[entidad]-to-[destino].mapper.ts`.

---

## 📚 Convenciones de nombres

| Componente       | Ejemplo                          | Ubicación                           |
|------------------|----------------------------------|-------------------------------------|
| Caso de uso      | crear-auto.use-case.ts           | application/use-cases/[entidad]/    |
| DTO              | crear-auto.dto.ts                | application/dtos/[entidad]/[accion]/ |
| DTO Response     | crear-auto-response.dto.ts       | application/dtos/[entidad]/[accion]/ |
| Mapper HTTP      | auto-to-http.mapper.ts           | application/mappers/                |
| Mapper Prisma    | auto-to-prisma.mapper.ts         | infrastructure/mappers/             |
| Repositorio      | prisma-auto.repository.ts        | infrastructure/prisma/              |
| Interface Repo   | auto.repository.ts (IAutoRepository) | domain/                        |
| Entidad          | auto.entity.ts                   | domain/                             |
| Enum             | auto.enum.ts                     | domain/                             |

---

## 🔁 Flujo general del sistema

```
Controller → UseCase → Entity → Repository → Prisma
     ↓         ↓        ↓         ↓
   DTO → Entity → Validation → Persistence
     ↓
Response ← Mapper ← Entity
```

**Detalle del flujo:**
1. Controller recibe DTO y usuario autenticado
2. UseCase valida lógica de negocio y crea/actualiza Entity
3. Entity se auto-valida en constructor
4. Repository persiste usando mapper Prisma
5. Response se mapea de Entity a DTO de respuesta

---

## ⛔ Reglas de restricción para IA

### Arquitectura
- No sugerir lógica en controladores.
- No acceder a props privadas de entidades fuera del dominio.
- No proponer DTOs dentro de entidades.
- No generar clases o nombres fuera de las convenciones.
- No mover archivos entre capas sin justificación arquitectural.

### Repositorios
- **SIEMPRE** usar interfaces con prefijo `I` para repositorios.
- **SIEMPRE** usar `@Inject('I[Entidad]Repository')` en use-cases.
- **NUNCA** mezclar patrones de inyección (algunos con I, otros sin I).

### Testing
- **NUNCA** permitir que tests e2e usen la base de datos de desarrollo.
- **SIEMPRE** hardcodear la URL de BD de test en archivos de testing.

### Naming y estructura
- **SIEMPRE** seguir las convenciones de nombres establecidas.
- **SIEMPRE** organizar archivos en las carpetas correctas según su responsabilidad.
- **NUNCA** crear archivos en ubicaciones incorrectas.

---

## 🔧 Tareas pendientes de refactoring

1. **Unificar naming de repositorios**: Cambiar `UsuarioRepository` por `IUsuarioRepository` para consistencia.
2. **Actualizar inyección**: Cambiar todos los `@Inject` y `provide` para usar el patrón con `I`.
3. **Revisar mappers**: Asegurar que todos los mappers sigan las convenciones de naming.

---

Este archivo guía a la IA para mantener consistencia con la arquitectura del proyecto.
