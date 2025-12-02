export function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export const getRmqHost = () => {
  if (process.env.RMQ_LOCAL == '1') {
    return process.env.RMQ_HOST_LOCAL;
  }
  return process.env.RMQ_URI;
};
