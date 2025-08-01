#  Entidad Clientes - Especificación Completa para MVP

## 🎯 **Resumen Ejecutivo**

La entidad **Clientes** se separa de **Usuarios** para crear un sistema completo de CRM, analytics y email marketing. Mientras que **Usuarios** maneja la operación interna (ADMIN, VENDEDOR), **Clientes** gestiona la experiencia externa, tracking de comportamiento y automatizaciones de marketing.

---

## 🏗️ **Arquitectura de Entidades**

### **1. Modelo Principal - Cliente**

```typescript
model Cliente {
  id                    String   @id @default(uuid())
  
  // Información Personal
  nombre                String
  apellido              String
  email                 String   @unique
  telefono              String?
  fechaNacimiento       DateTime?
  
  // Autenticación (separada de Usuarios internos)
  password              String?  // Opcional para clientes que solo navegan
  emailVerificado       Boolean  @default(false)
  tokenVerificacion     String?
  
  // Preferencias y Segmentación
  rangoPresupuestoMin   Int?     // Presupuesto mínimo de interés
  rangoPresupuestoMax   Int?     // Presupuesto máximo de interés
  marcasInteres         Marca[]  // Array de marcas de interés
  tipoAutoInteres       TipoAuto[] // SUV, SEDAN, HATCHBACK, etc.
  
  // Marketing y Comunicación
  suscritoNewsletter    Boolean  @default(false)
  aceptaMarketing       Boolean  @default(false)
  preferenciaContacto   PreferenciaContacto @default(EMAIL) // EMAIL, TELEFONO, WHATSAPP
  
  // Tracking y Analytics
  ultimaActividad       DateTime @default(now())
  totalVistasAutos      Int      @default(0)
  totalClicksAutos      Int      @default(0)
  totalConsultas        Int      @default(0)
  
  // Relaciones
  vistasAutos           VistaAuto[]
  clicksAutos           ClickAuto[]
  favoritosCliente      FavoritoCliente[]
  consultas             Consulta[]
  emailsRecibidos       EmailEnviado[]
  
  // Auditoría
  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt
  active                Boolean  @default(true)
  
  @@map("clientes")
}
```

### **2. Enums Adicionales**

```typescript
enum TipoAuto {
  SEDAN
  SUV
  HATCHBACK
  COUPE
  CONVERTIBLE
  PICKUP
  WAGON
  CROSSOVER
  OTRO
}

enum PreferenciaContacto {
  EMAIL
  TELEFONO
  WHATSAPP
  NO_CONTACTAR
}

enum TipoClick {
  VER_DETALLES
  VER_FOTOS
  CONTACTAR_VENDEDOR
  SOLICITAR_INFO
  COMPARTIR
  FAVORITO
  CALCULAR_FINANCIACION
}

enum EstadoConsulta {
  NUEVA
  EN_PROCESO
  RESPONDIDA
  CERRADA
  SPAM
}

enum TipoConsulta {
  INFORMACION_GENERAL
  SOLICITAR_PRUEBA
  CONSULTA_PRECIO
  FINANCIACION
  DISPONIBILIDAD
  OTRO
}
```

### **3. Entidades de Tracking**

```typescript
model VistaAuto {
  id              String   @id @default(uuid())
  clienteId       String?  // Opcional - puede ser visitante anónimo
  autoId          String
  
  // Tracking Data
  fechaVista      DateTime @default(now())
  tiempoEnPagina  Int?     // Segundos en la página
  dispositivo     String?  // mobile, desktop, tablet
  navegador       String?  // chrome, firefox, safari
  sistemaOperativo String? // windows, mac, android, ios
  resolucion      String?  // 1920x1080
  
  // Contexto de la Vista
  paginaOrigen    String?  // De dónde vino (home, búsqueda, favoritos)
  terminoBusqueda String?  // Si vino de búsqueda
  
  // Relaciones
  cliente         Cliente? @relation(fields: [clienteId], references: [id])
  auto            Auto     @relation(fields: [autoId], references: [id])
  
  @@map("vistas_autos")
}

model ClickAuto {
  id              String   @id @default(uuid())
  clienteId       String?  // Opcional - puede ser visitante anónimo
  autoId          String
  
  // Click Data
  tipoClick       TipoClick
  fechaClick      DateTime @default(now())
  elementoClick   String?  // Qué elemento específico clickeó
  posicionClick   String?  // Posición en la página (header, gallery, etc.)
  
  // Contexto
  paginaActual    String?  // En qué página estaba
  dispositivo     String?
  
  // Relaciones
  cliente         Cliente? @relation(fields: [clienteId], references: [id])
  auto            Auto     @relation(fields: [autoId], references: [id])
  
  @@map("clicks_autos")
}

model FavoritoCliente {
  id              String   @id @default(uuid())
  clienteId       String
  autoId          String
  fechaAgregado   DateTime @default(now())
  activo          Boolean  @default(true)
  
  // Relaciones
  cliente         Cliente  @relation(fields: [clienteId], references: [id])
  auto            Auto     @relation(fields: [autoId], references: [id])
  
  @@unique([clienteId, autoId])
  @@map("favoritos_clientes")
}
```

### **4. Sistema de Consultas**

```typescript
model Consulta {
  id              String   @id @default(uuid())
  clienteId       String?  // Opcional - puede consultar sin registrarse
  autoId          String?  // Opcional - puede ser consulta general
  
  // Información de Contacto (si no está registrado)
  nombreContacto  String?
  emailContacto   String?
  telefonoContacto String?
  
  // Contenido de la Consulta
  tipoConsulta    TipoConsulta @default(INFORMACION_GENERAL)
  asunto          String
  mensaje         String
  
  // Gestión Interna
  estado          EstadoConsulta @default(NUEVA)
  prioridad       Int      @default(1) // 1=baja, 2=media, 3=alta
  asignadoA       String?  // ID del vendedor asignado
  
  // Seguimiento
  fechaConsulta   DateTime @default(now())
  fechaRespuesta  DateTime?
  fechaCierre     DateTime?
  respuestaInterna String? // Respuesta del vendedor
  
  // Metadata
  dispositivo     String?
  navegador       String?
  ipOrigen        String?
  
  // Relaciones
  cliente         Cliente? @relation(fields: [clienteId], references: [id])
  auto            Auto?    @relation(fields: [autoId], references: [id])
  
  @@map("consultas")
}
```

### **5. Sistema de Email Marketing**

```typescript
model EmailCampaign {
  id              String   @id @default(uuid())
  
  // Configuración de Campaña
  nombre          String
  asunto          String
  contenidoHtml   String
  contenidoTexto  String?
  
  // Segmentación
  segmentoClientes Json    // Filtros de segmentación
  totalDestinatarios Int   @default(0)
  
  // Programación
  fechaCreacion   DateTime @default(now())
  fechaEnvio      DateTime?
  fechaProgramada DateTime?
  estado          EstadoCampaign @default(BORRADOR)
  
  // Estadísticas
  totalEnviados   Int      @default(0)
  totalAbiertos   Int      @default(0)
  totalClicks     Int      @default(0)
  totalRebotes    Int      @default(0)
  
  // Relaciones
  emailsEnviados  EmailEnviado[]
  
  // Auditoría
  creadoPor       String   // ID del usuario que creó
  
  @@map("email_campaigns")
}

enum EstadoCampaign {
  BORRADOR
  PROGRAMADA
  ENVIANDO
  ENVIADA
  CANCELADA
}

model EmailEnviado {
  id              String   @id @default(uuid())
  campaignId      String
  clienteId       String
  
  // Tracking
  fechaEnvio      DateTime @default(now())
  fechaApertura   DateTime?
  fechaClick      DateTime?
  fechaRebote     DateTime?
  
  // Estado
  entregado       Boolean  @default(false)
  abierto         Boolean  @default(false)
  clickeado       Boolean  @default(false)
  rebotado        Boolean  @default(false)
  
  // Metadata
  motivoRebote    String?
  userAgent       String?  // Del cliente que abrió
  
  // Relaciones
  campaign        EmailCampaign @relation(fields: [campaignId], references: [id])
  cliente         Cliente  @relation(fields: [clienteId], references: [id])
  
  @@map("emails_enviados")
}
```

---

## 🔗 **Modificaciones a Entidades Existentes**

### **Auto.entity - Agregar Tracking**

```typescript
model Auto {
  // ... campos existentes ...
  
  // Nuevas relaciones para tracking
  vistasAutos           VistaAuto[]
  clicksAutos           ClickAuto[]
  favoritosClientes     FavoritoCliente[]
  consultas             Consulta[]
  
  // Métricas calculadas (se actualizan con triggers o jobs)
  totalVistas           Int      @default(0)
  totalClicks           Int      @default(0)
  totalConsultas        Int      @default(0)
  tasaConversion        Float    @default(0) // clicks/vistas
  
  // ... resto de campos existentes ...
}
```

### **TipoEntidad - Agregar CLIENTE**

```typescript
enum TipoEntidad {
  AUTO
  USUARIO
  CLIENTE  // Nuevo
}
```

---

## 🚀 **Endpoints API**

### **1. Endpoints Públicos (Sin Autenticación)**

```typescript
// === NAVEGACIÓN ANÓNIMA ===
GET    /publico/autos                    // Catálogo público (ya existe)
GET    /publico/autos/favoritos          // Banner destacados (ya existe)
GET    /publico/autos/:id                // Detalle de auto

// === TRACKING ANÓNIMO ===
POST   /publico/tracking/vista-auto      // Registrar vista de auto
POST   /publico/tracking/click-auto      // Registrar click en auto

// === REGISTRO Y CONSULTAS ===
POST   /publico/clientes/registrar       // Registro de cliente
POST   /publico/clientes/verificar-email // Verificación de email
POST   /publico/consultas                // Enviar consulta sin registro
POST   /publico/newsletter/suscribir     // Suscripción a newsletter
```

### **2. Endpoints de Cliente (Autenticación de Cliente)**

```typescript
// === AUTENTICACIÓN ===
POST   /clientes/auth/login              // Login de cliente
POST   /clientes/auth/logout             // Logout
POST   /clientes/auth/refresh-token      // Refresh token
POST   /clientes/auth/forgot-password    // Recuperar contraseña

// === PERFIL ===
GET    /clientes/perfil                  // Obtener perfil
PUT    /clientes/perfil                  // Actualizar perfil
DELETE /clientes/perfil                  // Eliminar cuenta

// === ACTIVIDAD ===
GET    /clientes/historial-vistas        // Autos que vio
GET    /clientes/favoritos               // Sus favoritos personales
POST   /clientes/favoritos/:autoId       // Agregar/quitar favorito
GET    /clientes/consultas               // Sus consultas
POST   /clientes/consultas               // Nueva consulta

// === PREFERENCIAS ===
PUT    /clientes/preferencias             // Actualizar preferencias
PUT    /clientes/marketing-preferences   // Preferencias de marketing
```

### **3. Endpoints Admin (Gestión Interna)**

```typescript
// === GESTIÓN DE CLIENTES ===
GET    /admin/clientes                   // Listar clientes con filtros
GET    /admin/clientes/:id               // Detalle de cliente
PUT    /admin/clientes/:id/estado        // Activar/desactivar cliente
GET    /admin/clientes/:id/actividad     // Actividad del cliente

// === CONSULTAS CRM ===
GET    /admin/consultas                  // Listar todas las consultas
GET    /admin/consultas/:id              // Detalle de consulta
PUT    /admin/consultas/:id              // Actualizar consulta
PUT    /admin/consultas/:id/asignar      // Asignar a vendedor
POST   /admin/consultas/:id/responder    // Responder consulta

// === ANALYTICS ===
GET    /admin/analytics/clientes         // Métricas de clientes
GET    /admin/analytics/autos-populares  // Autos más vistos/clickeados
GET    /admin/analytics/conversion       // Tasas de conversión
GET    /admin/analytics/segmentos        // Análisis de segmentos

// === EMAIL MARKETING ===
GET    /admin/email-campaigns            // Listar campañas
POST   /admin/email-campaigns            // Crear campaña
PUT    /admin/email-campaigns/:id        // Editar campaña
POST   /admin/email-campaigns/:id/enviar // Enviar campaña
GET    /admin/email-campaigns/:id/stats  // Estadísticas de campaña
```

---

## 📊 **Casos de Uso y Automatizaciones**

### **1. Tracking Automático**

```typescript
// Ejemplo de implementación
export class TrackingService {
  async registrarVistaAuto(data: {
    autoId: string;
    clienteId?: string;
    dispositivo?: string;
    navegador?: string;
    tiempoEnPagina?: number;
  }) {
    // Registrar vista
    const vista = await this.vistaRepository.create(data);
    
    // Actualizar contador en Auto
    await this.autoRepository.incrementarVistas(data.autoId);
    
    // Si es cliente registrado, actualizar su actividad
    if (data.clienteId) {
      await this.clienteRepository.actualizarUltimaActividad(data.clienteId);
    }
    
    return vista;
  }
}
```

### **2. Segmentación Automática**

```typescript
// Ejemplos de segmentos
export const SEGMENTOS_AUTOMATICOS = {
  PREMIUM_BUYERS: {
    nombre: "Compradores Premium",
    filtros: {
      rangoPresupuestoMin: { gte: 50000 },
      totalVistasAutos: { gte: 5 }
    }
  },
  
  HOT_LEADS: {
    nombre: "Leads Calientes",
    filtros: {
      totalVistasAutos: { gte: 10 },
      ultimaActividad: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } // Últimos 7 días
    }
  },
  
  INACTIVE_CLIENTS: {
    nombre: "Clientes Inactivos",
    filtros: {
      ultimaActividad: { lte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }, // Más de 30 días
      totalVistasAutos: { gte: 1 }
    }
  }
};
```

### **3. Automatizaciones de Email**

```typescript
// Triggers automáticos
export class EmailAutomationService {
  
  // Bienvenida al registrarse
  async enviarBienvenida(clienteId: string) {
    const template = await this.getTemplate('BIENVENIDA');
    await this.emailService.enviar(clienteId, template);
  }
  
  // Auto similar cuando ve un auto
  async sugerirAutosSimilares(clienteId: string, autoId: string) {
    const autosSimilares = await this.autoService.encontrarSimilares(autoId);
    const template = await this.getTemplate('AUTOS_SIMILARES');
    
    // Enviar después de 24 horas
    await this.scheduleEmail(clienteId, template, { 
      autos: autosSimilares,
      delay: '24h' 
    });
  }
  
  // Re-engagement para inactivos
  async reactivarInactivos() {
    const clientesInactivos = await this.clienteService.obtenerInactivos(30); // 30 días
    const template = await this.getTemplate('REACTIVACION');
    
    for (const cliente of clientesInactivos) {
      await this.emailService.enviar(cliente.id, template);
    }
  }
}
```

---

## 🎯 **Plan de Implementación**

### **Fase 1: Base (Este Finde)**

```typescript
// Prioridad 1 - Entidades Core
✅ Modelo Cliente básico
✅ Enums necesarios (TipoAuto, PreferenciaContacto)
✅ Migración de base de datos
✅ Registro público de clientes
✅ Login/logout básico de clientes

// Endpoints Fase 1
POST /publico/clientes/registrar
POST /clientes/auth/login
GET  /clientes/perfil
PUT  /clientes/perfil
```

### **Fase 2: Tracking (Siguiente Semana)**

```typescript
// Prioridad 2 - Analytics Básico
✅ Modelos VistaAuto y ClickAuto
✅ Tracking anónimo de vistas
✅ Favoritos personales de clientes
✅ Consultas básicas

// Endpoints Fase 2
POST /publico/tracking/vista-auto
POST /publico/tracking/click-auto
GET  /clientes/favoritos
POST /clientes/favoritos/:autoId
POST /publico/consultas
```

### **Fase 3: CRM (Post-MVP)**

```typescript
// Prioridad 3 - Gestión Interna
✅ Dashboard de clientes para admin
✅ Gestión de consultas
✅ Analytics básico
✅ Segmentación manual

// Endpoints Fase 3
GET /admin/clientes
GET /admin/consultas
GET /admin/analytics/clientes
```

### **Fase 4: Email Marketing (Futuro)**

```typescript
// Prioridad 4 - Automatización
✅ Sistema de campañas
✅ Templates de email
✅ Automatizaciones
✅ Segmentación automática

// Endpoints Fase 4
POST /admin/email-campaigns
GET  /admin/email-campaigns/:id/stats
```

---

## 🔧 **Consideraciones Técnicas**

### **1. Autenticación Separada**
- **Usuarios**: Firebase + JWT (ya implementado)
- **Clientes**: JWT propio o Auth0 (más simple)
- **Públicos**: Sin auth (tracking anónimo)

### **2. Performance**
```typescript
// Índices recomendados
@@index([clienteId, fechaVista]) // VistaAuto
@@index([autoId, fechaVista])    // VistaAuto
@@index([clienteId, tipoClick])  // ClickAuto
@@index([ultimaActividad])       // Cliente
@@index([estado])                // Consulta
```

### **3. Jobs y Tareas Programadas**
```typescript
// Cron jobs necesarios
- Actualizar métricas de autos (cada hora)
- Enviar emails de reactivación (diario)
- Limpiar datos de tracking antiguos (semanal)
- Calcular segmentos automáticos (diario)
```

### **4. Validaciones**
```typescript
// DTOs importantes
export class RegistrarClienteDto {
  @IsEmail()
  email: string;
  
  @IsString()
  @MinLength(2)
  nombre: string;
  
  @IsOptional()
  @IsArray()
  @IsEnum(Marca, { each: true })
  marcasInteres?: Marca[];
}
```

---

## 📈 **Métricas de Éxito**

### **KPIs a Trackear**
- **Conversión**: Vistas → Consultas → Ventas
- **Engagement**: Tiempo en página, páginas por sesión
- **Retención**: Clientes que vuelven, frecuencia de visitas
- **Email**: Open rate, click rate, unsubscribe rate

### **Reportes Automáticos**
- Dashboard de analytics en tiempo real
- Reporte semanal de actividad
- Ranking de autos más populares
- Análisis de segmentos de clientes

---

## 🎯 **Resultado Esperado**

Con esta implementación tendrán:

1. **🎯 CRM Completo**: Gestión integral de clientes
2. **📊 Analytics Avanzado**: Tracking de comportamiento
3. **📧 Email Marketing**: Automatizaciones y campañas
4. **🔄 Automatización**: Seguimiento automático de leads
5. **📈 Métricas**: Datos para tomar decisiones

**¡MVP killer con diferenciación real en el mercado!** 🚀
