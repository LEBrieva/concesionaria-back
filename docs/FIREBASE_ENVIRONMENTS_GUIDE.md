# Configuración de Firebase por Entornos

## 🎯 Opciones de Configuración

### Opción A: Un Solo Proyecto Firebase (Más Simple)

Si quieres usar el mismo proyecto Firebase para desarrollo y producción:

#### 1. Configuración en Firebase Console
- Usa tu proyecto existente
- Organiza archivos por carpetas en Storage:
  ```
  tu-proyecto.appspot.com/
  ├── development/
  │   └── autos/
  ├── production/
  │   └── autos/
  └── testing/
      └── autos/
  ```

#### 2. GitHub Environments - Variables

**Environment: `development`**
```
FIREBASE_PROJECT_ID=tu-proyecto-firebase
FIREBASE_STORAGE_BUCKET=tu-proyecto-firebase.appspot.com
STORAGE_FOLDER=development
MAX_IMAGE_SIZE_MB=5
MAX_FILES=10
```

**Environment: `production`**
```
FIREBASE_PROJECT_ID=tu-proyecto-firebase
FIREBASE_STORAGE_BUCKET=tu-proyecto-firebase.appspot.com
STORAGE_FOLDER=production
MAX_IMAGE_SIZE_MB=5
MAX_FILES=10
```

**Environment: `testing`**
```
MAX_IMAGE_SIZE_MB=5
MAX_FILES=10
USE_FIREBASE_MOCK=true
```

#### 3. GitHub Environments - Secrets (Iguales para dev y prod)

**Todos los environments (development y production):**
```
FIREBASE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\ntu-private-key\n-----END PRIVATE KEY-----
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@tu-proyecto.iam.gserviceaccount.com
```

### Opción B: Proyectos Separados (Recomendado)

Si quieres máxima separación y seguridad:

#### 1. Crear Proyectos en Firebase Console

**Proyecto Development:**
- Nombre: `tu-concesionaria-dev`
- Storage: `tu-concesionaria-dev.appspot.com`

**Proyecto Production:**
- Nombre: `tu-concesionaria-prod`
- Storage: `tu-concesionaria-prod.appspot.com`

#### 2. GitHub Environments - Variables

**Environment: `development`**
```
FIREBASE_PROJECT_ID=tu-concesionaria-dev
FIREBASE_STORAGE_BUCKET=tu-concesionaria-dev.appspot.com
MAX_IMAGE_SIZE_MB=5
MAX_FILES=10
```

**Environment: `production`**
```
FIREBASE_PROJECT_ID=tu-concesionaria-prod
FIREBASE_STORAGE_BUCKET=tu-concesionaria-prod.appspot.com
MAX_IMAGE_SIZE_MB=5
MAX_FILES=10
```

#### 3. GitHub Environments - Secrets (Diferentes)

**Environment: `development`**
```
FIREBASE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\nkey-dev\n-----END PRIVATE KEY-----
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@tu-concesionaria-dev.iam.gserviceaccount.com
```

**Environment: `production`**
```
FIREBASE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\nkey-prod\n-----END PRIVATE KEY-----
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@tu-concesionaria-prod.iam.gserviceaccount.com
```

## 🤔 ¿Cuál Elegir?

### Opción A (Un proyecto) - Pros y Contras

**✅ Pros:**
- Más simple de configurar
- Solo un proyecto que administrar
- Mismas credenciales para ambos entornos

**❌ Contras:**
- Menos seguridad (prod y dev mezclados)
- Riesgo de borrar archivos de producción por error
- Harder to manage permissions

### Opción B (Proyectos separados) - Pros y Contras

**✅ Pros:**
- Máxima seguridad y separación
- Diferentes permisos por entorno
- Fácil backup/restore por separado
- Mejor para equipos grandes

**❌ Contras:**
- Más configuración inicial
- Dos proyectos que administrar
- Costos separados (si aplica)

## 🔧 Modificación del Código (Solo para Opción A)

Si eliges la **Opción A** (un proyecto con carpetas), necesitas modificar el código para usar carpetas:

```typescript
// En firebase-storage.service.ts
async uploadImage(file: Express.Multer.File, options: ImageUploadOptions = {}) {
  const environment = process.env.NODE_ENV === 'production' ? 'production' : 'development';
  const folder = process.env.STORAGE_FOLDER || environment;
  
  const uploadConfig = {
    folder: `${folder}/autos`, // Esto creará: development/autos/ o production/autos/
    // ... resto de config
  };
  
  // ... resto del método
}
```

## 🚀 Recomendación

Para tu caso, te recomiendo **empezar con la Opción A** (un proyecto) por simplicidad, y luego migrar a la Opción B cuando tengas más experiencia o necesites mayor seguridad.

### Configuración Rápida (Opción A):

1. **Usa tu proyecto Firebase existente**
2. **En GitHub Environments, configura:**
   - Mismas credenciales para development y production
   - Solo cambia `STORAGE_FOLDER` si quieres separar por carpetas
3. **Los tests seguirán usando el mock automáticamente**

### Configuración de GitHub (Opción A):

```yaml
# En .github/workflows/ci.yml (ya está configurado)
environment: ${{ github.ref == 'refs/heads/main' && 'production' || (github.ref == 'refs/heads/develop' && 'development' || 'testing') }}
```

## ✅ Pasos Inmediatos

1. **Decide qué opción prefieres**
2. **Configura los environments en GitHub con las variables correspondientes**
3. **Haz push para probar que funcione**

¿Cuál opción prefieres? ¿Necesitas ayuda configurando alguna de las dos? 