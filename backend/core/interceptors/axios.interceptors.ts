import axios from 'axios';
import { AxiosCurlirize } from 'core/utils/AxiosCurlirize';

const callback = (curlResult?: Record<string, any>, err?: any) => {
  const { command } = curlResult;
  if (err) {
    console.error(err);
  } else {
    console.info(command);
  }
};

axios.interceptors.request.use(
  function (req: any) {
    req.metadata = { startTime: new Date().getTime() };
    try {
      const curl = new AxiosCurlirize(req);
      req.curlObject = curl;
      req.curlCommand = curl.generateCommand();
      req.clearCurl = () => {
        delete req.curlObject;
        delete req.curlCommand;
        delete req.clearCurl;
      };
    } catch (err) {
      callback(null, err);
    } finally {
      if (req.curlirize !== false) {
        callback({
          command: req.curlCommand,
          object: req.curlObject,
        });
      }
      return req;
    }
  },
  function (error) {
    return Promise.reject(error);
  },
);

axios.interceptors.response.use(
  (x: any) => {
    console.log(
      `Execution time for: ${x.config.url} - ${
        new Date().getTime() - x.config.metadata?.startTime
      } ms`,
    );
    return x;
  },
  // Handle 4xx & 5xx responses
  (x) => {
    console.log(
      `Execution error time for: ${x.config.url} - ${
        new Date().getTime() - x.config.metadata?.startTime
      } ms`,
    );
    throw x;
  },
);
