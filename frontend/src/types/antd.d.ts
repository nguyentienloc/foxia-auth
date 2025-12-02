import type { ReactElement, ReactNode } from "react";

declare module "antd" {
  type MessageFn = (content: ReactNode | string) => void;

  type MessageApi = {
    success: MessageFn;
    error: MessageFn;
    info: MessageFn;
    warning: MessageFn;
  };

  export const message: {
    useMessage: () => [MessageApi, ReactElement];
  };
}


