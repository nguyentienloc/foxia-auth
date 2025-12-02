import StringUtils from './StringUtils';

export function getCurl(request: any = {}): string {
  let header = '';
  Object.keys(request?.headers || {}).forEach((r) => (header += `--header '${r}: ${request.headers[String(r)]}' `));

  const body = `--data-raw '${StringUtils.getString(request?.body || request?.data)}'`;

  const curl = `curl --location -g --request ${request.method.toUpperCase()} '${request.baseURL}${request.url}' ${header} ${(request?.body || request?.data) ? body : ''}`;

  return curl.trim();
}
