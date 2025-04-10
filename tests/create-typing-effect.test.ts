import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createTypingEffect } from '../src';

describe('createTypingEffect', () => {
  beforeEach(() => {
    // Setup fake timers
    vi.useFakeTimers();
  });

  afterEach(() => {
    // Cleanup timers
    vi.restoreAllMocks();
  });

  it('should create typing controls with default options', () => {
    const lines = ['Hello', 'World'];
    const typing = createTypingEffect(lines);

    expect(typing).toHaveProperty('stop');
    expect(typing).toHaveProperty('pause');
    expect(typing).toHaveProperty('resume');
    expect(typing).toHaveProperty('setSpeed');
    expect(typing).toHaveProperty('getStatus');
    expect(typing.getStatus()).toBe('running');
  });

  it('should call onCharTyped when characters are typed', () => {
    const onCharTyped = vi.fn();
    const lines = ['Hello'];

    createTypingEffect(lines, {
      typeSpeed: 10,
      onCharTyped,
    });

    // Advance timer by 10ms to trigger first character
    vi.advanceTimersByTime(10);

    expect(onCharTyped).toHaveBeenCalledTimes(1);
    expect(onCharTyped).toHaveBeenCalledWith('H', 'H', 0);

    // Advance timer to get the next character
    vi.advanceTimersByTime(10);

    expect(onCharTyped).toHaveBeenCalledTimes(2);
    expect(onCharTyped).toHaveBeenCalledWith('e', 'He', 0);
  });

  it('should call onLineComplete when a line is completed', () => {
    const onLineComplete = vi.fn();
    const lines = ['Hi'];

    createTypingEffect(lines, {
      typeSpeed: 10,
      onLineComplete,
    });

    // Advance timer to complete the line (2 characters x 10ms)
    vi.advanceTimersByTime(20);

    expect(onLineComplete).toHaveBeenCalledTimes(1);
    expect(onLineComplete).toHaveBeenCalledWith('Hi', 0);
  });

  it('should call onComplete when all lines are completed', () => {
    const onComplete = vi.fn();
    const lines = ['Hi', 'There'];

    createTypingEffect(lines, {
      typeSpeed: 10,
      onComplete,
    });

    // Advance timer to complete both lines (5 characters total + 2 line completions)
    vi.advanceTimersByTime(70); // (2 + 5) * 10ms

    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(onComplete).toHaveBeenCalledWith(['Hi', 'There']);
  });

  it('should honor prefix options for line speed', () => {
    const onCharTyped = vi.fn();
    const lines = ['Normal', '#FAST# Fast', '#SLOW# Slow'];

    createTypingEffect(lines, {
      typeSpeed: 50,
      prefixOptions: [
        { prefix: '#FAST#', speed: 10 },
        { prefix: '#SLOW#', speed: 100 },
      ],
      onCharTyped,
    });

    // Type first line character at normal speed
    vi.advanceTimersByTime(50);
    expect(onCharTyped).toHaveBeenCalledTimes(1);

    // Complete first line and start second
    vi.advanceTimersByTime(250); // 5 more chars at 50ms

    // Reset mock to focus on second line
    onCharTyped.mockReset();

    // Type second line character at fast speed
    vi.advanceTimersByTime(10);
    expect(onCharTyped).toHaveBeenCalledTimes(1);

    // Complete second line (5 characters) and start third
    vi.advanceTimersByTime(50); // 5 more chars at 10ms

    // Reset mock to focus on third line
    onCharTyped.mockReset();

    // Type third line character at slow speed
    vi.advanceTimersByTime(100);
    expect(onCharTyped).toHaveBeenCalledTimes(1);
  });

  it('should pause and resume typing', () => {
    const onCharTyped = vi.fn();
    const lines = ['Hello'];

    const typing = createTypingEffect(lines, {
      typeSpeed: 10,
      onCharTyped,
    });

    // Type first character
    vi.advanceTimersByTime(10);
    expect(onCharTyped).toHaveBeenCalledTimes(1);

    // Pause typing
    typing.pause();
    expect(typing.getStatus()).toBe('paused');

    // No more characters should be typed after pause
    vi.advanceTimersByTime(50);
    expect(onCharTyped).toHaveBeenCalledTimes(1);

    // Resume typing
    typing.resume();
    expect(typing.getStatus()).toBe('running');

    // Should continue typing
    vi.advanceTimersByTime(10);
    expect(onCharTyped).toHaveBeenCalledTimes(2);
  });

  it('should stop typing', () => {
    const onCharTyped = vi.fn();
    const onComplete = vi.fn();
    const lines = ['Hello'];

    const typing = createTypingEffect(lines, {
      typeSpeed: 10,
      onCharTyped,
      onComplete,
    });

    // Type first character
    vi.advanceTimersByTime(10);
    expect(onCharTyped).toHaveBeenCalledTimes(1);

    // Stop typing
    typing.stop();
    expect(typing.getStatus()).toBe('stopped');

    // No more characters should be typed after stop
    vi.advanceTimersByTime(100);
    expect(onCharTyped).toHaveBeenCalledTimes(1);

    // onComplete should not be called after stop
    expect(onComplete).not.toHaveBeenCalled();
  });

  it('should change typing speed', () => {
    const onCharTyped = vi.fn();
    const lines = ['Hello'];

    const typing = createTypingEffect(lines, {
      typeSpeed: 100,
      onCharTyped,
    });

    // Type first character at original speed
    vi.advanceTimersByTime(100);
    expect(onCharTyped).toHaveBeenCalledTimes(1);

    // Change to faster speed
    typing.setSpeed(10);

    // Type second character at new speed
    vi.advanceTimersByTime(10);
    expect(onCharTyped).toHaveBeenCalledTimes(2);
  });

  it('should handle empty lines array', () => {
    const onComplete = vi.fn();

    const typing = createTypingEffect([], {
      onComplete,
    });

    expect(typing.getStatus()).toBe('completed');
    expect(onComplete).toHaveBeenCalledWith([]);
  });
});
