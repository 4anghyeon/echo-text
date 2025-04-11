import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { EchoText, EchoTextStatus } from '../src';

describe('EchoText', () => {
  beforeEach(() => {
    // Setup fake timers
    vi.useFakeTimers();
  });

  afterEach(() => {
    // Cleanup timers
    vi.restoreAllMocks();
  });

  it('should create EchoText instance with basic properties', () => {
    const lines = ['Hello', 'World'];
    const echoText = new EchoText(lines, 50);

    expect(echoText).toHaveProperty('start');
    expect(echoText).toHaveProperty('pause');
    expect(echoText).toHaveProperty('resume');
    expect(echoText).toHaveProperty('stop');
    expect(echoText).toHaveProperty('reset');
    expect(echoText).toHaveProperty('getCurrentText');
    expect(echoText).toHaveProperty('getCompletedLines');
    expect(echoText).toHaveProperty('getStatus');

    // Check initial status
    expect(echoText.getStatus().status).toBe(EchoTextStatus.IDLE);
  });

  it('should emit update events when characters are typed', () => {
    const onUpdate = vi.fn();
    const lines = ['Hello'];

    const echoText = new EchoText(lines, 10);
    echoText.on('update', onUpdate);
    echoText.start();

    // Advance timer by 10ms to trigger first character
    vi.advanceTimersByTime(10);

    expect(onUpdate).toHaveBeenCalledTimes(1);
    expect(onUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        text: 'H',
        char: 'H',
        lineIndex: 0,
        charIndex: 0,
      }),
    );

    // Advance timer to get the next character
    vi.advanceTimersByTime(10);

    expect(onUpdate).toHaveBeenCalledTimes(2);
    expect(onUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        text: 'He',
        char: 'e',
        lineIndex: 0,
        charIndex: 1,
      }),
    );
  });

  it('should emit line-complete event when a line is completed', () => {
    const onLineComplete = vi.fn();
    const lines = ['Hi'];

    const echoText = new EchoText(lines, 10);
    echoText.on('line-complete', onLineComplete);
    echoText.start();

    vi.advanceTimersByTime(lines.join('').length * 10 + lines.length * 10);

    expect(onLineComplete).toHaveBeenCalledTimes(1);
    expect(onLineComplete).toHaveBeenCalledWith(
      expect.objectContaining({
        line: 'Hi',
        lineIndex: 0,
      }),
    );
  });

  it('should emit complete event when all lines are completed', () => {
    const onComplete = vi.fn();
    const lines = ['Hi', 'There'];

    const echoText = new EchoText(lines, 10);
    echoText.on('complete', onComplete);
    echoText.start();

    vi.advanceTimersByTime(lines.join('').length * 10 + lines.length * 10);

    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(onComplete).toHaveBeenCalledWith(
      expect.objectContaining({
        completedLines: ['Hi', 'There'],
      }),
    );
  });

  it('should pause and resume typing', () => {
    const onUpdate = vi.fn();
    const lines = ['Hello'];

    const echoText = new EchoText(lines, 10);
    echoText.on('update', onUpdate);
    echoText.start();

    // Type first character
    vi.advanceTimersByTime(10);
    expect(onUpdate).toHaveBeenCalledTimes(1);

    // Pause typing
    echoText.pause();
    expect(echoText.getStatus().status).toBe(EchoTextStatus.PAUSED);

    // No more characters should be typed after pause
    vi.advanceTimersByTime(50);
    expect(onUpdate).toHaveBeenCalledTimes(1);

    // Resume typing
    echoText.resume();
    expect(echoText.getStatus().status).toBe(EchoTextStatus.RUNNING);

    // Should continue typing
    vi.advanceTimersByTime(10);
    expect(onUpdate).toHaveBeenCalledTimes(2);
  });

  it('should stop typing', () => {
    const onUpdate = vi.fn();
    const onComplete = vi.fn();
    const lines = ['Hello'];

    const echoText = new EchoText(lines, 10);
    echoText.on('update', onUpdate);
    echoText.on('complete', onComplete);
    echoText.start();

    // Type first character
    vi.advanceTimersByTime(10);
    expect(onUpdate).toHaveBeenCalledTimes(1);

    // Stop typing
    echoText.stop();
    expect(echoText.getStatus().status).toBe(EchoTextStatus.IDLE);

    // No more characters should be typed after stop
    vi.advanceTimersByTime(100);
    expect(onUpdate).toHaveBeenCalledTimes(1);

    // onComplete should not be called after stop
    expect(onComplete).not.toHaveBeenCalled();
  });

  it('should reset typing', () => {
    const onUpdate = vi.fn();
    const lines = ['Hello'];

    const echoText = new EchoText(lines, 10);
    echoText.on('update', onUpdate);
    echoText.start();

    // Type some characters
    vi.advanceTimersByTime(30); // 3 characters
    expect(onUpdate).toHaveBeenCalledTimes(3);

    // Reset typing
    echoText.reset();

    // Check that current text is empty and status is IDLE
    expect(echoText.getCurrentText()).toBe('');
    expect(echoText.getStatus().status).toBe(EchoTextStatus.IDLE);

    // Start again
    echoText.start();
    vi.advanceTimersByTime(10);

    // Should start from the first character
    expect(onUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        text: 'H',
        charIndex: 0,
      }),
    );
  });

  it('should add new lines dynamically', () => {
    const onComplete = vi.fn();
    const lines = ['Initial line'];

    const echoText = new EchoText(lines, 10);
    echoText.on('complete', onComplete);
    echoText.start();

    // Add more lines
    echoText.addLine(['Second line', 'Third line']);

    // Complete all three lines
    vi.advanceTimersByTime(360); // More than enough time for all characters

    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(onComplete).toHaveBeenCalledWith(
      expect.objectContaining({
        completedLines: expect.arrayContaining(['Initial line', 'Second line', 'Third line']),
      }),
    );
  });

  it('should handle empty lines array', () => {
    const onComplete = vi.fn();
    const echoText = new EchoText([], 50);

    echoText.on('complete', onComplete);
    echoText.start();

    vi.advanceTimersByTime(300); // More than enough time for all characters
    console.log(echoText.getStatus().status);

    expect(echoText.getStatus().status).toBe(EchoTextStatus.COMPLETED);
    expect(onComplete).toHaveBeenCalledWith(
      expect.objectContaining({
        completedLines: [],
      }),
    );
  });
});
