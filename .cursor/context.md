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

### 2. Entidades de dominio
- Las entidades deben validarse a sí mismas en el constructor o métodos privados.
- Las propiedades internas no deben ser accedidas directamente desde fuera del dominio.
- Nunca deben usar DTOs como parámetros.

### 3. DTOs y validación
- Los DTOs deben estar decorados con `class-validator` y usarse solo en `application` y `controllers`.
- No se deben importar DTOs dentro de `domain`.

### 4. Controladores
- Solo reciben DTOs, llaman al `use-case` correspondiente y devuelven la respuesta mapeada.
- No deben contener lógica de transformación o validación extra.

### 5. Mappers
- Se deben usar mappers explícitos para convertir Entidades ↔ DTOs (por ejemplo: `AutoMapper.toHttp()`).

### 6. Repositorios
- La interface debe llamarse `IAutoRepository`, `IUsuarioRepository`, etc.
- El repositorio concreto debe ir en `infrastructure/prisma/` o similar.

---

## 📚 Convenciones de nombres

| Componente       | Ejemplo                          |
|------------------|----------------------------------|
| Caso de uso      | crear-auto.use-case.ts           |
| DTO              | crear-auto.dto.ts                |
| Mapper           | auto-to-http.mapper.ts           |
| Repositorio      | prisma-auto.repository.ts        |
| Entidad          | auto.entity.ts                   |
| Enum             | auto.enum.ts                     |

---

## 🔁 Flujo general del sistema

Controller → UseCase → Entity → Repository  
UseCase → DTO → Mapper → Response

---

## ⛔ Reglas de restricción para IA

- No sugerir lógica en controladores.
- No acceder a props privadas de entidades fuera del dominio.
- No proponer DTOs dentro de entidades.
- No generar clases o nombres fuera de las convenciones.
- No mover archivos entre capas.

---

Este archivo guía a la IA para mantener consistencia con la arquitectura del proyecto.
