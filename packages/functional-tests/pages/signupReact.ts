import { expect } from '@playwright/test';
import { BaseLayout } from './layout';
import { getReactFeatureFlagUrl } from '../lib/react-flag';
import { EmailHeader, EmailType } from '../lib/email';

export type EmailFormData = {
  email: string;
  submit: boolean;
};

export type SignupFormData = {
  password: string;
  age: string;
  submit: boolean;
};

export type CodeFormData = {
  email: string;
  submit: boolean;
};

export class SignupReactPage extends BaseLayout {
  readonly path = 'signup';

  get emailFormHeading() {
    return this.page.getByRole('heading', {
      name: /^Enter your email|^Continue to your Mozilla account/,
    });
  }

  get emailTextbox() {
    return this.page.getByRole('textbox', { name: 'Enter your email' });
  }

  get submitButton() {
    return this.page.getByRole('button', { name: 'Sign up or sign in' });
  }

  get signupFormHeading() {
    return this.page.getByRole('heading', { name: 'Set your password' });
  }

  get passwordTextbox() {
    return this.page.getByTestId('new-password-input-field');
  }

  get verifyPasswordTextbox() {
    return this.page.getByTestId('verify-password-input-field');
  }

  get ageTextbox() {
    return this.page.getByTestId('age-input-field');
  }

  get createAccountButton() {
    return this.page.getByRole('button', { name: 'Create account' });
  }

  get codeFormHeading() {
    return this.page.getByRole('heading', { name: /^Enter confirmation code/ });
  }

  get codeTextbox() {
    return this.page.getByTestId('confirm-signup-code-input-field');
  }

  get confirmButton() {
    return this.page.getByRole('button', { name: 'Confirm' });
  }

  get cannotCreateAccountHeading() {
    return this.page.getByRole('heading', { name: 'Cannot create account' });
  }

  goto(route = '/', params = new URLSearchParams()) {
    params.set('forceExperiment', 'generalizedReactApp');
    params.set('forceExperimentGroup', 'react');
    return this.page.goto(
      getReactFeatureFlagUrl(this.target, route, params.toString())
    );
  }

  async fillOutEmailForm(formData: EmailFormData) {
    await expect(
      this.emailFormHeading,
      'Check for email form failed. The heading missing or not as expected.'
    ).toBeVisible();

    await this.emailTextbox.fill(formData.email);

    if (formData.submit) {
      await this.submitButton.click();
    }
  }

  async fillOutSignupForm(formData: SignupFormData) {
    await expect(
      this.signupFormHeading,
      'Check for signup form failed. The heading missing or not as expected.'
    ).toBeVisible();

    await this.passwordTextbox.fill(formData.password);
    await this.verifyPasswordTextbox.fill(formData.password);
    await this.ageTextbox.fill(formData.age);

    if (formData.submit) {
      await this.createAccountButton.click();
    }
  }

  async fillOutCodeForm(formData: CodeFormData) {
    const code = await this.target.email.waitForEmail(
      formData.email,
      EmailType.verifyShortCode,
      EmailHeader.shortCode
    );

    await expect(
      this.codeFormHeading,
      'Check for code form failed. The heading missing or not as expected.'
    ).toBeVisible();

    await this.codeTextbox.fill(code);

    if (formData.submit) {
      await this.confirmButton.click();
    }
  }

  async waitForRoot() {
    const root = this.page.locator('#root');
    await root.waitFor();
  }
}
