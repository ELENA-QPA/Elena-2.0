
export type HttpRequest = {
  baseUrl?: string,
  url?: string,
  method: HttpMethod,
  formData?: FormData,
  body?: any,
  headers?: any,
  params?: any,
  token?: string,
  isAuth?: boolean,
  isMultipart?: boolean,
}

export type UploadFileParams = {
  baseUrl?: string,
  formData: FormData,
  method: HttpMethod,
  url?: string,
  token?: string,
}

// export interface HttpClient<R = any> {
//   request: (data: HttpRequest) => Promise<HttpResponse<R>>,
//   uploadFile: (params: UploadFileParams) => Promise<HttpResponse<R>>
// }

export abstract class HttpClient<R = any> {
  abstract request(data: HttpRequest): Promise<HttpResponse<R>>;
  abstract uploadFile(params: UploadFileParams): Promise<HttpResponse<R>>;
  // Opcional: podrías también incluir otros métodos abstractos o con implementación
}

export type HttpMethod = 'post' | 'get' | 'put' |'patch'| 'delete'

export enum HttpStatusCode {
  ok = 200,
  created = 201,
  noContent = 204,
  badRequest = 400,
  unauthorized = 401,
  forbidden = 403,
  notFound = 404,
  exists = 409,
  serverError = 500,
  invalidUser = 1,
  userExists = 2,
  limited = 417,
}

export type HttpResponse<T = any> = {
  statusCode: HttpStatusCode
  body?: T
}


export type FileResponse = {
  isOk: boolean,
  url: string,
}