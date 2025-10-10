import { toast as sonnerToast } from "sonner"

type ToastOptions = {
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
};

const createToast = () => {
  const toast = (title: string, options?: ToastOptions) => {
    sonnerToast(title, {
      description: options?.description,
      action: options?.action,
    });
  };

  toast.success = (title: string, options?: ToastOptions) => {
    sonnerToast.success(title, {
      description: options?.description,
      action: options?.action,
    });
  };
  
  toast.error = (title: string, options?: ToastOptions) => {
    sonnerToast.error(title, {
      description: options?.description,
      action: options?.action,
    });
  };
  
  toast.info = (title: string, options?: ToastOptions) => {
    sonnerToast.info(title, {
      description: options?.description,
      action: options?.action,
    });
  };

  return toast;
};

export const toast = createToast();

export const useToast = () => {
  return { toast };
};
