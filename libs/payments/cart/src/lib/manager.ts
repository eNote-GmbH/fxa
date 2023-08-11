/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
import { NotFoundError } from 'objection';
import { Cart, CartState } from '@fxa/shared/db/mysql/account';
import { Logger } from '@fxa/shared/log';
import { FinishCart, SetupCart, UpdateCart } from './types';
import { CartManagerError } from './error';

const VALID_STATE_TRANSITIONS = {
  [CartState.START]: [CartState.PROCESSING, CartState.FAIL],
  [CartState.PROCESSING]: [CartState.SUCCESS, CartState.FAIL],
  [CartState.SUCCESS]: [] as CartState[],
  [CartState.FAIL]: [] as CartState[],
};

const VALID_STATE_BY_ACTION = {
  updateFreshCart: [CartState.START],
  finishCart: [CartState.PROCESSING],
  deleteCart: [CartState.START, CartState.PROCESSING],
  restartCart: [CartState.PROCESSING, CartState.FAIL],
};

const isValidAction = (
  key: string
): key is keyof typeof VALID_STATE_BY_ACTION => key in VALID_STATE_BY_ACTION;

// TODO - Adopt error library developed as part of FXA-7656
export enum ERRORS {
  CART_GENERAL = 'General error during request to the database',
  CART_NOT_FOUND = 'Cart not found for id',
  CART_NOT_DELETE = 'Could not delete Cart',
  INVALID_STATE_TRANSITION = 'Invalid state transition',
  INVALID_STATE_ACTION = 'Invalid state for executed action',
  MISSING_REQUIRED_FIELD = 'Required field was not provided',
}

export class CartManager {
  private log: Logger;
  constructor(log: Logger) {
    this.log = log;
  }

  private handleCartRequests(request: Promise<any>, cartId: string) {
    try {
      return request;
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw new CartManagerError(ERRORS.CART_NOT_FOUND, { cartId }, error);
      } else {
        throw new CartManagerError(ERRORS.CART_GENERAL, {}, error);
      }
    }
  }

  private checkStateTransition(current: CartState, future: CartState): boolean {
    const isValid = !!VALID_STATE_TRANSITIONS[current].includes(future);

    if (!isValid) {
      throw new CartManagerError(ERRORS.INVALID_STATE_TRANSITION, {
        currentState: current,
        futureState: future,
      });
    } else {
      return true;
    }
  }

  private checkStateByAction(state: CartState, action: string) {
    const isValid =
      isValidAction(action) && VALID_STATE_BY_ACTION[action].includes(state);

    if (!isValid) {
      throw new CartManagerError(ERRORS.INVALID_STATE_ACTION, {
        currentState: state,
        action,
      });
    } else {
      return true;
    }
  }

  public async createCart(input: SetupCart) {
    return Cart.create({
      ...input,
      state: CartState.START,
    });
  }

  public async fetchCartById(id: string) {
    return this.handleCartRequests(Cart.findById(id), id);
  }

  public async updateFreshCart(cart: Cart, updateCart: UpdateCart) {
    this.checkStateByAction(cart.state, 'updateFreshCart');

    cart.setCart({
      ...updateCart,
    });

    return this.handleCartRequests(cart.update(), cart.id);
  }

  public async finishCart(cart: Cart, items: FinishCart) {
    const { uid, amount, stripeCustomerId, errorReasonId } = items;
    const futureState = errorReasonId ? CartState.FAIL : CartState.SUCCESS;

    this.checkStateByAction(cart.state, 'finishCart');
    this.checkStateTransition(cart.state, futureState);

    if (futureState === CartState.SUCCESS) {
      if (!uid || !amount || !stripeCustomerId) {
        throw new CartManagerError(ERRORS.MISSING_REQUIRED_FIELD, {
          cartId: cart.id,
          finishCart: items,
        });
      }
    }

    cart.setCart({
      uid: uid || cart.uid,
      amount: amount || cart.amount,
      stripeCustomerId: stripeCustomerId || cart.stripeCustomerId,
      errorReasonId: errorReasonId || cart.errorReasonId,
    });

    return this.handleCartRequests(cart.update(), cart.id);
  }

  public async deleteCart(cart: Cart) {
    this.checkStateByAction(cart.state, 'deleteCart');

    const result = await this.handleCartRequests(cart.delete(), cart.id);

    if (!result) {
      throw new CartManagerError(ERRORS.CART_NOT_DELETE, { cartId: cart.id });
    } else {
      return result;
    }
  }

  public async restartCart(cart: Cart) {
    this.checkStateByAction(cart.state, 'restartCart');

    return Cart.create({
      ...cart,
      state: CartState.START,
    });
  }
}
