export type UiText = {
  id?: number;
  text: string;
  type?: string;
  context?: Record<string, unknown>;
};

export type UiNodeAttributes = {
  name?: string;
  type?: string;
  value?: string | number | boolean;
  disabled?: boolean;
  required?: boolean;
  autocomplete?: string;
  placeholder?: string;
  pattern?: string;
  node_type?: string;
  label?: UiText;
  [key: string]: unknown;
};

export type UiNode = {
  id?: string;
  type: 'input' | 'text' | 'img' | 'button' | 'a';
  group?: string;
  attributes: UiNodeAttributes;
  meta?: {
    label?: UiText;
  };
  messages?: UiText[];
};

export type FlowUi = {
  action: string;
  method: string;
  nodes: UiNode[];
  messages?: UiText[];
};

export type KratosFlow = {
  id: string;
  type: string;
  state?: string;
  ui: FlowUi;
  issued_at?: string;
  expires_at?: string;
  request_url?: string;
};

export type BrowserFlowParams = {
  returnTo?: string;
  aal?: string;
  refresh?: boolean;
};

export type LogoutFlowResponse = {
  logout_token?: string;
  logout_url?: string;
  logout_redirect_url?: string;
};

export type SessionPayload = {
  identity: {
    id: string;
    traits: Record<string, unknown>;
  };
  session: Record<string, unknown>;
};


