import type { EchoTextEvent, SpeedCalculator } from './types';

/**
 * EchoText creates a typewriter effect by displaying characters one by one
 */
export class EchoText {
  private readonly lines: string[] = [];
  private readonly speed: number | SpeedCalculator;
  private completedLines: string[] = [];
  private currentLineIndex = 0;
  private currentCharIndex = 0;
  private isRunning = false;
  private isPaused = false;
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
    this.lines = [...lines];
    this.speed = speed;
  }

  /**
   * Add a new line or multiple lines to the queue
   * @param line Single line or array of lines to add
   * @returns The EchoText instance for chaining
   */
  addLine(line: string | string[]): this {
    if (Array.isArray(line)) {
      this.lines.push(...line);
    } else {
      this.lines.push(line);
    }
    return this;
  }

  /**
   * Start the typing effect
   * @returns The EchoText instance for chaining
   */
  start(): this {
    if (this.isRunning && !this.isPaused) {
      return this; // Already running
    }

    if (this.isPaused) {
      this.isPaused = false;
      return this;
    }

    this.isRunning = true;
    this.currentLineIndex = 0;
    this.currentCharIndex = 0;
    this.currentLine = '';

    this.typeNextChar();
    return this;
  }

  /**
   * Pause the typing effect
   * @returns The EchoText instance for chaining
   */
  pause(): this {
    if (this.isRunning && !this.isPaused) {
      this.isPaused = true;
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
    if (this.isRunning && this.isPaused) {
      this.isPaused = false;
      this.typeNextChar();
    }
    return this;
  }

  /**
   * Stop the typing effect
   * @returns The EchoText instance for chaining
   */
  stop(): this {
    this.isRunning = false;
    this.isPaused = false;

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
    isRunning: boolean;
    isPaused: boolean;
    currentLineIndex: number;
    totalLines: number;
  } {
    return {
      isRunning: this.isRunning,
      isPaused: this.isPaused,
      currentLineIndex: this.currentLineIndex,
      totalLines: this.lines.length,
    };
  }

  /**
   * Add an event listener
   * @param event Event type to listen for
   * @param callback Function to call when the event occurs
   * @returns The EchoText instance for chaining
   */

  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  on(event: EchoTextEvent, callback: (data: any) => void): EchoText {
    if (this.eventListeners[event]) {
      this.eventListeners[event].push(callback);
    }
    return this;
  }

  /**
   * Remove an event listener
   * @param event Event type
   * @param callback The callback function to remove
   * @returns The EchoText instance for chaining
   */
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  off(event: EchoTextEvent, callback: (data: any) => void): EchoText {
    if (this.eventListeners[event]) {
      this.eventListeners[event] = this.eventListeners[event].filter((cb) => cb !== callback);
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
  private typeNextChar(): void {
    if (!this.isRunning || this.isPaused || this.currentLineIndex >= this.lines.length) {
      return;
    }

    const currentLineText = this.lines[this.currentLineIndex];
    const typingSpeed = this.calculateSpeed(currentLineText);

    this.intervalId = setInterval(() => {
      if (this.isPaused) {
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
        // End of line
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

        if (this.currentLineIndex + 1 < this.lines.length) {
          // Move to next line
          this.currentLineIndex++;
          this.currentCharIndex = 0;
          this.currentLine = '';

          // Start typing the next line
          this.typeNextChar();
        } else {
          // All lines completed
          this.isRunning = false;
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
