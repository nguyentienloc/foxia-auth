import { Provider } from '@nestjs/common';
import { Configuration, FrontendApi } from '@ory/kratos-client';

export const KRATOS_FRONTEND_API = Symbol('KRATOS_FRONTEND_API');

export const kratosProviders: Provider[] = [
  {
    provide: KRATOS_FRONTEND_API,
    useFactory: () => {
      const basePath = process.env.KRATOS_PUBLIC_URL;
      if (!basePath) {
        throw new Error('KRATOS_PUBLIC_URL is not defined');
      }

      const timeout = Number(process.env.KRATOS_TIMEOUT_MS ?? 10000);
      const configuration = new Configuration({
        basePath,
        baseOptions: {
          timeout,
          withCredentials: true,
        },
      });

      return new FrontendApi(configuration);
    },
  },
];

