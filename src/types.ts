/**
 * Type definition for the speed calculator function
 */
export type SpeedCalculator = (line: string) => number;

/**
 * Event types for EchoText
 */
export type EchoTextEvent = 'update' | 'line-complete' | 'complete';

/**
 * Enum representing the possible status states of the typing effect
 */
export enum EchoTextStatus {
  IDLE = 'idle',
  RUNNING = 'running',
  PAUSED = 'paused',
  COMPLETED = 'completed',
}

/**
 * Interface for update event data
 */
export interface UpdateEventData {
  text: string;
  char?: string;
  lineIndex: number;
  charIndex?: number;
  completedLines: string[];
}

/**
 * Interface for line-complete event data
 */
export interface LineCompleteEventData {
  line: string;
  lineIndex: number;
  completedLines: string[];
}

/**
 * Interface for complete event data
 */
export interface CompleteEventData {
  completedLines: string[];
}

/**
 * Type that maps event types to their respective data interfaces
 */
export interface EventDataMap {
  update: UpdateEventData;
  'line-complete': LineCompleteEventData;
  complete: CompleteEventData;
}
