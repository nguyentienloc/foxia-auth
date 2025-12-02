import { FormEvent, useEffect, useMemo, useState } from "react";
import { FlowMessages } from "./FlowMessages";
import { KratosFlow, UiNode } from "../../types/kratos";

type Props = {
  flow: KratosFlow;
  onSubmit: (payload: Record<string, string | boolean>) => void;
  showPasswordStrength?: boolean;
};

type FormState = Record<string, string | boolean>;

export function FlowRenderer({ flow, onSubmit, showPasswordStrength }: Props) {
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

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={handleSubmit}
      action={flow.ui.action}
      method={flow.ui.method}
    >
      <FlowMessages messages={flow.ui.messages} />
      {flow.ui.nodes.map((node) => (
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
};

function FlowNode({
  node,
  value,
  onChange,
  isPasswordVisible,
  onTogglePassword,
  showPasswordStrength,
}: FlowNodeProps) {
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
