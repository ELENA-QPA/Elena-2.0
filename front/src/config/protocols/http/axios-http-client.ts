import { CookiesKeysEnum } from '@/utilities/enums';
import axios, { AxiosInstance, AxiosResponse } from 'axios'
import { HttpClient, HttpRequest, HttpResponse, UploadFileParams } from './http_utilities'
import { getCookie, deleteCookie } from 'cookies-next';
import "reflect-metadata";
import { injectable } from 'inversify';

@injectable()
export class AxiosHttpClient implements HttpClient {
  axiosInstance: AxiosInstance;
  constructor(
  ) {
    this.axiosInstance = axios.create({
      baseURL: process.env.NEXT_PUBLIC_API_URL,
      // baseURL:'https://a0ea-79-141-166-136.ngrok-free.app/api',
      timeout: 30000, // 30 segundos timeout
      headers: {
        'Accept': '*/*',
        'X-Skip-Auth-Redirect': 'true'
      }
    });

    // Agregar interceptor para manejar errores de autenticación
    this.axiosInstance.interceptors.response.use(
      (response) => response,
      (error) => {
        console.log('[HTTP_CLIENT][Interceptor] Error response:', {
          status: error.response?.status,
          url: error.config?.url,
          method: error.config?.method
        });
        
        const skipRedirect = error.config?.headers?.['X-Skip-Auth-Redirect'] === 'true';

        if (skipRedirect) {
            console.log('[HTTP_CLIENT][Interceptor] Ignorando redirect por flag skipAuthRedirect');
            return Promise.reject(error);
          }

        // Si es error 401 o 403 (token expirado/inválido), limpiar sesión
        if (error.response?.status === 401 || error.response?.status === 403) {
          console.log('[HTTP_CLIENT][Interceptor] Token inválido o expirado, limpiando sesión...');
          
          // Limpiar cookies de autenticación
          deleteCookie(CookiesKeysEnum.token);
          deleteCookie(CookiesKeysEnum.user);
          deleteCookie(CookiesKeysEnum.role);
          
          // Limpiar localStorage
          if (typeof window !== 'undefined') {
            localStorage.removeItem('user');
            localStorage.removeItem('token');
            console.log('[HTTP_CLIENT][Interceptor] Sesión limpiada');
            
            // Redirigir al login solo si no estamos ya en una ruta de auth
            const currentPath = window.location.pathname;
            if (!currentPath.startsWith('/auth/') && !currentPath.startsWith('/login')) {
              console.log('[HTTP_CLIENT][Interceptor] Redirigiendo a login...');
              window.location.href = '/login';
            }
          }
        }

        return Promise.reject(error);
      }
    );
  }

  async request(data: HttpRequest): Promise<HttpResponse> {
    let axiosResponse: AxiosResponse;
    const { baseUrl, url, method, body, headers, token, params, isAuth = true, isMultipart = false} = data;

    // Debug logs para autenticación
    const cookieToken = getCookie(CookiesKeysEnum.token);
    const finalToken = token ? token : cookieToken;
    
    console.log("[HTTP_CLIENT][Auth Debug]:", {
      isAuth,
      hasToken: !!token,
      hasCookieToken: !!cookieToken,
      finalToken: finalToken ? `${finalToken.substring(0, 20)}...` : 'null',
      url,
      method,
      isMultipart,
    });

    const authHeader = {
      'Authorization': `Bearer ${finalToken}`
    }

    // Configurar headers según el tipo de contenido
    const contentTypeHeaders = isMultipart 
      ? {} // Para FormData, axios maneja automáticamente el Content-Type
      : { 'Content-Type': 'application/json' };

    try {
      axiosResponse = await this.axiosInstance.request({
        baseURL: baseUrl,
        url: url,
        method: method,
        data: body,
        headers: {
          ...contentTypeHeaders,
          ...headers,
          ...(isAuth ? authHeader : {}),
        },
        params: params,
      })
    } catch (error: any) {
      console.log("[HTTP_CLIENT][Request Error]:", {
        url,
        method,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data
      });
      
      // Si es un error de red (sin respuesta), intentar reintento
      if (!error.response && error.code === 'NETWORK_ERROR') {
        console.log("[HTTP_CLIENT][Network Error]: Attempting retry...");
        // Aquí podrías implementar lógica de reintento si es necesario
      }
      
      axiosResponse = error.response
    }
    
    // Verificar que axiosResponse existe antes de acceder a sus propiedades
    if (!axiosResponse) {
      console.log("[HTTP_CLIENT][Response Error]: No response received");
      return {
        statusCode: 500,
        body: { 
          statusCode: 500, 
          message: "No response received from server",
          error: "Network Error" 
        }
      }
    }
    
    console.log("[HTTP_CLIENT][Response]:", {
      url,
      method,
      statusCode: axiosResponse.status,
      statusText: axiosResponse.statusText,
      hasData: !!axiosResponse.data
    });

    return {
      statusCode: axiosResponse.status,
      body: axiosResponse.data
    }

  }

  async uploadFile(data: HttpRequest, onUploadProgress?: (progressEvent: any) => void): Promise<HttpResponse> {
    let axiosResponse: AxiosResponse;

    const cookieToken = getCookie(CookiesKeysEnum.token);
    const finalToken = data.token ? data.token : cookieToken;
    
    console.log("[HTTP_CLIENT][Upload Auth Debug]:", {
      hasToken: !!data.token,
      hasCookieToken: !!cookieToken,
      finalToken: finalToken ? `${finalToken.substring(0, 20)}...` : 'null',
      url: data.url,
      method: data.method
    });

    try {
      axiosResponse = await this.axiosInstance.request({
        baseURL: data.baseUrl,
        url: data.url,
        method: data.method,
        headers: {
          ...data.headers,
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${finalToken}`,
        },
        params: data.params,
        data: data.formData,
        onUploadProgress,
      });

    } catch (error: any) {
      console.log("[HTTP_CLIENT][Upload Error]:", {
        url: data.url,
        method: data.method,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data
      });
      axiosResponse = error.response;
    }

    return {
      statusCode: axiosResponse.status,
      body: axiosResponse.data
    };
  }

  async updateFile(params: UploadFileParams): Promise<HttpResponse> {
    const cookieToken = getCookie(CookiesKeysEnum.token);
    const finalToken = params.token ? params.token : cookieToken;
    
    console.log("[HTTP_CLIENT][Update File Auth Debug]:", {
      hasToken: !!params.token,
      hasCookieToken: !!cookieToken,
      finalToken: finalToken ? `${finalToken.substring(0, 20)}...` : 'null',
      url: params.url
    });

    const axiosResponse = await this.axiosInstance.put(`${process.env.NEXT_PUBLIC_API_URL}/${params.url}`,
      params.formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${finalToken}`,
        }
      })
    return {
      statusCode: axiosResponse.status,
      body: axiosResponse.data,
    }
  }

}