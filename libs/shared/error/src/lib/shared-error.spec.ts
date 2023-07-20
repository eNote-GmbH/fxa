import { sharedError } from './shared-error';

describe('sharedError', () => {
  it('should work', () => {
    expect(sharedError()).toEqual('shared-error');
  });
});
