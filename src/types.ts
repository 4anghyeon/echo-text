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
