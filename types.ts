export interface SelectionBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export enum ProcessingStatus {
  IDLE = 'IDLE',
  UPLOADING = 'UPLOADING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  ERROR = 'ERROR'
}

export interface EditRequest {
  imageBase64: string;
  newDate: string;
  newTime: string;
  hintDescription?: string;
}
