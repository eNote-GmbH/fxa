import { TargetName } from '.';
import { BaseTarget, Credentials } from './base';

export class LocalTarget extends BaseTarget {
  static readonly target = 'local';
  readonly name: TargetName = LocalTarget.target;
  readonly contentServerUrl = 'http://localhost:3030';
  readonly paymentsServerUrl = 'http://localhost:3031';
  readonly relierUrl = 'http://localhost:8080';
  readonly subscriptionConfig = {
    product: 'prod_GqM9ToKK62qjkK',
    plan: 'plan_GqM9N6qyhvxaVk',
  };

  constructor() {
    super('http://localhost:9000', 'http://localhost:9001');
  }

  async createAccount(email: string, password: string, options?: any) {
    const result = await this.auth.signUp(email, password, {
      lang: 'en',
      preVerified: 'true',
      ...(options || {}),
    });
    await this.auth.deviceRegister(result.sessionToken, 'playwright', 'tester');
    return {
      email,
      password,
      ...result,
    } as Credentials;
  }
}
