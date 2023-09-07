/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { Test } from '@nestjs/testing';
import { CartManager } from './cart.manager';
import { CartService } from './cart.service';
import { faker } from '@faker-js/faker';
import { ResultCartFactory, UpdateCartFactory } from './cart.factories';
import { CartErrorReasonId } from '@fxa/shared/db/mysql/account';

describe('#payments-cart - service', () => {
  let cartService: CartService;
  let cartManager: CartManager;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [CartService, CartManager],
    })
      .overrideProvider(CartManager)
      .useValue({
        checkActionForValidCartState: jest.fn(),
        createCart: jest.fn(),
        fetchCartById: jest.fn(),
        updateFreshCart: jest.fn(),
        finishCart: jest.fn(),
        finishErrorCart: jest.fn(),
        deleteCart: jest.fn(),
      })
      .compile();

    cartService = moduleRef.get(CartService);
    cartManager = moduleRef.get(CartManager);
  });

  describe('setupCart', () => {
    it('calls createCart with expected parameters', async () => {
      const args = {
        interval: faker.string.uuid(),
        offeringConfigId: faker.string.uuid(),
        experiment: faker.string.uuid(),
        promoCode: faker.word.noun(),
        uid: faker.string.uuid(),
      };

      await cartService.setupCart(args);

      expect(cartManager.createCart).toHaveBeenCalledWith({
        interval: args.interval,
        offeringConfigId: args.offeringConfigId,
        amount: 0,
        uid: args.uid,
        stripeCustomerId: undefined,
        experiment: args.experiment,
      });
    });
  });

  describe('restartCart', () => {
    it('fetches old cart and creates new cart with same details', async () => {
      const mockOldCart = ResultCartFactory();
      const mockNewCart = ResultCartFactory();

      jest.spyOn(cartManager, 'fetchCartById').mockResolvedValue(mockOldCart);
      jest.spyOn(cartManager, 'createCart').mockResolvedValue(mockNewCart);

      const result = await cartService.restartCart(mockOldCart.id);

      expect(cartManager.fetchCartById).toHaveBeenCalledWith(mockOldCart.id);
      expect(cartManager.createCart).toHaveBeenCalledWith({
        uid: mockOldCart.uid,
        interval: mockOldCart.interval,
        offeringConfigId: mockOldCart.offeringConfigId,
        taxAddress: mockOldCart.taxAddress,
        stripeCustomerId: mockOldCart.stripeCustomerId,
        email: mockOldCart.email,
        amount: mockOldCart.amount,
      });
      expect(result).toEqual(mockNewCart);
    });
  });

  describe('checkoutCart', () => {
    it('calls cartManager.finishCart', async () => {
      const mockCart = ResultCartFactory();

      jest.spyOn(cartManager, 'fetchCartById').mockResolvedValue(mockCart);

      await cartService.checkoutCart(mockCart.id);

      expect(cartManager.fetchCartById).toHaveBeenCalledWith(mockCart.id);
      expect(cartManager.finishCart).toHaveBeenCalledWith(mockCart, {});
    });

    it('calls cartManager.finishErrorCart when error occurs during checkout', async () => {
      const mockCart = ResultCartFactory();

      jest.spyOn(cartManager, 'fetchCartById').mockResolvedValue(mockCart);
      jest.spyOn(cartManager, 'finishCart').mockRejectedValue(undefined);

      await cartService.checkoutCart(mockCart.id);

      expect(cartManager.fetchCartById).toHaveBeenCalledWith(mockCart.id);
      expect(cartManager.finishErrorCart).toHaveBeenCalledWith(mockCart, {
        errorReasonId: CartErrorReasonId.Unknown,
      });
    });
  });

  describe('updateCart', () => {
    it('calls cartManager.updateFreshCart', async () => {
      const mockCart = ResultCartFactory();
      const mockUpdateCart = UpdateCartFactory();

      jest.spyOn(cartManager, 'fetchCartById').mockResolvedValue(mockCart);

      await cartService.updateCart(mockCart.id, mockUpdateCart);

      expect(cartManager.fetchCartById).toHaveBeenCalledWith(mockCart.id);
      expect(cartManager.updateFreshCart).toHaveBeenCalledWith(
        mockCart,
        mockUpdateCart
      );
    });
  });

  describe('getCart', () => {
    it('calls cartManager.fetchCartById', async () => {
      const mockCart = ResultCartFactory();

      jest.spyOn(cartManager, 'fetchCartById').mockResolvedValue(mockCart);

      const result = await cartService.getCart(mockCart.id);

      expect(cartManager.fetchCartById).toHaveBeenCalledWith(mockCart.id);
      expect(result).toEqual(mockCart);
    });
  });
});
