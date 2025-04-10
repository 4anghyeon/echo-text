import { describe, expect, it } from 'vitest';
import { charByChar } from '../src';

describe('charByChar generator', () => {
  it('should yield each character of a string one by one', () => {
    const text = 'Hello';
    const generator = charByChar(text);

    expect(generator.next().value).toBe('H');
    expect(generator.next().value).toBe('e');
    expect(generator.next().value).toBe('l');
    expect(generator.next().value).toBe('l');
    expect(generator.next().value).toBe('o');
    expect(generator.next().done).toBe(true);
  });

  it('should handle empty strings', () => {
    const generator = charByChar('');
    expect(generator.next().done).toBe(true);
  });

  it('should handle strings with special characters', () => {
    const text = 'Hello! 你好 👋';
    const generator = charByChar(text);
    const chars = [...text];

    for (const char of chars) {
      const result = generator.next();
      expect(result.value).toBe(char);
    }

    expect(generator.next().done).toBe(true);
  });
});
