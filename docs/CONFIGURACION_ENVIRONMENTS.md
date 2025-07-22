# Configuración de GitHub Environments

## 🎯 Objetivo

Configurar environments separados para `development`, `production` y `testing` con variables específicas para cada entorno, garantizando que los tests siempre usen Firebase Mock.

## 📋 Environments a Crear

### 1. Environment: `testing`
- **Uso**: Tests automáticos en CI/CD
- **Características**: Siempre usa Firebase Mock, BD de test

### 2. Environment: `development` 
- **Uso**: Deploy de rama `develop`
- **Características**: Puede usar Firebase real o mock según configuración

### 3. Environment: `production`
- **Uso**: Deploy de rama `main`
- **Características**: Siempre usa Firebase real con credenciales de producción

## 🔧 Configuración Paso a Paso

### Paso 1: Crear Environments en GitHub

1. Ve a tu repositorio en GitHub
2. Click en **Settings** > **Environments**
3. Click en **New environment** y crea cada uno:
   - `testing`
   - `development` 
   - `production`

### Paso 2: Configurar Environment `testing`

**Variables (Variables tab):**
```
MAX_IMAGE_SIZE_MB=5
MAX_FILES=10
USE_FIREBASE_MOCK=true
```

**Secrets (Secrets tab):**
```
(No necesarios - testing siempre usa mock y BD hardcodeada)
```

> ⚠️ **Importante**: Testing no necesita credenciales Firebase ni DATABASE_URL porque usa mock y BD de test hardcodeada.

### Paso 3: Configurar Environment `development`

**Variables (Variables tab):**
```
FIREBASE_PROJECT_ID=tu-proyecto-dev
FIREBASE_STORAGE_BUCKET=tu-proyecto-dev.appspot.com
MAX_IMAGE_SIZE_MB=5
MAX_FILES=10
DATABASE_URL=postgresql://user:pass@host:5432/concesionaria_dev
```

**Secrets (Secrets tab):**
```
FIREBASE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\ntu-private-key-dev\n-----END PRIVATE KEY-----
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@tu-proyecto-dev.iam.gserviceaccount.com
```

### Paso 4: Configurar Environment `production`

**Variables (Variables tab):**
```
FIREBASE_PROJECT_ID=tu-proyecto-prod
FIREBASE_STORAGE_BUCKET=tu-proyecto-prod.appspot.com
MAX_IMAGE_SIZE_MB=5
MAX_FILES=10
DATABASE_URL=postgresql://user:pass@host:5432/concesionaria_prod
```

**Secrets (Secrets tab):**
```
FIREBASE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\ntu-private-key-prod\n-----END PRIVATE KEY-----
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@tu-proyecto-prod.iam.gserviceaccount.com
```

**Protection Rules:**
- ✅ **Required reviewers**: Agrega usuarios que deben aprobar deploys
- ✅ **Wait timer**: 5 minutos (opcional)
- ✅ **Deployment branches**: Solo `main`

## 🔄 Flujo de Trabajo

### Tests Automáticos (Cualquier rama)
```
Trigger: Push/PR → Environment: testing → Firebase Mock → Tests pasan ✅
```

### Deploy Development
```
Trigger: Push a develop → Environment: development → Firebase Real → Deploy a staging
```

### Deploy Production
```
Trigger: Push a main → Environment: production → Aprobación → Firebase Real → Deploy a prod
```

## 🧪 Lógica de Selección de Servicio

El sistema automáticamente decide qué servicio usar:

```typescript
const useFirebaseMock = 
  process.env.NODE_ENV === 'test' ||           // Siempre en tests
  process.env.USE_FIREBASE_MOCK === 'true' ||  // Forzado manualmente
  !process.env.FIREBASE_PROJECT_ID ||          // Sin credenciales
  !process.env.FIREBASE_PRIVATE_KEY ||         
  !process.env.FIREBASE_CLIENT_EMAIL;
```

## 📊 Matriz de Configuración

| Environment | Rama | Firebase Service | Database | Aprobación |
|-------------|------|------------------|----------|------------|
| `testing` | Cualquiera | Mock | Test | No |
| `development` | `develop` | Real/Mock* | Dev | No |
| `production` | `main` | Real | Prod | Sí |

*\* Según disponibilidad de credenciales*

## 🔐 Seguridad

### Variables Públicas vs Secrets

**Variables (públicas):**
- `FIREBASE_PROJECT_ID`
- `FIREBASE_STORAGE_BUCKET`
- `MAX_IMAGE_SIZE_MB`
- `MAX_FILES`
- `USE_FIREBASE_MOCK`
- `DATABASE_URL` (para development y production)

**Secrets (privados):**
- `FIREBASE_PRIVATE_KEY`
- `FIREBASE_CLIENT_EMAIL`

### Formato de Private Key

⚠️ **Crítico**: El `FIREBASE_PRIVATE_KEY` debe incluir `\n` donde hay saltos de línea:

```
-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBg...\n-----END PRIVATE KEY-----
```

## 🚨 Troubleshooting

### Tests fallan con "Firebase Storage no está disponible"

**Síntoma:**
```
Firebase Storage no está disponible
```

**Solución:**
1. Verificar que `USE_FIREBASE_MOCK=true` en CI/CD
2. Verificar que el servicio mock esté importado correctamente
3. Verificar logs para confirmar que se usa el mock:
   ```
   [FirebaseStorageMockService] 🧪 USANDO FIREBASE STORAGE MOCK
   ```

### Environment no se asigna correctamente

**Síntoma:**
Variables del environment incorrecto se cargan

**Solución:**
Verificar la lógica en `.github/workflows/ci.yml`:
```yaml
environment: ${{ github.ref == 'refs/heads/main' && 'production' || (github.ref == 'refs/heads/develop' && 'development' || 'testing') }}
```

### Firebase real no funciona en development/production

**Síntoma:**
```
Firebase Admin SDK no configurado
```

**Solución:**
1. Verificar que las credenciales estén configuradas en el environment
2. Verificar formato del `FIREBASE_PRIVATE_KEY`
3. Verificar que `USE_FIREBASE_MOCK` no esté en `true`

## 🧪 Testing Local

### Probar con Mock
```bash
export USE_FIREBASE_MOCK=true
yarn test:e2e
```

### Probar con Firebase Real
```bash
export USE_FIREBASE_MOCK=false
export FIREBASE_PROJECT_ID="tu-proyecto"
export FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n..."
export FIREBASE_CLIENT_EMAIL="..."
yarn test:e2e
```

## 📝 Logs de Diagnóstico

### Con Mock (Correcto para tests)
```
[FirebaseStorageMockService] 🧪 USANDO FIREBASE STORAGE MOCK - Solo para tests/desarrollo
[FirebaseStorageMockService] 🧪 Mock: Imagen "subida" exitosamente: test-123.jpg
```

### Con Firebase Real (Correcto para producción)
```
[FirebaseStorageService] Firebase Storage configurado con bucket: proyecto-prod.appspot.com
[FirebaseStorageService] Imagen subida exitosamente: imagen-123.jpg
```

## ✅ Checklist de Configuración

- [ ] Crear 3 environments en GitHub (`testing`, `development`, `production`)
- [ ] Configurar variables para cada environment
- [ ] Configurar secrets para cada environment
- [ ] Configurar protection rules para `production`
- [ ] Verificar que `USE_FIREBASE_MOCK=true` en testing
- [ ] Probar push a `develop` (debe usar `development`)
- [ ] Probar push a `main` (debe usar `production`)
- [ ] Verificar que tests pasen en todos los casos

## 🔗 Referencias

- [GitHub Environments Documentation](https://docs.github.com/en/actions/deployment/targeting-different-environments/using-environments-for-deployment)
- [Firebase Admin SDK Setup](https://firebase.google.com/docs/admin/setup)
- [Configuración Local](../README.md) 