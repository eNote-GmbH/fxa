/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
import { NotFoundError } from 'objection';
import { Cart, CartState } from '@fxa/shared/db/mysql/account';
import { Logger } from '@fxa/shared/log';
import { InvoiceFactory } from './factories';
import { Cart as CartType, SetupCart, UpdateCart } from './types';

const DEFAULT_INTERVAL = 'monthly';

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
  CART_NOT_FOUND = 'Cart not found for id',
}

export class CartManager {
  private log: Logger;
  constructor(log: Logger) {
    this.log = log;
  }

  public async setupCart(input: SetupCart): Promise<CartType> {
    const cart = await Cart.create({
      ...input,
      state: CartState.START,
      interval: input.interval || DEFAULT_INTERVAL,
      amount: 0, // Hardcoded to 0 for now. TODO - Actual amount to be added in FXA-7521
    });

    return {
      ...cart,
      nextInvoice: InvoiceFactory(), // Temporary
    };
  }

  // public async restartCart(cartId: string): Promise<CartType> {
  //   try {
  //     const cart = await Cart.patchById(cartId, { state: CartState.START });

  //     return {
  //       ...cart,
  //       nextInvoice: InvoiceFactory(), // Temporary
  //     };
  //   } catch (error) {
  //     throw new NotFoundError({ message: ERRORS.CART_NOT_FOUND });
  //   }
  // }

  public async checkoutCart(cartId: string): Promise<CartType> {
    try {
      const cart = await Cart.patchById(cartId, {
        state: CartState.PROCESSING,
      });

      return {
        ...cart,
        nextInvoice: InvoiceFactory(), // Temporary
      };
    } catch (error) {
      throw new NotFoundError({ message: ERRORS.CART_NOT_FOUND });
    }
  }

  public async updateCart(input: UpdateCart): Promise<CartType> {
    const { id: cartId, ...rest } = input;
    try {
      const cart = await Cart.patchById(cartId, { ...rest });

      return {
        ...cart,
        nextInvoice: InvoiceFactory(), // Temporary
      };
    } catch (error) {
      throw new NotFoundError({ message: ERRORS.CART_NOT_FOUND });
    }
  }

  private checkStateTransition(current: CartState, future: CartState): boolean {
    const isValid = !!VALID_STATE_TRANSITIONS[current].includes(future);

    if (!isValid) {
      throw new Error(`Invalid state transition from ${current}, to ${future}`);
    } else {
      return true;
    }
  }

  private checkStateByAction(state: CartState, action: string) {
    const isValid =
      isValidAction(action) && VALID_STATE_BY_ACTION[action].includes(state);

    if (!isValid) {
      throw new Error(`Invalid state, ${state}, for action, ${action}`);
    } else {
      return true;
    }
  }

  public async fetchCartById(id: string) {
    return Cart.findById(id);
  }

  public async updateFreshCart(id: string, updateCart: UpdateCart) {
    const cart = await this.fetchCartById(id);

    this.checkStateByAction(cart.state, 'updateFreshCart');

    cart.$set({
      ...updateCart,
    });

    // return cart.update();
  }

  public async finishCart(
    cart: Cart,
    uid?: string,
    amount?: number,
    stripeCustomerId?: string,
    error?: string
  ) {
    const futureState = error ? CartState.FAIL : CartState.SUCCESS;

    this.checkStateByAction(cart.state, 'finishCart');
    this.checkStateTransition(cart.state, futureState);

    if (futureState === CartState.SUCCESS) {
      if (!uid) {
        throw new Error('Uid is required');
      }
      if (!amount) {
        throw new Error('Amount is required');
      }
      if (!stripeCustomerId) {
        throw new Error('Stripe Customer ID is required');
      }
    }

    cart.setCart({
      uid: uid || cart.uid,
      amount: amount || cart.amount,
      stripeCustomerId: stripeCustomerId || cart.stripeCustomerId,
      errorReasonId: error,
    });

    // Update cart with state and input params
    // return cart.updated();
  }

  public async deleteCart(id: string) {
    const cart = await this.fetchCartById(id);

    this.checkStateByAction(cart.state, 'deleteCart');

    return cart.delete();
  }

  public async restartCart(id: string) {
    const cart = await this.fetchCartById(id);
    this.checkStateByAction(cart.state, 'restartCart');
  }
}
