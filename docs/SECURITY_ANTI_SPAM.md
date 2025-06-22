# 🛡️ Protección Anti-Spam y Seguridad

## 🚨 **Riesgos Identificados**

- **Spam de autenticación**: Bots haciendo peticiones masivas a `/auth/google`
- **Ataques DDoS**: Intentos de saturar el servidor
- **Abuso de Firebase**: Incremento de costos por peticiones maliciosas
- **Cuentas falsas**: Creación masiva de usuarios ficticios

## 🛡️ **Estrategias de Protección Implementadas**

### 1. **Rate Limiting Multi-Nivel**

#### Global (Toda la aplicación):
- **3 requests/segundo** por IP
- **20 requests/10 segundos** por IP  
- **100 requests/minuto** por IP

#### Específico para Auth:
- **5 intentos/minuto** para login tradicional
- **10 intentos/minuto** para Google Auth

```typescript
// Configuración en app.module.ts
ThrottlerModule.forRoot([{
  name: 'short',
  ttl: 1000, // 1 segundo
  limit: 3,
}, {
  name: 'medium', 
  ttl: 10000, // 10 segundos
  limit: 20,
}, {
  name: 'long',
  ttl: 60000, // 1 minuto
  limit: 100,
}])
```

### 2. **Firebase Protection Guard**

Validaciones específicas para `/auth/google`:

#### User-Agent Filtering:
- Bloquea bots conocidos (crawler, spider, scraper)
- Rechaza User-Agents vacíos o muy cortos
- Logs de intentos sospechosos

#### Origin Validation:
- Verifica origen en producción
- Solo permite dominios autorizados
- Configurable via `ALLOWED_ORIGINS`

#### Token Size Validation:
- Firebase tokens: 800-2000 caracteres típicamente
- Rechaza tokens sospechosamente cortos (<50) o largos (>3000)
- Previene ataques con payloads maliciosos

### 3. **Firebase Built-in Protection**

Firebase incluye protecciones nativas:
- **DDoS protection** automático
- **Rate limiting** por proyecto
- **Fraud detection** para cuentas sospechosas
- **Geographic restrictions** (configurable)

### 4. **Monitoring y Alertas**

```typescript
// Logs automáticos de eventos sospechosos
this.logger.warn(`Blocked suspicious user-agent: ${userAgent}`);
this.logger.warn(`Blocked request from unauthorized origin: ${origin}`);
this.logger.warn(`Blocked request with suspicious token length: ${tokenLength}`);
```

## 📊 **Configuración de Producción**

### Variables de Entorno

```bash
# Orígenes permitidos (separados por coma)
ALLOWED_ORIGINS="https://tudominio.com,https://www.tudominio.com"

# Modo producción (activa validaciones estrictas)
NODE_ENV="production"

# Firebase (con límites más estrictos en consola)
FIREBASE_PROJECT_ID="tu-proyecto"
FIREBASE_CLIENT_EMAIL="..."
FIREBASE_PRIVATE_KEY="..."
```

### Firebase Console Settings

1. **Authentication > Settings**:
   - Habilitar **"Prevent sign-up from specified countries"**
   - Configurar **"Authorized domains"** solo para tu dominio

2. **Authentication > Advanced**:
   - **"Block functions from triggering"** en países sospechosos
   - **"SMS verification"** para números dudosos

## 💰 **Control de Costos**

### Límites en Firebase Console

1. **Quotas & System Limits**:
   - Establecer límite diario: 1000 auth/día
   - Alerta a 80% del límite
   - Bloqueo automático si se excede

2. **Billing Alerts**:
   - Alerta a $5 USD
   - Alerta a $10 USD
   - **Billing cap** opcional

### Monitoreo de Costos

```javascript
// Script para monitorear uso (Firebase Functions)
exports.monitorAuth = functions.auth.user().onCreate((user) => {
  // Contar auths diarias
  // Enviar alerta si excede umbral
  // Log de patrones sospechosos
});
```

## 🚨 **Alertas y Respuesta**

### Métricas a Monitorear

1. **Requests por minuto** > 50
2. **User-Agents sospechosos** > 10/hora
3. **Tokens inválidos** > 20/hora
4. **Orígenes no autorizados** > 5/hora

### Respuestas Automáticas

```typescript
// En caso de ataque detectado
if (suspiciousActivity > threshold) {
  // 1. Bloquear IP temporalmente
  // 2. Notificar al administrador
  // 3. Activar modo de emergencia
  // 4. Logs detallados
}
```

## 🔧 **Configuración Adicional**

### Reverse Proxy (Nginx/Cloudflare)

```nginx
# Límites adicionales en Nginx
limit_req_zone $binary_remote_addr zone=auth:10m rate=10r/m;

location /auth/ {
    limit_req zone=auth burst=5 nodelay;
    # Más configuraciones...
}
```

### Cloudflare (Recomendado)

- **DDoS Protection** automático
- **Rate Limiting** por país/IP
- **Bot Fight Mode**
- **Security Level**: High

## 📈 **Costos Estimados con Protección**

Con todas las protecciones:

- **Spam reducido**: ~95%
- **Requests legítimos**: 100-500/mes
- **Costo Firebase**: $0 (dentro del plan gratuito)
- **Falsos positivos**: <1%

### Escenario de Ataque

Sin protección:
- **10,000 requests maliciosos/día**
- **Costo**: ~$15-30/mes

Con protección:
- **50 requests maliciosos/día** (bloqueados)
- **Costo**: $0-2/mes

## ✅ **Checklist de Implementación**

- [x] Rate limiting global implementado
- [x] Rate limiting específico para auth
- [x] Firebase Protection Guard
- [x] Logs de seguridad
- [ ] Configurar ALLOWED_ORIGINS en producción
- [ ] Configurar límites en Firebase Console
- [ ] Configurar alertas de billing
- [ ] Implementar Cloudflare (opcional)
- [ ] Configurar monitoreo de métricas

## 🧪 **Testing de Protecciones**

```bash
# Test rate limiting
for i in {1..20}; do curl -X POST http://localhost:3000/auth/google; done

# Test User-Agent blocking
curl -X POST http://localhost:3000/auth/google -H "User-Agent: bot"

# Test token size validation
curl -X POST http://localhost:3000/auth/google -d '{"firebaseToken":"short"}'
```

## 📞 **Contacto de Emergencia**

En caso de ataque masivo:
1. **Bloquear tráfico** en Cloudflare/Nginx
2. **Desactivar temporalmente** `/auth/google`
3. **Revisar logs** para identificar patrón
4. **Contactar Firebase Support** si es necesario 