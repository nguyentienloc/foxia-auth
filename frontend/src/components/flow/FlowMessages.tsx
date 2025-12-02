import { UiText } from '../../types/kratos';

type Props = {
  messages?: UiText[];
};

export function FlowMessages({ messages }: Props) {
  if (!messages || messages.length === 0) {
    return null;
  }

  const getMessageClassName = (type?: string) => {
    switch (type) {
      case 'error':
        return 'flow-message--error';
      case 'info':
        return 'flow-message--info';
      case 'success':
        return 'flow-message--success';
      default:
        return 'flow-message--default';
    }
  };

  return (
    <ul className="space-y-3">
      {messages.map((message, index) => (
        <li
          key={`${message.id ?? index}-${message.text}`}
          className={`rounded-xl border px-4 py-3 text-sm ${
            message.type === 'error'
              ? 'border-red-200 bg-red-50 text-red-700'
              : message.type === 'success'
                ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                : 'border-sky-200 bg-sky-50 text-sky-700'
          }`}
        >
          <span>{message.text}</span>
        </li>
      ))}
    </ul>
  );
}
