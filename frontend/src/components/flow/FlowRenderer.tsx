import { FormEvent, useEffect, useMemo, useState } from "react";
import { FlowMessages } from "./FlowMessages";
import { KratosFlow, UiNode } from "../../types/kratos";

type Props = {
  flow: KratosFlow;
  onSubmit: (payload: Record<string, string | boolean>) => void | Promise<void>;
  showPasswordStrength?: boolean;
};

type FormState = Record<string, string | boolean>;

export function FlowRenderer({ flow, onSubmit, showPasswordStrength }: Props) {
  // Store flow ID for OIDC submission
  const flowId = flow.id;
  const defaultValues = useMemo(() => buildDefaultState(flow.ui.nodes), [flow]);
  const [formState, setFormState] = useState<FormState>(defaultValues);
  const [passwordVisibility, setPasswordVisibility] = useState<
    Record<string, boolean>
  >({});

  useEffect(() => {
    setFormState(defaultValues);
  }, [defaultValues]);

  const handleChange = (name: string, value: string | boolean) => {
    setFormState((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    // Find which submit button was clicked (if any)
    const submitter = (event.nativeEvent as SubmitEvent)
      .submitter as HTMLButtonElement | null;
    const clickedButtonValue = submitter?.value;
    const clickedButtonName = submitter?.name;

    // Filter formState to only include the clicked submit button
    // Remove all submit button values except the one that was clicked
    const filteredState: FormState = { ...formState };

    // Get all submit buttons from the flow
    const submitButtons = flow.ui.nodes.filter(
      (node) => node.attributes.type === "submit" && node.attributes.name
    );

    // Remove all submit button values
    submitButtons.forEach((node) => {
      if (node.attributes.name) {
        delete filteredState[node.attributes.name];
      }
    });

    // Add back only the clicked button, or the first submit button if submitted via Enter
    if (clickedButtonName && clickedButtonValue !== undefined) {
      filteredState[clickedButtonName] = clickedButtonValue;
    } else if (submitButtons.length > 0 && submitButtons[0].attributes.name) {
      // If no button was clicked (e.g., Enter key), use the first submit button
      const firstButton = submitButtons[0];
      if (firstButton.attributes.name) {
        filteredState[firstButton.attributes.name] = String(
          firstButton.attributes.value ?? ""
        );
      }
    }

    onSubmit(filteredState);
  };

  const togglePasswordVisibility = (field: string) => {
    setPasswordVisibility((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  // Separate OIDC nodes from form nodes
  // OIDC nodes can have: group === "oidc", type === "a" with href, or type === "button" with group "oidc"
  const oidcNodes = flow.ui.nodes.filter((node) => {
    const isOidc =
      node.group === "oidc" ||
      (node.type === "a" && node.attributes.href) ||
      (node.type === "button" && node.group === "oidc") ||
      (node.attributes.name && node.attributes.name.startsWith("provider_"));

    // Debug logging (only in development)
    if (isOidc) {
      console.log("OIDC node detected:", {
        id: node.id,
        type: node.type,
        group: node.group,
        name: node.attributes.name,
        href: node.attributes.href,
        attributes: node.attributes,
      });
    }

    return isOidc;
  });

  // Debug: log all nodes to see structure if no OIDC nodes found
  if (oidcNodes.length === 0) {
    console.log(
      "No OIDC nodes found. All nodes:",
      flow.ui.nodes.map((node) => ({
        id: node.id,
        type: node.type,
        group: node.group,
        name: node.attributes.name,
        href: node.attributes.href,
      }))
    );
  }

  const formNodes = flow.ui.nodes.filter((node) => !oidcNodes.includes(node));

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={handleSubmit}
      action={flow.ui.action}
      method={flow.ui.method}
    >
      <FlowMessages messages={flow.ui.messages} />

      {/* Render OIDC providers in a grid if they exist */}
      {oidcNodes.length > 0 && (
        <>
          <div className="grid grid-cols-2 gap-4">
            {oidcNodes.map((node, index) => {
              const nodeKey =
                node.id ??
                node.attributes.name ??
                (node.attributes.id as string | undefined) ??
                `oidc-${index}`;
              return (
                <FlowNode
                  key={nodeKey}
                  node={node}
                  value={formState[node.attributes.name ?? ""] ?? ""}
                  onChange={handleChange}
                  isPasswordVisible={false}
                  onTogglePassword={() => {}}
                  showPasswordStrength={false}
                  flowId={flowId}
                />
              );
            })}
          </div>

          {/* Divider if there are form fields */}
          {formNodes.length > 0 && (
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200" />
              </div>
              <div className="relative flex justify-center text-xs uppercase tracking-wide">
                <span className="px-3 bg-white text-slate-400">
                  or continue with email
                </span>
              </div>
            </div>
          )}
        </>
      )}

      {/* Render form nodes */}
      {formNodes.map((node) => (
        <FlowNode
          key={node.id ?? node.attributes.name}
          node={node}
          value={formState[node.attributes.name ?? ""] ?? ""}
          onChange={handleChange}
          isPasswordVisible={
            node.attributes.name
              ? Boolean(passwordVisibility[node.attributes.name])
              : false
          }
          onTogglePassword={togglePasswordVisibility}
          showPasswordStrength={showPasswordStrength ?? false}
          flowId={flowId}
        />
      ))}
    </form>
  );
}

type FlowNodeProps = {
  node: UiNode;
  value: string | boolean;
  onChange: (name: string, value: string | boolean) => void;
  isPasswordVisible: boolean;
  onTogglePassword: (field: string) => void;
  showPasswordStrength: boolean;
  flowId: string;
};

function FlowNode({
  node,
  value,
  onChange,
  isPasswordVisible,
  onTogglePassword,
  showPasswordStrength,
  flowId,
}: FlowNodeProps) {
  // Handle OIDC provider buttons/links (check before name check since OIDC nodes might not have name)
  // OIDC nodes can be: type "a" with href, type "button" with group "oidc", or any node with group "oidc"
  const isOidcNode =
    node.group === "oidc" ||
    (node.type === "a" && node.attributes.href) ||
    (node.type === "button" && node.group === "oidc") ||
    (node.attributes.name && node.attributes.name.startsWith("provider_"));

  if (isOidcNode) {
    // Try to get href from various sources
    // For input type nodes, the URL might be in value or we need to construct it
    const href =
      (node.attributes.href as string | undefined) ||
      (node.attributes.value as string | undefined)?.match(
        /https?:\/\/[^\s"']+/
      )?.[0] ||
      (typeof node.attributes.onclick === "string"
        ? node.attributes.onclick.match(/href=["']([^"']+)["']/)?.[1] ||
          node.attributes.onclick.match(/(https?:\/\/[^\s"']+)/)?.[1]
        : undefined);

    const providerId = (() => {
      if (node.attributes.name && typeof node.attributes.name === "string") {
        const name = node.attributes.name
          .replace("provider_", "")
          .replace("provider", "");
        if (name) return name;
      }
      if (node.attributes.id && typeof node.attributes.id === "string") {
        const id = node.attributes.id
          .replace("provider_", "")
          .replace("provider", "");
        if (id) return id;
      }
      if (node.attributes.value && typeof node.attributes.value === "string") {
        // If value is a URL, try to extract provider from it
        const urlMatch = node.attributes.value.match(/provider[=:]([^&\s]+)/i);
        if (urlMatch) return urlMatch[1];
        // Otherwise try to extract from the value itself
        const value = node.attributes.value
          .replace("provider_", "")
          .replace("provider", "");
        if (value && !value.startsWith("http")) return value;
      }
      // Default to "google" if name is "provider" (common case)
      if (node.attributes.name === "provider") {
        return "google";
      }
      return "";
    })();

    const label =
      node.meta?.label?.text ??
      node.attributes.label?.text ??
      (providerId
        ? providerId.charAt(0).toUpperCase() + providerId.slice(1)
        : "Social Login");

    // Get provider icon
    const getProviderIcon = (provider: string) => {
      const normalizedProvider = provider.toLowerCase();
      if (normalizedProvider.includes("google")) {
        return "https://www.svgrepo.com/show/475656/google-color.svg";
      }
      if (normalizedProvider.includes("microsoft")) {
        return "https://www.svgrepo.com/show/448234/microsoft.svg";
      }
      if (normalizedProvider.includes("github")) {
        return "https://www.svgrepo.com/show/512317/github-142.svg";
      }
      return null;
    };

    const iconUrl = getProviderIcon(providerId);

    const handleOidcClick = (e: React.MouseEvent) => {
      e.preventDefault();

      // If we have a direct href URL, redirect immediately
      if (href) {
        console.log("Redirecting to OIDC provider:", href);
        window.location.href = href;
        return;
      }

      // For input type nodes with name "provider" and type "submit", submit form DIRECTLY to Kratos
      // This is REQUIRED because:
      // 1. Kratos only sets cookies when request comes directly from browser (not via backend proxy)
      // 2. Cookie must be set with Kratos domain (auth.foxia.vn) so it's sent when Google redirects back
      // 3. CSRF token from current flow is valid for Kratos endpoint
      if (
        node.type === "input" &&
        node.attributes.name === "provider" &&
        node.attributes.type === "submit"
      ) {
        const form = e.currentTarget.closest("form");
        if (form) {
          const csrfInput = form.querySelector(
            'input[name="csrf_token"]'
          ) as HTMLInputElement;
          const providerValue =
            (node.attributes.value as string | undefined) || providerId;

          if (providerValue && csrfInput?.value && flowId) {
            // Determine Kratos public URL from form action / flow action
            const flowAction = (form as HTMLFormElement).action;
            let kratosEndpoint: string;

            const isDev =
              (import.meta as any).env?.DEV ||
              (import.meta as any).env?.MODE === "development";

            if (flowAction) {
              if (isDev && flowAction.includes("auth.foxia.vn")) {
                kratosEndpoint = flowAction.replace(
                  /https?:\/\/[^/]+/,
                  "/kratos"
                );
              } else if (
                isDev &&
                !flowAction.includes("auth.foxia.vn") &&
                !flowAction.startsWith("/kratos")
              ) {
                const pathMatch = flowAction.match(
                  /\/(auth|self-service)\/([^?]+)(\?.*)?$/
                );
                if (pathMatch) {
                  const path = pathMatch[2];
                  const query = pathMatch[3] || "";
                  kratosEndpoint = `/kratos/self-service/${path}${query}`;
                } else {
                  kratosEndpoint = `/kratos${flowAction.replace(
                    /^https?:\/\/[^/]+/,
                    ""
                  )}`;
                }
              } else {
                kratosEndpoint = flowAction;
              }
            } else {
              if (isDev) {
                kratosEndpoint = `/kratos/self-service/login?flow=${flowId}`;
              } else {
                const kratosPublicUrl =
                  (import.meta as any).env?.VITE_KRATOS_PUBLIC_URL ??
                  "https://auth.foxia.vn";
                kratosEndpoint = `${kratosPublicUrl}/self-service/login?flow=${flowId}`;
              }
            }

            console.log("Submitting OIDC form to Kratos:", {
              originalFlowAction: flowAction,
              kratosEndpoint,
              flowId,
              providerValue,
              isDev,
            });

            // Use form submit instead of fetch to let browser handle redirect automatically
            // This works better with Vite proxy and avoids CORS issues
            const tempForm = document.createElement("form");
            tempForm.method = "POST";
            tempForm.action = kratosEndpoint;
            tempForm.style.display = "none";

            // Add provider field
            const providerInput = document.createElement("input");
            providerInput.type = "hidden";
            providerInput.name = "provider";
            providerInput.value = providerValue;
            tempForm.appendChild(providerInput);

            // Add CSRF token
            const csrfInputClone = document.createElement("input");
            csrfInputClone.type = "hidden";
            csrfInputClone.name = "csrf_token";
            csrfInputClone.value = csrfInput.value;
            tempForm.appendChild(csrfInputClone);

            // Append to body and submit
            document.body.appendChild(tempForm);
            console.log("Submitting form to:", kratosEndpoint);
            tempForm.submit();
            return;
          }
        }
      }

      console.warn("OIDC node clicked but unable to handle", {
        node,
        href,
        providerId,
        attributes: node.attributes,
      });
    };

    return (
      <button
        type="button"
        onClick={handleOidcClick}
        className="flex items-center justify-center gap-2 px-4 py-2.5 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors w-full"
      >
        {iconUrl && <img src={iconUrl} className="w-5 h-5" alt={providerId} />}
        <span className="text-sm font-medium text-slate-700">{label}</span>
      </button>
    );
  }

  const name = node.attributes.name;

  if (!name) {
    return null;
  }

  if (node.type === "text") {
    return (
      <p className="text-sm text-slate-500">
        {node.attributes.label?.text ?? node.attributes.value ?? ""}
      </p>
    );
  }

  if (node.attributes.type === "hidden") {
    return (
      <input
        type="hidden"
        name={name}
        value={String(value ?? node.attributes.value ?? "")}
      />
    );
  }

  if (node.attributes.type === "button") {
    return null;
  }

  // Handle submit buttons
  if (node.attributes.type === "submit") {
    const label =
      node.meta?.label?.text ??
      node.attributes.label?.text ??
      name?.replace(/_/g, " ");
    const isSecondary =
      node.attributes.name === "screen" || node.attributes.value === "previous";
    const buttonClass = isSecondary
      ? "w-full flex justify-center py-3.5 px-4 rounded-xl text-sm font-bold text-foxia-600 bg-white border border-foxia-100 hover:border-foxia-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-foxia-100 transition-all"
      : "w-full flex justify-center py-3.5 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white foxia-gradient hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-foxia-500 transition-all transform hover:-translate-y-0.5 shadow-foxia-500/30";

    return (
      <button
        type="submit"
        name={name}
        value={String(node.attributes.value ?? "")}
        className={buttonClass}
        formNoValidate={isSecondary}
      >
        {label}
      </button>
    );
  }

  const label =
    node.meta?.label?.text ??
    node.attributes.label?.text ??
    name?.replace(/_/g, " ");

  const inputType = node.attributes.type ?? "text";

  if (inputType === "password") {
    const strength = getPasswordStrength(String(value ?? ""));
    return (
      <div className="space-y-2">
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-slate-700">{label}</span>
          <div className="relative">
            <input
              name={name}
              type={isPasswordVisible ? "text" : "password"}
              value={String(value ?? "")}
              required={Boolean(node.attributes.required)}
              placeholder={(node.attributes.placeholder as string) ?? ""}
              onChange={(event) => onChange(name, event.target.value)}
              className="block w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-foxia-500 focus:ring-2 focus:ring-foxia-100 outline-none text-sm transition-all pr-12"
            />
            <button
              type="button"
              onClick={() => onTogglePassword(name)}
              className="absolute inset-y-0 right-3 flex items-center text-slate-400 hover:text-slate-600 text-sm font-semibold"
            >
              {isPasswordVisible ? "Hide" : "Show"}
            </button>
          </div>
        </label>
        {showPasswordStrength && (
          <>
            <div className="flex gap-2">
              {Array.from({ length: 4 }).map((_, index) => (
                <span
                  key={`${name}-strength-${index}`}
                  className={`h-1 flex-1 rounded-full ${
                    index < strength.score ? strength.barColor : "bg-slate-200"
                  }`}
                />
              ))}
            </div>
            <p className={`text-xs font-medium ${strength.textColor}`}>
              {strength.message}
            </p>
          </>
        )}
        <FlowMessages messages={node.messages} />
      </div>
    );
  }

  if (inputType === "checkbox") {
    const checked = !!value;
    return (
      <label className="flex items-center gap-2 text-sm text-slate-700">
        <input
          type="checkbox"
          name={name}
          checked={checked}
          onChange={(event) => onChange(name, event.target.checked)}
          className="h-4 w-4 rounded border-slate-300 text-foxia-600 focus:ring-foxia-500"
        />
        <span>{label}</span>
        <FlowMessages messages={node.messages} />
      </label>
    );
  }

  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="font-medium text-slate-700">{label}</span>
      <input
        name={name}
        type={inputType}
        value={String(value ?? "")}
        required={Boolean(node.attributes.required)}
        placeholder={(node.attributes.placeholder as string) ?? ""}
        onChange={(event) => onChange(name, event.target.value)}
        className="block w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-foxia-500 focus:ring-2 focus:ring-foxia-100 outline-none text-sm transition-all"
      />
      <FlowMessages messages={node.messages} />
    </label>
  );
}

function buildDefaultState(nodes: UiNode[]): FormState {
  return nodes.reduce<FormState>((acc, node) => {
    const name = node.attributes.name;
    if (!name) {
      return acc;
    }
    if (node.attributes.type === "checkbox") {
      const value = node.attributes.value;
      acc[name] = Boolean(value);
    } else if (node.attributes.type === "hidden") {
      acc[name] = String(node.attributes.value ?? "");
    } else {
      acc[name] = String(node.attributes.value ?? "");
    }
    return acc;
  }, {});
}

function getPasswordStrength(password: string) {
  let score = 0;
  if (password.length >= 8) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;

  if (!password) {
    return {
      score: 0,
      message: "Enter a password",
      barColor: "bg-slate-200",
      textColor: "text-slate-400",
    };
  }

  if (score <= 1) {
    return {
      score: 1,
      message: "Weak password",
      barColor: "bg-red-500",
      textColor: "text-red-600",
    };
  }

  if (score === 2) {
    return {
      score: 2,
      message: "Medium strength",
      barColor: "bg-yellow-400",
      textColor: "text-yellow-600",
    };
  }

  if (score === 3) {
    return {
      score: 3,
      message: "Strong password",
      barColor: "bg-green-500",
      textColor: "text-green-600",
    };
  }

  return {
    score: 4,
    message: "Excellent password!",
    barColor: "bg-emerald-500",
    textColor: "text-emerald-600",
  };
}
