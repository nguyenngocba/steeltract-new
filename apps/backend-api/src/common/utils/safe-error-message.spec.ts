import { safeErrorMessage } from './safe-error-message';

describe('safeErrorMessage', () => {
  it('uses structured message fields without serializing arbitrary payloads', () => {
    expect(
      safeErrorMessage({ message: 'database unavailable', secret: 'hidden' }),
    ).toBe('database unavailable');
    expect(safeErrorMessage({ code: 'ETIMEDOUT' })).toBe(
      'Error code ETIMEDOUT',
    );
    expect(safeErrorMessage({ unexpected: true })).toBe('Unknown error');
  });

  it('bounds persisted error text', () => {
    const message = safeErrorMessage(new Error('x'.repeat(4_000)), 100);

    expect(message).toHaveLength(100);
    expect(message.endsWith('...')).toBe(true);
  });
});
