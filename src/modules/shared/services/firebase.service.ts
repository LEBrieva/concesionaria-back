import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as admin from 'firebase-admin';

export interface FirebaseUserData {
  uid: string;
  email: string;
  name: string;
  picture?: string;
  emailVerified: boolean;
}

@Injectable()
export class FirebaseService implements OnModuleInit {
  private readonly logger = new Logger(FirebaseService.name);

  onModuleInit() {
    if (!admin.apps.length) {
      // Verificar si debemos usar Firebase Mock
      const useFirebaseMock = 
        process.env.NODE_ENV === 'test' || 
        process.env.USE_FIREBASE_MOCK === 'true' ||
        !process.env.FIREBASE_PROJECT_ID || 
        !process.env.FIREBASE_PRIVATE_KEY || 
        !process.env.FIREBASE_CLIENT_EMAIL;

      if (useFirebaseMock) {
        this.logger.warn('🧪 Firebase Admin SDK deshabilitado - usando modo mock/desarrollo');
        return;
      }

      // Inicializar Firebase Admin SDK solo si tenemos credenciales válidas
      const serviceAccount = {
        projectId: process.env.FIREBASE_PROJECT_ID,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      };

      // Validación adicional para asegurar que las credenciales son reales
      if (!serviceAccount.privateKey || !serviceAccount.privateKey.includes('BEGIN PRIVATE KEY')) {
        this.logger.warn('🧪 Firebase Private Key inválida - usando modo mock/desarrollo');
        return;
      }

      try {
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
        });

        this.logger.log('✅ Firebase Admin SDK inicializado correctamente');
      } catch (error) {
        this.logger.error('❌ Error inicializando Firebase Admin SDK:', error.message);
        this.logger.warn('🧪 Continuando en modo mock/desarrollo');
      }
    }
  }

  async verifyIdToken(idToken: string): Promise<FirebaseUserData> {
    try {
      // Si Firebase no está configurado, simular para desarrollo
      if (!admin.apps.length) {
        this.logger.warn('Firebase no configurado, usando datos simulados para desarrollo');
        
        // Simular diferentes usuarios según el token para testing
        if (idToken.includes('inactivo')) {
          return {
            uid: 'dev-user-inactivo',
            email: 'cliente.inactivo@gmail.com',
            name: 'Cliente Inactivo',
            picture: 'https://via.placeholder.com/150',
            emailVerified: true,
          };
        }
        
        return {
          uid: 'dev-user-' + Date.now(),
          email: 'cliente.dev@gmail.com',
          name: 'Cliente Desarrollo',
          picture: 'https://via.placeholder.com/150',
          emailVerified: true,
        };
      }

      const decodedToken = await admin.auth().verifyIdToken(idToken);
      
      return {
        uid: decodedToken.uid,
        email: decodedToken.email || '',
        name: decodedToken.name || decodedToken.email?.split('@')[0] || 'Usuario',
        picture: decodedToken.picture,
        emailVerified: decodedToken.email_verified || false,
      };
    } catch (error) {
      this.logger.error('Error verificando token de Firebase:', error);
      throw new Error('Token de Firebase inválido');
    }
  }
} 