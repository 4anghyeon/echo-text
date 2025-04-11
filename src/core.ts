import { type EchoTextEvent, EchoTextStatus, type SpeedCalculator } from './types';

/**
 * EchoText creates a typewriter effect by displaying characters one by one
 */
export class EchoText {
  private readonly lineQueue: string[] = [];
  private readonly speed: number | SpeedCalculator;
  private completedLines: string[] = [];
  private currentLineIndex = 0;
  private currentCharIndex = 0;
  private status: EchoTextStatus = EchoTextStatus.IDLE;
  private currentLine = '';
  private intervalId: ReturnType<typeof setInterval> | null = null;
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  private eventListeners: Record<EchoTextEvent, Array<(data: any) => void>> = {
    update: [],
    'line-complete': [],
    complete: [],
  };

  /**
   * Create a new EchoText instance
   * @param lines Array of text lines to display
   * @param speed Typing speed in milliseconds or a function that calculates speed based on the line
   */
  constructor(lines: string[], speed: number | SpeedCalculator) {
    this.lineQueue = [...lines];
    this.speed = speed;
  }

  /**
   * Add a new line or multiple lines to the queue
   * @param line Single line or array of lines to add
   * @returns The EchoText instance for chaining
   */
  addLine(line: string | string[]): this {
    if (Array.isArray(line)) {
      this.lineQueue.push(...line);
    } else {
      this.lineQueue.push(line);
    }
    return this;
  }

  /**
   * Start the typing effect
   * @returns The EchoText instance for chaining
   */
  start(): this {
    if (this.status === EchoTextStatus.RUNNING) {
      return this; // Already running
    }

    if (this.status === EchoTextStatus.PAUSED) {
      this.status = EchoTextStatus.RUNNING;
      this.process();
      return this;
    }

    this.status = EchoTextStatus.RUNNING;
    this.currentLineIndex = 0;
    this.currentCharIndex = 0;
    this.currentLine = '';

    this.process();
    return this;
  }

  /**
   * Pause the typing effect
   * @returns The EchoText instance for chaining
   */
  pause(): this {
    if (this.status === EchoTextStatus.RUNNING) {
      this.status = EchoTextStatus.PAUSED;
      if (this.intervalId) {
        clearInterval(this.intervalId);
        this.intervalId = null;
      }
    }
    return this;
  }

  /**
   * Resume a paused typing effect
   * @returns The EchoText instance for chaining
   */
  resume(): this {
    if (this.status === EchoTextStatus.PAUSED) {
      this.status = EchoTextStatus.RUNNING;
      this.process();
    }
    return this;
  }

  /**
   * Stop the typing effect
   * @returns The EchoText instance for chaining
   */
  stop(): this {
    this.status = EchoTextStatus.IDLE;

    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    return this;
  }

  /**
   * Reset the typing effect to start from the beginning
   * @returns The EchoText instance for chaining
   */
  reset(): this {
    this.stop();
    this.currentLineIndex = 0;
    this.currentCharIndex = 0;
    this.currentLine = '';
    this.completedLines = [];
    this.emitEvent('update', {
      text: this.currentLine,
      lineIndex: this.currentLineIndex,
      completedLines: this.completedLines,
    });
    return this;
  }

  /**
   * Get the current text being displayed
   * @returns The current text
   */
  getCurrentText(): string {
    return this.currentLine;
  }

  /**
   * Get all completed lines
   * @returns Array of completed lines
   */
  getCompletedLines(): string[] {
    return [...this.completedLines];
  }

  /**
   * Get the current status of the typing effect
   * @returns Status object containing current state
   */
  getStatus(): {
    status: EchoTextStatus;
    currentLineIndex: number;
    totalLines: number;
  } {
    return {
      status: this.status,
      currentLineIndex: this.currentLineIndex,
      totalLines: this.lineQueue.length,
    };
  }

  /**
   * Check if the typing effect is currently running
   * @returns boolean indicating if the effect is running
   */
  isRunning(): boolean {
    return this.status === EchoTextStatus.RUNNING;
  }

  /**
   * Check if the typing effect is currently paused
   * @returns boolean indicating if the effect is paused
   */
  isPaused(): boolean {
    return this.status === EchoTextStatus.PAUSED;
  }

  /**
   * Check if the typing effect is completed
   * @returns boolean indicating if the effect is completed
   */
  isCompleted(): boolean {
    return this.status === EchoTextStatus.COMPLETED;
  }

  /**
   * Add an event listener
   * @param event Event type to listen for
   * @param callback Function to call when the event occurs
   * @returns The EchoText instance for chaining
   */
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  on(event: EchoTextEvent, callback: (data: any) => void): this {
    if (this.eventListeners[event]) {
      this.eventListeners[event].push(callback);
    }
    return this;
  }

  /**
   * Calculate the typing speed for the current line
   * @param line The line to calculate speed for
   * @returns The typing speed in milliseconds
   */
  private calculateSpeed(line: string): number {
    if (typeof this.speed === 'function') {
      return this.speed(line);
    }
    return this.speed;
  }

  /**
   * Type the next character in the sequence
   */
  private process(): void {
    if (this.status !== EchoTextStatus.RUNNING || this.currentLineIndex >= this.lineQueue.length) {
      this.status = EchoTextStatus.COMPLETED;
      this.emitEvent('complete', {
        completedLines: [...this.completedLines],
      });
      return;
    }

    const currentLineText = this.lineQueue[this.currentLineIndex];
    const typingSpeed = this.calculateSpeed(currentLineText);

    this.intervalId = setInterval(() => {
      if (this.status !== EchoTextStatus.RUNNING) {
        if (this.intervalId) {
          clearInterval(this.intervalId);
          this.intervalId = null;
        }
        return;
      }

      if (this.currentCharIndex < currentLineText.length) {
        // Add next character
        this.currentLine += currentLineText[this.currentCharIndex];
        this.currentCharIndex++;
        // Emit update event
        this.emitEvent('update', {
          text: this.currentLine,
          char: currentLineText[this.currentCharIndex - 1],
          lineIndex: this.currentLineIndex,
          charIndex: this.currentCharIndex - 1,
          completedLines: [...this.completedLines],
        });
      } else {
        // line end !!
        if (this.intervalId) {
          clearInterval(this.intervalId);
          this.intervalId = null;
        }

        // Store completed line
        this.completedLines[this.currentLineIndex] = this.currentLine;

        // Emit line complete event
        this.emitEvent('line-complete', {
          line: currentLineText,
          lineIndex: this.currentLineIndex,
          completedLines: [...this.completedLines],
        });

        // go to next line or complete whole process
        if (this.currentLineIndex + 1 < this.lineQueue.length) {
          // Move to next line
          this.currentLineIndex++;
          this.currentCharIndex = 0;
          this.currentLine = '';

          // Start typing the next line
          this.process();
        } else {
          // All lines completed
          this.status = EchoTextStatus.COMPLETED;
          this.emitEvent('complete', {
            completedLines: [...this.completedLines],
          });
        }
      }
    }, typingSpeed);
  }

  /**
   * Emit an event to all registered listeners
   * @param event Event type
   * @param data Data to pass to the listeners
   */
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  private emitEvent(event: EchoTextEvent, data: any): void {
    if (this.eventListeners[event]) {
      for (const callback of this.eventListeners[event]) {
        callback(data);
      }
    }
  }
}
