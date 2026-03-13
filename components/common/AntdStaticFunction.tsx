import { message as antdMessage, notification as antdNotification, Modal as antdModal } from 'antd';

type MessageType = 'success' | 'error' | 'info' | 'warning' | 'loading';

interface MessageConfig {
  content: string;
  duration?: number;
  type?: MessageType;
}

export const message = {
  success: (content: string, duration?: number) => antdMessage.success(content, duration),
  error: (content: string, duration?: number) => antdMessage.error(content, duration),
  info: (content: string, duration?: number) => antdMessage.info(content, duration),
  warning: (content: string, duration?: number) => antdMessage.warning(content, duration),
  loading: (content: string, duration?: number) => antdMessage.loading(content, duration),
  open: (config: MessageConfig) => {
    const { type = 'info', content, duration } = config;
    antdMessage.open({ type, content, duration });
  },
  destroy: () => antdMessage.destroy(),
};

export const notification = {
  success: antdNotification.success,
  error: antdNotification.error,
  info: antdNotification.info,
  warning: antdNotification.warning,
  open: antdNotification.open,
  close: antdNotification.close,
  destroy: antdNotification.destroy,
};

export const Modal = {
  confirm: antdModal.confirm,
  info: antdModal.info,
  success: antdModal.success,
  error: antdModal.error,
  warning: antdModal.warning,
};

export default message;
