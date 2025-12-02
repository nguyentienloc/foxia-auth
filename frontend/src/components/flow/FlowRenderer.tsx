import { FormEvent, useEffect, useMemo, useState } from 'react';
import { FlowMessages } from './FlowMessages';
import { KratosFlow, UiNode } from '../../types/kratos';

type Props = {
  flow: KratosFlow;
  onSubmit: (payload: Record<string, string | boolean>) => void;
};

type FormState = Record<string, string | boolean>;

export function FlowRenderer({ flow, onSubmit }: Props) {
  const defaultValues = useMemo(() => buildDefaultState(flow.ui.nodes), [flow]);
  const [formState, setFormState] = useState<FormState>(defaultValues);

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
      (node) => node.attributes.type === 'submit' && node.attributes.name,
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
        firstButton.attributes.value ?? '',
      );
    }

    onSubmit(filteredState);
  };

  return (
    <form
      className="flow-form"
      onSubmit={handleSubmit}
      action={flow.ui.action}
      method={flow.ui.method}
    >
      <FlowMessages messages={flow.ui.messages} />
      {flow.ui.nodes.map((node) => (
        <FlowNode
          key={node.id ?? node.attributes.name}
          node={node}
          value={formState[node.attributes.name ?? ''] ?? ''}
          onChange={handleChange}
        />
      ))}
    </form>
  );
}

type FlowNodeProps = {
  node: UiNode;
  value: string | boolean;
  onChange: (name: string, value: string | boolean) => void;
};

function FlowNode({ node, value, onChange }: FlowNodeProps) {
  const name = node.attributes.name;

  if (!name) {
    return null;
  }

  if (node.type === 'text') {
    return (
      <p className="flow-text">
        {node.attributes.label?.text ?? node.attributes.value ?? ''}
      </p>
    );
  }

  if (node.attributes.type === 'hidden') {
    return (
      <input
        type="hidden"
        name={name}
        value={String(value ?? node.attributes.value ?? '')}
      />
    );
  }

  if (node.attributes.type === 'button') {
    return null;
  }

  // Handle submit buttons
  if (node.attributes.type === 'submit') {
    const label =
      node.meta?.label?.text ??
      node.attributes.label?.text ??
      name?.replace(/_/g, ' ');

    return (
      <button
        type="submit"
        name={name}
        value={String(node.attributes.value ?? '')}
        className="flow-submit"
      >
        {label}
      </button>
    );
  }

  const label =
    node.meta?.label?.text ??
    node.attributes.label?.text ??
    name?.replace(/_/g, ' ');

  const inputType = node.attributes.type ?? 'text';

  if (inputType === 'checkbox') {
    const checked = !!value;
    return (
      <label className="flow-field flow-field--checkbox">
        <input
          type="checkbox"
          name={name}
          checked={checked}
          onChange={(event) => onChange(name, event.target.checked)}
        />
        <span>{label}</span>
        <FlowMessages messages={node.messages} />
      </label>
    );
  }

  return (
    <label className="flow-field">
      <span>{label}</span>
      <input
        name={name}
        type={inputType}
        value={String(value ?? '')}
        required={Boolean(node.attributes.required)}
        placeholder={(node.attributes.placeholder as string) ?? ''}
        onChange={(event) => onChange(name, event.target.value)}
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
    if (node.attributes.type === 'checkbox') {
      const value = node.attributes.value;
      acc[name] = Boolean(value);
    } else if (node.attributes.type === 'hidden') {
      acc[name] = String(node.attributes.value ?? '');
    } else {
      acc[name] = String(node.attributes.value ?? '');
    }
    return acc;
  }, {});
}