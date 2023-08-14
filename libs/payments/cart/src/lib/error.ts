import { BaseError } from '@fxa/shared/error';
import { FinishCart, SetupCart, UpdateCart } from './types';
import { CartState } from '@fxa/shared/db/mysql/account';

export class CartError extends BaseError {
  constructor(message: string, cause?: Error) {
    super(
      {
        name: 'CartError',
        ...(cause && { cause }),
      },
      message
    );
  }
}

// TODO - Add information about the cart that caused the errors

export class CartNotCreatedError extends CartError {
  data: SetupCart;
  constructor(data: SetupCart, cause: Error) {
    super('Cart not created', cause);
    this.data = data;
  }
}
export class CartNotFoundError extends CartError {
  cartId: string;
  constructor(cartId: string) {
    super('Cart not found');
    this.cartId = cartId;
  }
}
export class CartNotUpdatedError extends CartError {
  cartId: string;
  data?: FinishCart | UpdateCart;
  constructor(cartId: string, data?: FinishCart | UpdateCart, cause?: Error) {
    super('Cart not updated', cause);
    this.cartId = cartId;
    this.data = data;
  }
}
export class CartStateFinishedError extends CartError {
  constructor() {
    super('Cart state is already finished');
  }
}
export class CartNotDeletedError extends CartError {
  cartId: string;
  constructor(cartId: string, cause?: Error) {
    super('Cart not deleted', cause);
    this.cartId = cartId;
  }
}
export class CartNotRestartedError extends CartError {
  previousCartId: string;
  constructor(previousCartId: string, cause: Error) {
    super('Cart not created', cause);
    this.previousCartId = previousCartId;
  }
}
export class CartInvalidStateTransitionError extends CartError {
  currentState: CartState;
  futureState: CartState;
  constructor(currentState: CartState, futureState: CartState) {
    super('Invalid state transition');
    this.currentState = currentState;
    this.futureState = futureState;
  }
}
export class CartInvalidStateForActionError extends CartError {
  cartId: string;
  state: CartState;
  action: string;
  constructor(cartId: string, state: CartState, action: string) {
    super('Invalid state for executed action');
    this.cartId = cartId;
    this.state = state;
    this.action = action;
  }
}
