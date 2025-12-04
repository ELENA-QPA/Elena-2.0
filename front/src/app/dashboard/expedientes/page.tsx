import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { CasoRepositoryImpl } from '@/modules/informacion-caso/data/repositories/caso.repository';
import { ServerHttpClient } from '@/config/protocols/http/server-http-client';
import { Caso } from '@/modules/informacion-caso/data/interfaces/caso.interface';
import ExpedientesView from '@/views/ExpedientesView/ExpedientesView';

// Función para obtener expedientes del servidor
async function getExpedientes() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    const user = cookieStore.get('user')?.value;

    console.log('[SERVER][Expedientes][Auth Check]:', {
      hasToken: !!token,
      hasUser: !!user,
      tokenPreview: token ? `${token.substring(0, 20)}...` : 'null'
    });

    // Verificar autenticación
    if (!token || !user) {
      console.log('[SERVER][Expedientes][No Auth]: Redirigiendo a login');
      redirect('/auth/login');
    }

    // Crear instancia del repositorio para el servidor
    const httpClient = new ServerHttpClient();
    const casoRepository = new CasoRepositoryImpl(httpClient);

    console.log('[SERVER][Expedientes][Loading]: Iniciando carga de expedientes');
    
    // Obtener primer lote de expedientes (20 registros)
    const response = await casoRepository.getAllCasos(20, 0, token);
    
    console.log('[SERVER][Expedientes][Response]:', {
      hasRecords: 'records' in response,
      recordCount: 'records' in response ? response.records.length : 0,
      statusCode: 'statusCode' in response ? response.statusCode : 'N/A',
      message: 'message' in response ? response.message : 'No message'
    });

    if ('records' in response) {
      console.log('[SERVER][Expedientes][Success]: Expedientes cargados exitosamente');
      return {
        casos: response.records,
        total: response.total || 0,
        error: null
      };
    } else {
      console.error('[SERVER][Expedientes][Error]:', response);
      return {
        casos: [],
        total: 0,
        error: Array.isArray(response.message) ? response.message.join(", ") : response.message
      };
    }
  } catch (error: any) {
    console.error('[SERVER][Expedientes][Catch Error]:', error);
    return {
      casos: [],
      total: 0,
      error: error.message || 'Error inesperado al cargar expedientes'
    };
  }
}

export default async function ExpedientesPage() {
  const { casos, total, error } = await getExpedientes();

  return (
    <ExpedientesView 
      initialCasos={casos} 
      initialTotal={total}
      initialError={error}
    />
  );
}
