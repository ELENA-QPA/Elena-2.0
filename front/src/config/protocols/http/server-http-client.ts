import axios, { AxiosInstance, AxiosResponse } from 'axios'
import { HttpClient, HttpRequest, HttpResponse, UploadFileParams } from './http_utilities'
import "reflect-metadata";
import { injectable } from 'inversify';

@injectable()
export class ServerHttpClient implements HttpClient {
  axiosInstance: AxiosInstance;
  
  constructor() {
    this.axiosInstance = axios.create({
      baseURL: process.env.NEXT_PUBLIC_API_URL,
      headers: {
        'Content-Type': 'application/json',
        'Accept': '*/*',
      },
    });
  }

  async request(data: HttpRequest): Promise<HttpResponse> {
    let axiosResponse: AxiosResponse;
    const { baseUrl, url, method, body, headers, token, params, isAuth = true } = data;

    console.log("[SERVER_HTTP_CLIENT][Request]:", {
      url,
      method,
      isAuth,
      hasToken: !!token
    });

    const authHeader = isAuth && token ? {
      'Authorization': `Bearer ${token}`
    } : {};

    try {
      axiosResponse = await this.axiosInstance.request({
        baseURL: baseUrl,
        url: url,
        method: method,
        data: body,
        headers: {
          ...headers,
          ...authHeader,
        },
        params: params,
      })
    } catch (error: any) {
      console.log("[SERVER_HTTP_CLIENT][Request Error]:", {
        url,
        method,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data
      });
      axiosResponse = error.response
    }
    
    console.log("[SERVER_HTTP_CLIENT][Response]:", {
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

    console.log("[SERVER_HTTP_CLIENT][Upload Request]:", {
      url: data.url,
      method: data.method,
      hasToken: !!data.token
    });

    try {
      axiosResponse = await this.axiosInstance.request({
        baseURL: data.baseUrl,
        url: data.url,
        method: data.method,
        headers: {
          ...data.headers,
          'Content-Type': 'multipart/form-data',
          ...(data.token ? { 'Authorization': `Bearer ${data.token}` } : {}),
        },
        params: data.params,
        data: data.formData,
        onUploadProgress,
      });

    } catch (error: any) {
      console.log("[SERVER_HTTP_CLIENT][Upload Error]:", {
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
    console.log("[SERVER_HTTP_CLIENT][Update File]:", {
      url: params.url,
      hasToken: !!params.token
    });

    const axiosResponse = await this.axiosInstance.put(`${process.env.NEXT_PUBLIC_API_URL}/${params.url}`,
      params.formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
          ...(params.token ? { 'Authorization': `Bearer ${params.token}` } : {}),
        },
      })
    return {
      statusCode: axiosResponse.status,
      body: axiosResponse.data,
    }
  }
} 