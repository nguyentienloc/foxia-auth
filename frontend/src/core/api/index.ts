import axios, { AxiosRequestConfig, Method } from 'axios';

class Api {
  private _axios = axios.create({
    withCredentials: true,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
  });
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;

    this._axios.interceptors.response.use(
      (response) => response,
      (error) => {
        this.handleError(error);
        return Promise.reject(error);
      },
    );
  }

  async getBaseURL() {
    return this.baseURL;
  }

  setBaseURL(baseURL: string) {
    this.baseURL = baseURL;
  }

  GET = async <T = any>(
    path: string,
    params?: Record<string, any>,
    config?: AxiosRequestConfig,
  ): Promise<T> => {
    return await this.request<T>('GET', path, undefined, params, undefined, config);
  };

  POST = async <T = any>(
    path: string,
    data?: object,
    config?: AxiosRequestConfig,
  ): Promise<T> => {
    return await this.request<T>('POST', path, undefined, undefined, data, config);
  };

  paramsPOST = async <T = any>(
    path: string,
    params?: Record<string, any>,
    data?: object,
    config?: AxiosRequestConfig,
  ): Promise<T> => {
    return await this.request<T>('POST', path, undefined, params, data, config);
  };

  PUT = async (path: string, data?: object, config?: AxiosRequestConfig) => {
    return await this.request('PUT', path, undefined, undefined, data, config);
  };

  DELETE = async (path: string, config?: AxiosRequestConfig) => {
    return await this.request('DELETE', path, undefined, undefined, undefined, config);
  };

  private request = async <T = any>(
    method: Method,
    path: string,
    requestHeaders?: Record<string, string>,
    requestParams?: Record<string, any>,
    data?: any,
    config?: AxiosRequestConfig,
  ): Promise<T> => {
    const headers: Record<string, string> = {
      ...requestHeaders,
      ...(config?.headers as Record<string, string> | undefined),
    };

    if (data && !(data instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { headers: _, ...restConfig } = config || {};

    const axiosConfig: AxiosRequestConfig = {
      url: path,
      method,
      baseURL: this.baseURL,
      headers,
      params: requestParams,
      data: data instanceof FormData ? data : JSON.stringify(data),
      ...restConfig,
    };

    try {
      const response = await this._axios(axiosConfig);
      return response.data as T;
    } catch (error: any) {
      this.handleError(error);
      throw error;
    }
  };

  handleError = (error: any) => {
    if (!axios.isCancel(error)) {
      console.error('Axios error', error);
    }
  };
}

export default Api;

