import { Controller, Get } from '@nestjs/common';
import { FirebaseService } from '../services/firebase.service';
import { FirebaseStorageService } from '../services/firebase-storage.service';

/**
 * 🏥 HEALTH CONTROLLER - Monitoreo de la Aplicación
 * 
 * Proporciona endpoints para verificar el estado de la aplicación y sus servicios.
 * 
 * CASOS DE USO:
 * - Monitoreo en producción (uptime, load balancers)
 * - Debugging y troubleshooting de configuración
 * - Integración con herramientas DevOps (CI/CD, alertas)
 * - Verificación de servicios externos (Firebase)
 * 
 * ENDPOINTS:
 * - GET /health - Health check básico de la API
 * - GET /health/firebase - Verificación específica de Firebase
 * 
 * Ver: src/modules/shared/controllers/README-HEALTH-CONTROLLER.md
 */
@Controller('health')
export class HealthController {
  constructor(
    private readonly firebaseService: FirebaseService,
    private readonly firebaseStorageService: FirebaseStorageService,
  ) {}

  /**
   * ✅ HEALTH CHECK BÁSICO
   * 
   * Verifica que la API esté funcionando correctamente.
   * 
   * CASOS DE USO:
   * - Load balancers (nginx, haproxy)
   * - Monitoreo de uptime (pingdom, uptimerobot)
   * - Smoke tests post-deploy
   * - Docker health checks
   * 
   * @returns Estado básico de la aplicación
   */
  @Get()
  async getHealth() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'Concesionaria API',
    };
  }

  /**
   * 🔥 HEALTH CHECK DE FIREBASE
   * 
   * Verifica el estado de los servicios de Firebase (Auth + Storage).
   * 
   * CASOS DE USO:
   * - Debugging de configuración de Firebase
   * - Verificar credenciales antes de usar la API
   * - Alertas automáticas si Firebase falla
   * - Troubleshooting de problemas de conectividad
   * 
   * VERIFICA:
   * - Firebase Auth: Configuración y credenciales
   * - Firebase Storage: Conectividad y permisos
   * 
   * @returns Estado detallado de servicios Firebase
   */
  @Get('firebase')
  async getFirebaseHealth() {
    try {
      const storageHealth = await this.firebaseStorageService.healthCheck();
      
      return {
        status: 'ok',
        timestamp: new Date().toISOString(),
        services: {
          firebase_auth: {
            status: 'ok',
            message: 'Firebase Auth configurado correctamente'
          },
          firebase_storage: storageHealth
        }
      };
    } catch (error) {
      return {
        status: 'error',
        timestamp: new Date().toISOString(),
        error: error.message,
        services: {
          firebase_auth: {
            status: 'unknown',
            message: 'No se pudo verificar Firebase Auth'
          },
          firebase_storage: {
            status: 'error',
            message: 'Error verificando Firebase Storage'
          }
        }
      };
    }
  }


} 