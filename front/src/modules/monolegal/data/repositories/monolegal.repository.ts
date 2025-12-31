import { AxiosHttpClient } from '@/config/protocols/http';
import { SyncResponse } from '../interfaces/monolegal.interface';

export class MonolegalRepository {
  private readonly baseUrl = '/monolegal';
  private readonly httpClient = new AxiosHttpClient();

  async syncFromApi(): Promise<SyncResponse> {
    const response = await this.httpClient.request({
      method: 'post',
      url: `${this.baseUrl}/sync`,
    });

    return response.body;
  }

  async importFromExcel(file: File): Promise<SyncResponse> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await this.httpClient.request({
      method: 'post',
      url: `${this.baseUrl}/import`,
      body: formData,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.body;
  }
}