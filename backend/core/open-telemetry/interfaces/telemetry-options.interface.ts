export interface TelemetryOptions {
  serviceName: string;
  version?: string;
  environment?: string;
  tags?: Record<string, string>;
  samplingRate?: number;
  exporterOptions?: {
    endpoint?: string;
    headers?: Record<string, string>;
  };
}
