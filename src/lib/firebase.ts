import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);

// You MUST use the firestoreDatabaseId from the firebase-applet-config.json file
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId); 
export const auth = getAuth();

/**
 * Standardized Error Throwing matching FirestoreErrorInfo format
 */
export interface FirestoreErrorInfo {
  error: string;
  operationType: 'create' | 'update' | 'delete' | 'list' | 'get' | 'write';
  path: string | null;
  authInfo: {
    userId: string;
    email: string;
    emailVerified: boolean;
    isAnonymous: boolean;
    providerInfo: { providerId: string; displayName: string; email: string; }[];
  }
}

export function handleFirestoreError(error: any, operationType: FirestoreErrorInfo['operationType'], path: string | null = null) {
  const currentUser = auth.currentUser;
  
  const authInfo = currentUser ? {
    userId: currentUser.uid,
    email: currentUser.email || '',
    emailVerified: currentUser.emailVerified,
    isAnonymous: currentUser.isAnonymous,
    providerInfo: currentUser.providerData.map(p => ({
      providerId: p.providerId,
      displayName: p.displayName || '',
      email: p.email || ''
    }))
  } : {
    userId: 'unauthenticated',
    email: '',
    emailVerified: false,
    isAnonymous: true,
    providerInfo: []
  };

  const errorInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    operationType,
    path,
    authInfo
  };
  
  if (errorInfo.error.includes('Missing or insufficient permissions')) {
    throw new Error(JSON.stringify(errorInfo));
  } else {
    throw error;
  }
}
