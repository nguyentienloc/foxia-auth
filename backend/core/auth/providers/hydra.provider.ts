import { Provider } from '@nestjs/common';
import { Configuration, OAuth2Api, WellknownApi, OidcApi } from '@ory/hydra-client';

export const HYDRA_ADMIN_API = Symbol('HYDRA_ADMIN_API');
export const HYDRA_PUBLIC_API = Symbol('HYDRA_PUBLIC_API');
export const HYDRA_WELLKNOWN_API = Symbol('HYDRA_WELLKNOWN_API');
export const HYDRA_OIDC_API = Symbol('HYDRA_OIDC_API');

export const hydraProviders: Provider[] = [
  {
    provide: HYDRA_ADMIN_API,
    useFactory: () => {
      const basePath = process.env.HYDRA_ADMIN_URL;
      if (!basePath) {
        throw new Error('HYDRA_ADMIN_URL is not defined');
      }

      const timeout = Number(process.env.HYDRA_TIMEOUT_MS ?? 10000);
      const configuration = new Configuration({
        basePath,
        baseOptions: {
          timeout,
        },
      });

      // OAuth2Api được dùng cho cả admin và public operations
      // Phân biệt bằng basePath (admin URL vs public URL)
      return new OAuth2Api(configuration);
    },
  },
  {
    provide: HYDRA_PUBLIC_API,
    useFactory: () => {
      const basePath = process.env.HYDRA_PUBLIC_URL;
      if (!basePath) {
        throw new Error('HYDRA_PUBLIC_URL is not defined');
      }

      const timeout = Number(process.env.HYDRA_TIMEOUT_MS ?? 10000);
      const configuration = new Configuration({
        basePath,
        baseOptions: {
          timeout,
        },
      });

      // OAuth2Api cho public operations
      return new OAuth2Api(configuration);
    },
  },
  {
    provide: HYDRA_WELLKNOWN_API,
    useFactory: () => {
      const basePath = process.env.HYDRA_PUBLIC_URL;
      if (!basePath) {
        throw new Error('HYDRA_PUBLIC_URL is not defined');
      }

      const timeout = Number(process.env.HYDRA_TIMEOUT_MS ?? 10000);
      const configuration = new Configuration({
        basePath,
        baseOptions: {
          timeout,
        },
      });

      // WellknownApi cho discovery endpoints
      return new WellknownApi(configuration);
    },
  },
  {
    provide: HYDRA_OIDC_API,
    useFactory: () => {
      const basePath = process.env.HYDRA_PUBLIC_URL;
      if (!basePath) {
        throw new Error('HYDRA_PUBLIC_URL is not defined');
      }

      const timeout = Number(process.env.HYDRA_TIMEOUT_MS ?? 10000);
      const configuration = new Configuration({
        basePath,
        baseOptions: {
          timeout,
        },
      });

      // OidcApi cho OIDC operations
      return new OidcApi(configuration);
    },
  },
];

