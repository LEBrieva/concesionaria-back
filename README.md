# concesionaria-back

Backend para una aplicación de concesionarias de autos.
Construido con [NestJS](https://nestjs.com/), [Prisma](https://www.prisma.io/) y PostgreSQL.

![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)

---

## 🛠 Tech Stack

- Node.js + NestJS
- Prisma ORM
- PostgreSQL
- Docker (para la base de datos)
- Arquitectura DDD (Domain-Driven Design)
- Yarn 4.9.2 como gestor de paquetes (gestionado con Corepack)

## 🚀 Instalación

1. Clonar el repositorio:

   ```bash
   git clone git@github.com:LEBrieva/concesionaria-back.git
   cd concesionaria-back
   ```

2. **⚠️ IMPORTANTE - Habilitar Corepack (REQUERIDO):**

   Este proyecto usa Yarn 4.9.2 específicamente. Antes de instalar dependencias, **debes habilitar Corepack** para que use la versión correcta automáticamente:

   ```bash
   corepack enable
   ```

   > **¿Qué es Corepack?** Es una herramienta oficial de Node.js que garantiza que todos usen la misma versión de Yarn, ignorando versiones globales. Solo necesitas ejecutar este comando **una vez** en tu máquina.

3. Instalar dependencias:

   ```bash
   yarn install
   ```

   > Si obtienes un error sobre versiones de Yarn, asegúrate de haber ejecutado `corepack enable` primero.

## 🐘 Levantar base de datos con Docker

```bash
docker-compose up -d
```

Esto levantará la base de datos definida en el archivo `docker-compose.yml`.
Asegúrate de que las variables de entorno en `.env` coincidan con esta configuración.

## ⚙️ Configuración de variables de entorno

Copia el archivo `.env.template` a `.env` y ajusta los valores según tu entorno:

```bash
cp .env.template .env
```

> Las variables sensibles en producción se manejan mediante **GitHub Secrets**.

## 📦 Uso de Prisma

### Migrar la base de datos

Cada vez que modifiques `prisma/schema.prisma`, ejecutá:

```bash
yarn prisma migrate dev --name nombre-migracion
```

### Comandos útiles de Prisma

- Generar cliente:

  ```bash
  yarn prisma generate
  ```

- Ver estado de la base con Prisma Studio:

  ```bash
  yarn prisma studio
  ```

## 🧱 Estructura del proyecto

Este proyecto no utiliza el CLI de Nest para generar recursos automáticos. En su lugar, sigue una estructura basada en **DDD**:

- `domain`: entidades, interfaces, enums
- `application`: casos de uso, DTOs, validaciones
- `infrastructure`: persistencia con Prisma, mappers, proveedores externos
- `shared`: base entities, helpers y contratos comunes

## 🔁 Flujo de trabajo con Git

- `main`: rama de producción estable
- `develop`: rama de integración y staging
- `feature/*`: ramas para desarrollo de funcionalidades

```bash
git checkout -b feature/nueva-funcionalidad develop
```

> El despliegue a producción solo ocurre cuando `develop` se mergea a `main` y se genera un tag (`v1.0.0`, etc).

## 🧪 CI con GitHub Actions


El proyecto cuenta con integración continua usando GitHub Actions.
Cada vez que se hace push o PR a `main`, se ejecuta el workflow de CI:

- ✅ Instalación de dependencias
- ✅ Compilación del proyecto
- ✅ Ejecución de tests

Podés ver el archivo en `.github/workflows/ci.yml`.

> ⚠️ `main` está protegido: solo se puede hacer merge si los checks de CI pasan correctamente.

## 🧪 Comandos útiles

El proyecto cuenta con integración continua usando GitHub Actions.
Cada vez que se hace push o PR a `main`, se ejecuta el workflow de CI:

- ✅ Instalación de dependencias
- ✅ Compilación del proyecto
- ✅ Ejecución de tests

Podés ver el archivo en `.github/workflows/ci.yml`.

> ⚠️ `main` está protegido: solo se puede hacer merge si los checks de CI pasan correctamente.

## 🧪 Tests

El proyecto utiliza **Jest** para las pruebas. Actualmente se implementan pruebas **end-to-end (e2e)** que verifican la funcionalidad completa de la API.

### Ejecutar pruebas

- **Pruebas E2E** (recomendado):

  ```bash
  yarn test:e2e
  ```

- **Pruebas unitarias** (aún no implementadas):

  ```bash
  yarn test
  ```

- **Ver cobertura**:

  ```bash
  yarn test:cov
  ```

### Pruebas implementadas

- ✅ **Creación de autos**: Validación de DTOs, enums y persistencia
- ✅ **Validaciones de campos**: Campos requeridos, tipos de datos, rangos
- ✅ **Enum Marca**: Validación de marcas de vehículos permitidas
- ✅ **Casos edge**: Precios negativos, años futuros, kilometraje inválido

> **Nota**: Las pruebas E2E requieren que la base de datos esté funcionando. Asegúrate de tener Docker corriendo con `docker-compose up -d`.

## 🧪 Comandos útiles

- Levantar en desarrollo:

  ```bash
  yarn start:dev
  ```

## 📚 Recursos

- [Documentación NestJS](https://docs.nestjs.com)
- [Documentación Prisma](https://www.prisma.io/docs)
- [Prisma Studio](https://www.prisma.io/studio)
- [Yarn](https://classic.yarnpkg.com/en/docs/)

## 📝 Licencia

Este proyecto está licenciado bajo los términos de la licencia MIT. Ver el archivo `LICENSE` para más información.
