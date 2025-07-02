# Health Controller - Monitoreo de la Aplicación

## 🎯 Propósito

El `HealthController` proporciona endpoints para monitorear el estado de la aplicación y sus servicios externos. Es esencial para:

- **Monitoreo en producción**
- **Debugging y troubleshooting**
- **Integración con herramientas DevOps**
- **Verificación de configuración**

## 📋 Endpoints Disponibles

### 1. Health Check Básico

```http
GET /health
```

**Respuesta:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "service": "Concesionaria API"
}
```

**Casos de uso:**
- ✅ Verificar que la API está funcionando
- ✅ Load balancers y proxy reverso
- ✅ Monitoreo básico de uptime
- ✅ Smoke tests post-deploy

### 2. Health Check de Firebase

```http
GET /health/firebase
```

**Respuesta exitosa:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "services": {
    "firebase_auth": {
      "status": "ok",
      "message": "Firebase Auth configurado correctamente"
    },
    "firebase_storage": {
      "status": "ok",
      "message": "Firebase Storage configurado correctamente"
    }
  }
}
```

**Respuesta con errores:**
```json
{
  "status": "error",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "error": "Error details",
  "services": {
    "firebase_auth": {
      "status": "unknown",
      "message": "No se pudo verificar Firebase Auth"
    },
    "firebase_storage": {
      "status": "error",
      "message": "Error verificando Firebase Storage"
    }
  }
}
```

**Casos de uso:**
- 🔥 Verificar configuración de Firebase
- 🔥 Diagnosticar problemas de conectividad
- 🔥 Validar credenciales antes de usar la API
- 🔥 Alertas automáticas si Firebase falla

## 🚀 Casos de Uso Prácticos

### Monitoreo en Producción

```bash
# Verificar estado general cada 30 segundos
curl -f http://tu-api.com/health || echo "API DOWN!"

# Verificar Firebase cada 5 minutos
curl -f http://tu-api.com/health/firebase || echo "Firebase issues!"
```

### Debugging de Configuración

```bash
# Verificar si Firebase está bien configurado
curl http://localhost:3000/health/firebase

# Si hay errores, revisar:
# 1. Variables de entorno
# 2. Credenciales de Firebase
# 3. Conectividad de red
```

### Docker Health Checks

```dockerfile
# En tu Dockerfile
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1
```

### CI/CD Pipeline

```yaml
# En tu pipeline de deploy
- name: Verify API Health
  run: |
    curl -f $API_URL/health
    curl -f $API_URL/health/firebase
```

## 🛠️ Integración con Herramientas

### Uptime Monitoring
- **Pingdom**: Monitorear `/health` cada minuto
- **UptimeRobot**: Alertas si la API no responde
- **StatusPage**: Dashboard público de estado

### Load Balancers
- **Nginx**: Health check antes de enviar tráfico
- **HAProxy**: Detectar servidores caídos
- **AWS ALB**: Target group health checks

### Logging y Alertas
- **Prometheus**: Métricas de salud
- **Grafana**: Dashboards de monitoreo
- **PagerDuty**: Alertas críticas

## 🔧 Configuración Recomendada

### Variables de Entorno para Monitoreo

```bash
# Opcional: Configurar timeouts para health checks
HEALTH_CHECK_TIMEOUT=5000
FIREBASE_HEALTH_CHECK_ENABLED=true
```

### Nginx Configuration

```nginx
# Health check endpoint
location /health {
    access_log off;
    return 200 "healthy\n";
    add_header Content-Type text/plain;
}

# Proxy con health check
upstream api_backend {
    server api1:3000 max_fails=3 fail_timeout=30s;
    server api2:3000 max_fails=3 fail_timeout=30s;
}
```

## 📊 Interpretación de Respuestas

### Estados Posibles

| Estado | Significado | Acción Recomendada |
|--------|-------------|-------------------|
| `ok` | Todo funcionando | ✅ Ninguna |
| `error` | Hay problemas | ⚠️ Investigar logs |
| `unknown` | Estado indeterminado | 🔍 Verificar configuración |

### Códigos HTTP

| Código | Significado | Respuesta |
|--------|-------------|-----------|
| `200` | Saludable | Continuar operación |
| `500` | Error interno | Revisar logs y configuración |
| `503` | Servicio no disponible | Esperar o escalar |

## 🚨 Troubleshooting

### Firebase Storage Error

```bash
# Verificar configuración
curl http://localhost:3000/health/firebase

# Si falla, revisar:
echo $FIREBASE_PROJECT_ID
echo $FIREBASE_PRIVATE_KEY | head -c 50
echo $FIREBASE_CLIENT_EMAIL
```

### API No Responde

```bash
# Verificar que el servidor esté corriendo
curl -v http://localhost:3000/health

# Revisar logs
docker logs tu-contenedor
# o
pm2 logs
```

## 🔒 Consideraciones de Seguridad

### Información Sensible
- ❌ No exponer credenciales en respuestas
- ❌ No mostrar detalles internos en producción
- ✅ Logs detallados solo en desarrollo

### Rate Limiting
```typescript
// Opcional: Limitar requests de health check
@Throttle({ default: { limit: 100, ttl: 60000 } })
@Get()
async getHealth() {
  // ...
}
```

## 📈 Métricas Recomendadas

### Prometheus Metrics (Futuro)
- `health_check_duration_seconds`
- `firebase_connection_status`
- `api_uptime_seconds`
- `health_check_requests_total`

### Logs Estructurados
```json
{
  "timestamp": "2024-01-15T10:30:00.000Z",
  "level": "info",
  "message": "Health check performed",
  "service": "health-controller",
  "status": "ok",
  "response_time_ms": 45
}
```

## 🎯 Próximos Pasos

1. **Configurar monitoreo** en tu herramienta preferida
2. **Agregar alertas** para fallos críticos
3. **Integrar en CI/CD** para verificación post-deploy
4. **Documentar runbooks** para problemas comunes

---

> **Nota**: Este controller es opcional pero altamente recomendado para aplicaciones en producción. Facilita el monitoreo, debugging y mantenimiento de la aplicación. 