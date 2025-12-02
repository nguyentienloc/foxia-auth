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
    <ul className="flow-messages">
      {messages.map((message, index) => (
        <li
          key={`${message.id ?? index}-${message.text}`}
          className={getMessageClassName(message.type)}
        >
          <span>{message.text}</span>
        </li>
      ))}
    </ul>
  );
}
