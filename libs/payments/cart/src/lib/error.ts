import { BaseError } from '@fxa/shared/error';
import { CartManagerErrorData } from './types';

export class CartManagerError extends BaseError {
  public data?: CartManagerErrorData;

  constructor(message: string, data?: CartManagerErrorData, cause?: Error) {
    super(
      {
        name: 'CartManagerError',
        ...(cause && { cause }),
      },
      message
    );
    this.data = data;
  }
}
