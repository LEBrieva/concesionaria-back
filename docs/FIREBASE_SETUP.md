# Configuración de Firebase Auth

## Resumen

La aplicación ahora soporta dos tipos de autenticación:

1. **JWT Manual** - Para usuarios internos (ADMIN, VENDEDOR)
2. **Firebase + Google Auth** - Para clientes (CLIENTE)

## Configuración de Firebase

### 1. Crear proyecto en Firebase

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Crea un nuevo proyecto o usa uno existente
3. Habilita Authentication > Sign-in method > Google

### 2. Configurar Firebase Admin SDK

1. Ve a Project Settings > Service accounts
2. Click en "Generate new private key"
3. Descarga el archivo JSON con las credenciales

### 3. Variables de entorno

Agrega estas variables a tu archivo `.env`:

```bash
# Firebase Admin SDK
FIREBASE_PROJECT_ID="tu-proyecto-firebase"
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\ntu-private-key-aqui\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL="firebase-adminsdk-xxxxx@tu-proyecto.iam.gserviceaccount.com"
```

**Nota**: El `FIREBASE_PRIVATE_KEY` debe incluir `\n` donde hay saltos de línea.

### 4. Configuración del Frontend

El frontend debe configurar Firebase Client SDK:

```javascript
// firebase-config.js
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "tu-api-key",
  authDomain: "tu-proyecto.firebaseapp.com",
  projectId: "tu-proyecto-firebase",
  // ... otros campos
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
```

## Flujos de Autenticación

### Usuarios Internos (ADMIN/VENDEDOR)

```http
POST /auth/login
Content-Type: application/json

{
  "email": "admin@empresa.com",
  "password": "password123"
}
```

**Respuesta:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "email": "admin@empresa.com",
    "nombre": "Admin",
    "rol": "ADMIN"
  }
}
```

### Clientes (Google Auth)

```http
POST /auth/google
Content-Type: application/json

{
  "firebaseToken": "eyJhbGciOiJSUzI1NiIsImtpZCI6..."
}
```

**Respuesta:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "email": "cliente@gmail.com",
    "nombre": "Cliente",
    "rol": "CLIENTE"
  }
}
```

## Implementación Frontend

### Ejemplo con React

```jsx
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth } from './firebase-config';

const LoginWithGoogle = () => {
  const handleGoogleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      
      // Obtener el ID Token
      const idToken = await result.user.getIdToken();
      
      // Enviar al backend
      const response = await fetch('/api/auth/google', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firebaseToken: idToken
        })
      });
      
      const data = await response.json();
      
      // Guardar el JWT en localStorage o donde prefieras
      localStorage.setItem('token', data.access_token);
      
    } catch (error) {
      console.error('Error:', error);
    }
  };

  return (
    <button onClick={handleGoogleLogin}>
      Iniciar sesión con Google
    </button>
  );
};
```

## Modo de Desarrollo

Si no configuras las credenciales de Firebase, el sistema funcionará en modo de desarrollo:

- Se generarán datos simulados para testing
- Se mostrará un warning en los logs
- **NO usar en producción**

## Seguridad

### Validaciones Implementadas

1. **Token de Firebase**: Se valida server-side con Firebase Admin SDK
2. **Email verificado**: Solo emails verificados pueden autenticarse
3. **Separación de roles**: Emails de empleados no pueden usar Google Auth
4. **JWT propio**: Se mantiene el sistema de JWT interno para consistencia

### Flujo de Seguridad

```mermaid
graph TD
    A[Cliente hace login con Google] --> B[Firebase Auth]
    B --> C[Frontend obtiene ID Token]
    C --> D[Frontend envía token a /auth/google]
    D --> E[Backend valida token con Firebase Admin]
    E --> F[Backend verifica email verificado]
    F --> G[Backend busca/crea usuario CLIENTE]
    G --> H[Backend genera JWT propio]
    H --> I[Cliente autenticado en el sistema]
```

## Troubleshooting

### Error: "Firebase Admin SDK no configurado"

- Verifica que las variables de entorno estén configuradas
- Asegúrate de que `FIREBASE_PRIVATE_KEY` tenga los saltos de línea correctos

### Error: "Token de Firebase inválido"

- Verifica que el token no haya expirado
- Asegúrate de que el proyecto ID coincida

### Error: "Este email está asociado a una cuenta de empleado"

- Un email que ya existe como ADMIN o VENDEDOR no puede usar Google Auth
- Usar el login tradicional para estos usuarios

## Comandos Útiles

```bash
# Verificar configuración
yarn start:dev

# Ver logs de Firebase
# Los logs mostrarán si Firebase está configurado correctamente
``` 