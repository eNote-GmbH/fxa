/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
import { NotFoundError } from 'objection';
import { Cart, CartState } from '@fxa/shared/db/mysql/account';
import { Logger } from '@fxa/shared/log';
import { FinishCart, SetupCart, UpdateCart } from './types';
import {
  CartError,
  CartInvalidStateForActionError,
  CartInvalidStateTransitionError,
  CartNotCreatedError,
  CartNotDeletedError,
  CartNotFoundError,
  CartNotRestartedError,
  CartNotUpdatedError,
} from './error';

const VALID_STATE_TRANSITIONS = {
  [CartState.START]: [CartState.PROCESSING, CartState.FAIL],
  [CartState.PROCESSING]: [CartState.SUCCESS, CartState.FAIL],
  [CartState.SUCCESS]: [] as CartState[],
  [CartState.FAIL]: [] as CartState[],
};

const VALID_STATE_BY_ACTION = {
  updateFreshCart: [CartState.START],
  finishCart: [CartState.PROCESSING],
  finishErrorCart: [CartState.START, CartState.PROCESSING],
  deleteCart: [CartState.START, CartState.PROCESSING],
  restartCart: [CartState.PROCESSING, CartState.FAIL],
};

const isValidAction = (
  key: string
): key is keyof typeof VALID_STATE_BY_ACTION => key in VALID_STATE_BY_ACTION;

export class CartManager {
  private log: Logger;
  constructor(log: Logger) {
    this.log = log;
  }

  private async handleUpdates(cart: Cart) {
    const updatedRows = await cart.update();
    if (!updatedRows) {
      throw new CartNotUpdatedError(cart.id);
    } else {
      return cart;
    }
  }

  private checkStateTransition(current: CartState, future: CartState): boolean {
    const isValid = !!VALID_STATE_TRANSITIONS[current].includes(future);

    if (!isValid) {
      throw new CartInvalidStateTransitionError(current, future);
    } else {
      return true;
    }
  }

  private checkValidStateForAction(cart: Cart, action: string) {
    const isValid =
      isValidAction(action) &&
      VALID_STATE_BY_ACTION[action].includes(cart.state);

    if (!isValid) {
      throw new CartInvalidStateForActionError(cart.id, cart.state, action);
    } else {
      return true;
    }
  }

  public async createCart(input: SetupCart) {
    try {
      return await Cart.create({
        ...input,
        state: CartState.START,
      });
    } catch (error) {
      throw new CartNotCreatedError(input, error);
    }
  }

  public async fetchCartById(id: string) {
    try {
      return await Cart.findById(id);
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw new CartNotFoundError(id);
      } else {
        throw new CartError('General error', error);
      }
    }
  }

  public async updateFreshCart(cart: Cart, items: UpdateCart) {
    this.checkValidStateForAction(cart, 'updateFreshCart');

    cart.setCart({
      ...items,
    });

    try {
      return await this.handleUpdates(cart);
    } catch (error) {
      const cause = error instanceof CartNotUpdatedError ? undefined : error;
      throw new CartNotUpdatedError(cart.id, items, cause);
    }
  }

  public async finishCart(cart: Cart, items: FinishCart) {
    this.checkValidStateForAction(cart, 'finishCart');
    this.checkStateTransition(cart.state, CartState.SUCCESS);

    cart.setCart({
      state: CartState.SUCCESS,
      ...items,
    });

    try {
      return await this.handleUpdates(cart);
    } catch (error) {
      const cause = error instanceof CartNotUpdatedError ? undefined : error;
      throw new CartNotUpdatedError(cart.id, items, cause);
    }
  }

  public async finishErrorCart(cart: Cart, items: FinishCart) {
    this.checkValidStateForAction(cart, 'finishErrorCart');
    this.checkStateTransition(cart.state, CartState.FAIL);

    cart.setCart({
      state: CartState.FAIL,
      ...items,
    });

    try {
      return await this.handleUpdates(cart);
    } catch (error) {
      const cause = error instanceof CartNotUpdatedError ? undefined : error;
      throw new CartNotUpdatedError(cart.id, items, cause);
    }
  }

  public async deleteCart(cart: Cart) {
    this.checkValidStateForAction(cart, 'deleteCart');

    try {
      const result = await cart.delete();
      if (!result) {
        throw new CartNotDeletedError(cart.id);
      } else {
        return result;
      }
    } catch (error) {
      const cause = error instanceof CartNotDeletedError ? undefined : error;
      throw new CartNotDeletedError(cart.id, cause);
    }
  }

  public async restartCart(cart: Cart) {
    this.checkValidStateForAction(cart, 'restartCart');

    try {
      return await Cart.create({
        ...cart,
        state: CartState.START,
      });
    } catch (error) {
      throw new CartNotRestartedError(cart.id, error);
    }
  }
}
