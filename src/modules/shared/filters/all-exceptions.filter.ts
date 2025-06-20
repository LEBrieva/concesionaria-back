import {
  type ArgumentsHost,
  Catch,
  type ExceptionFilter,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Response } from 'express';

/**
 * Filtro global de excepciones que maneja errores de diferentes ORMs
 * de manera agnóstica, sin depender de imports específicos de cada ORM.
 * 
 * Este enfoque es preferible porque:
 * - Es más extensible (fácil agregar nuevos ORMs)
 * - Menos acoplamiento (no depende de clases específicas)
 * - Más robusto (las propiedades son más estables que las clases)
 * - No requiere imports adicionales por cada ORM
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest();

    // Log inicial del error capturado
    this.logger.warn(`🚨 Excepción capturada en ${request.method} ${request.url}`, {
      errorType: exception.constructor.name,
      errorCode: exception.code || 'N/A',
      timestamp: new Date().toISOString(),
    });

    // Verificar si es un error de restricción única (cualquier ORM)
    const uniqueConstraintError = this.handleUniqueConstraintError(exception);
    if (uniqueConstraintError) {
      this.logger.log(`✅ Error de restricción única manejado correctamente: ${uniqueConstraintError.message}`);
      return response.status(HttpStatus.CONFLICT).json(uniqueConstraintError);
    }

    // Verificar si es un error de registro no encontrado (cualquier ORM)
    const notFoundError = this.handleNotFoundError(exception);
    if (notFoundError) {
      this.logger.log(`✅ Error de registro no encontrado manejado correctamente`);
      return response.status(HttpStatus.NOT_FOUND).json(notFoundError);
    }

    // Manejo para excepciones HTTP de NestJS
    const status = exception?.status || HttpStatus.INTERNAL_SERVER_ERROR;
    const message = exception?.response?.message || exception?.message || 'Error interno del servidor';

    // Log diferente según el tipo de error
    if (status >= 500) {
      this.logger.error(`❌ Error interno del servidor (${status})`, exception.stack);
    } else if (status >= 400) {
      this.logger.warn(`⚠️ Error del cliente (${status}): ${Array.isArray(message) ? message.join(', ') : message}`);
    } else {
      this.logger.log(`ℹ️ Respuesta de error (${status}): ${Array.isArray(message) ? message.join(', ') : message}`);
    }

    return response.status(status).json({
      statusCode: status,
      message: Array.isArray(message) ? message : [message],
      error: exception?.response?.error || 'Internal Server Error',
    });
  }

  /**
   * Maneja errores de restricción única de diferentes ORMs
   * Detecta por propiedades del error en lugar de instanceof para mayor flexibilidad
   */
  private handleUniqueConstraintError(exception: any): any | null {
    // Prisma - Violación de restricción única
    if (exception.code === 'P2002') {
      const fields = exception.meta?.target as string[];
      this.logger.debug(`🔍 Error de Prisma P2002 detectado - Campos afectados: ${fields?.join(', ') || 'N/A'}`);
      return this.buildUniqueConstraintResponse(fields);
    }

    // TypeORM - Violación de restricción única (PostgreSQL)
    if (exception.code === '23505' || exception.driverError?.code === '23505') {
      // TypeORM puede tener diferentes estructuras dependiendo de la versión
      const constraint = exception.constraint || exception.driverError?.constraint;
      const fields = this.extractFieldsFromTypeORMConstraint(constraint);
      this.logger.debug(`🔍 Error de TypeORM 23505 detectado - Restricción: ${constraint}, Campos: ${fields?.join(', ') || 'N/A'}`);
      return this.buildUniqueConstraintResponse(fields);
    }

    // MongoDB/Mongoose - Duplicated key error
    if (exception.code === 11000) {
      const fields = Object.keys(exception.keyPattern || {});
      this.logger.debug(`🔍 Error de MongoDB 11000 detectado - Campos duplicados: ${fields.join(', ')}`);
      return this.buildUniqueConstraintResponse(fields);
    }

    return null;
  }

  /**
   * Maneja errores de registro no encontrado de diferentes ORMs
   */
  private handleNotFoundError(exception: any): any | null {
    // Prisma - Registro no encontrado
    if (exception.code === 'P2025') {
      this.logger.debug(`🔍 Error de Prisma P2025 detectado - Registro no encontrado`);
      return {
        statusCode: HttpStatus.NOT_FOUND,
        message: 'El registro solicitado no fue encontrado.',
        error: 'Not Found',
      };
    }

    // TypeORM - EntityNotFound
    if (exception.name === 'EntityNotFoundError') {
      this.logger.debug(`🔍 Error de TypeORM EntityNotFoundError detectado`);
      return {
        statusCode: HttpStatus.NOT_FOUND,
        message: 'El registro solicitado no fue encontrado.',
        error: 'Not Found',
      };
    }

    // Mongoose - Document not found
    if (exception.name === 'DocumentNotFoundError') {
      this.logger.debug(`🔍 Error de Mongoose DocumentNotFoundError detectado`);
      return {
        statusCode: HttpStatus.NOT_FOUND,
        message: 'El registro solicitado no fue encontrado.',
        error: 'Not Found',
      };
    }

    return null;
  }

  /**
   * Construye la respuesta para errores de restricción única
   * con mensajes específicos según el campo afectado
   */
  private buildUniqueConstraintResponse(fields: string[] | null): any {
    let message = 'Ya existe un registro con estos datos únicos.';
    
    // Mensajes específicos por campo
    if (fields && fields.length > 0) {
      if (fields.includes('matricula')) {
        message = 'La matrícula ya existe en el sistema.';
      } else if (fields.includes('email')) {
        message = 'El email ya está registrado en el sistema.';
      } else if (fields.includes('dni') || fields.includes('documento')) {
        message = 'El documento ya está registrado en el sistema.';
      } else if (fields.includes('username') || fields.includes('usuario')) {
        message = 'El nombre de usuario ya está en uso.';
      }
      // Fácil agregar más campos específicos aquí
      
      this.logger.debug(`💡 Mensaje personalizado generado para campo(s): ${fields.join(', ')} -> "${message}"`);
    } else {
      this.logger.debug(`💡 Usando mensaje genérico para restricción única`);
    }
    
    return {
      statusCode: HttpStatus.CONFLICT,
      message,
      error: 'Conflict',
    };
  }

  /**
   * Extrae los nombres de campos de las restricciones de TypeORM
   * Ejemplo: "UQ_user_email" -> ["email"]
   */
  private extractFieldsFromTypeORMConstraint(constraint: string): string[] | null {
    if (!constraint) return null;
    
    // Patrón común: UQ_tabla_campo
    const parts = constraint.split('_');
    if (parts.length >= 3 && parts[0] === 'UQ') {
      return [parts[parts.length - 1]]; // Último elemento después de UQ_tabla_
    }
    
    return null;
  }
} 