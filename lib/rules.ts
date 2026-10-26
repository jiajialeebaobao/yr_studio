export const HOUR = 3_600_000;
export const canBook = (start: Date, now = new Date()) => start.getTime() - now.getTime() >= 4 * HOUR;
export const canCancel = (start: Date, now = new Date()) => start.getTime() - now.getTime() >= 3 * HOUR;
export const shouldSettle = (start: Date, now = new Date()) => start.getTime() - now.getTime() < 3 * HOUR;
export const formatTime = (value: Date | string) => new Intl.DateTimeFormat('zh-CN', {
  timeZone: 'Asia/Shanghai', month: 'numeric', day: 'numeric', weekday: 'short', hour: '2-digit', minute: '2-digit', hour12: false,
}).format(new Date(value));
export const sessionStatus: Record<string, string> = { OPEN: '待成班', CONFIRMED: '已确认开课', NOT_FORMED: '未成班', CANCELED: '门店已停课' };
export const sessionLabel = (status: string, kind: string) => status === 'OPEN' && kind === 'PRIVATE' ? '可预约' : sessionStatus[status];
export const bookingStatus: Record<string, string> = { ACTIVE: '预约有效', CANCELED: '已免费取消', NOT_FORMED: '未成班', SESSION_CANCELED: '门店已停课' };
