export type NotificationType = 'APPLICATION_STATUS' | 'JOB_APPLIED' | 'JOB_POSTED';

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: string; // ISO string
  read: boolean;
  link?: string;
}
