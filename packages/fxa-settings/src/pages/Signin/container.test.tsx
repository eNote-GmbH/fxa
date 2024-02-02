/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as UseValidateModule from '../../lib/hooks/useValidate';
import * as ApolloModule from '@apollo/client';
import * as SigninModule from './index';
import * as ModelsModule from '../../models';

import { LocationProvider } from '@reach/router';
import { renderWithLocalizationProvider } from 'fxa-react/lib/test-utils/localizationProvider';
import SigninContainer from './container';
import { SigninContainerIntegration, SigninProps } from './interfaces';
import { MozServices } from '../../lib/types';
import { screen } from '@testing-library/react';
import { ModelDataProvider } from '../../lib/model-data';
import { MOCK_EMAIL } from '../mocks';
import { IntegrationType } from '../../models';
import { ApolloClient } from '@apollo/client';

let integration: SigninContainerIntegration;
function mockIntegration() {
  integration = {
    type: IntegrationType.SyncDesktopV3,
    getService: () => MozServices.Default,
    isSync: () => true,
  };
}

function applyMocks() {
  jest.resetAllMocks();
  jest.restoreAllMocks();

  // Run default mocks
  // mockReportSigninModule();
  // mockDamagedLinkModule();
  // mockModelsModule();
  // mockUseValidateModule();
}

function mockUseValidateModule() {
  jest.spyOn(UseValidateModule, 'useValidatedQueryParams').mockReturnValue({
    queryParamModel: {
      email: MOCK_EMAIL,
    } as unknown as ModelDataProvider,
    validationError: undefined,
  });
}

let mockBeginSigninMutation = jest.fn();
function mockApolloClientModule() {
  mockBeginSigninMutation.mockImplementation(async () => {
    return {
      data: {
        unwrapBKey: 'foo',
        SignUp: {
          uid: 'uid123',
          keyFetchToken: 'kft123',
          sessionToken: 'st123',
        },
      },
    };
  });

  jest.spyOn(ApolloModule, 'useMutation').mockReturnValue([
    async (...args: any[]) => {
      return mockBeginSigninMutation(...args);
    },
    {
      loading: false,
      called: true,
      client: {} as ApolloClient<any>,
      reset: () => {},
    },
  ]);
}
let currentSigninProps: SigninProps | undefined;
function mockSignupModule() {
  currentSigninProps = undefined;
  jest
    .spyOn(SigninModule, 'default')
    .mockImplementation((props: SigninProps) => {
      currentSigninProps = props;
      return <div>signup mock</div>;
    });
}

async function render() {
  renderWithLocalizationProvider(
    <LocationProvider>
      <SigninContainer
        {...{
          integration,
          serviceName: MozServices.Default,
        }}
      />
    </LocationProvider>
  );
}

describe('signin container', () => {
  beforeEach(() => {
    applyMocks();
  });

  describe('initial states', () => {
    describe('email', () => {
      it('can be set from query param', () => {});
      it('can be set from router state', () => {});
      it('is read from localStorage if email is not provided via query param or router state', () => {});
      it('is handled if not provided in query params, location state, or local storage', () => {});
    });
    describe('loading spinner', () => {
      it('renders if hasLinkedAccount is undefined', () => {
        render();
        screen.getByAltText('Loading…');
      });
      it('renders if hasPassword is undefined', () => {
        render();
        screen.getByAltText('Loading…');
      });
    });
  });

  describe('hasLinkedAccount or hasPassword is not provided', () => {
    it('accountStatusByEmail is called', () => {});
    it('redirects to /signup if account does not exist', () => {});
    it('sends web channel message for Sync', () => {});
  });
  describe('hasLinkedAccount and hasPassword are provided', () => {
    it('accountStatusByEmail is not called', () => {});
  });

  describe('beginSigninHandler', () => {
    it('runs handler and invokes sign in mutation', () => {});
    it('handles errors', () => {});
  });

  describe('cachedSigninHandler', () => {
    it('runs handler and calls accountProfile', () => {});
    it('handles errors', () => {});
  });
});
