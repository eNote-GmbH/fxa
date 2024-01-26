import { ApolloClient, gql, NormalizedCacheObject } from '@apollo/client';
import AuthClient from 'fxa-auth-client/browser';
import { sessionToken } from '../lib/cache';
import { GET_LOCAL_SIGNED_IN_STATUS } from '../components/App/gql';

export interface SessionData {
  verified: boolean | null;
  token: string | null;
  verifySession?: (
    code: string,
    options: {
      service?: string;
      scopes?: string[];
      marketingOptIn?: boolean;
      newsletters?: string[];
    }
  ) => Promise<void>;
  destroy?: () => void;
}

export const GET_SESSION_VERIFIED = gql`
  query GetSession {
    session {
      verified
    }
  }
`;

export const DESTROY_SESSION = gql`
  mutation DestroySession {
    destroySession(input: {}) {
      clientMutationId
    }
  }
`;

export class Session implements SessionData {
  private readonly authClient: AuthClient;
  private readonly apolloClient: ApolloClient<object>;
  private _loading: boolean;
  token: string | null;
  verified: boolean | null;

  constructor(
    authClient: AuthClient,
    apolloClient: ApolloClient<NormalizedCacheObject>
  ) {
    this.authClient = authClient;
    this.apolloClient = apolloClient;
    this._loading = false;

    this.token = sessionToken();
    this.verified = null;
  }

  private async withLoadingStatus<T>(promise: Promise<T>) {
    this._loading = true;
    try {
      return await promise;
    } catch (e) {
      throw e;
    } finally {
      this._loading = false;
    }
  }

  async verifySession(
    code: string,
    options: {
      service?: string;
      scopes?: string[];
      marketingOptIn?: boolean;
      newsletters?: string[];
    } = {}
  ) {
    await this.withLoadingStatus(
      this.authClient.sessionVerifyCode(sessionToken()!, code, options)
    );
    this.verified = true;
    this.apolloClient.cache.modify({
      fields: {
        session: () => {
          return this.verified;
        },
      },
    });
    this.apolloClient.cache.writeQuery({
      query: GET_LOCAL_SIGNED_IN_STATUS,
      data: { isSignedIn: true },
    });
  }

  async sendVerificationCode() {
    await this.withLoadingStatus(
      this.authClient.sessionResendVerifyCode(sessionToken()!)
    );
  }

  async destroy() {
    await this.apolloClient.mutate({
      mutation: DESTROY_SESSION,
      variables: { input: {} },
    });
  }

  async isSessionVerified() {
    const query = GET_SESSION_VERIFIED;
    const { data } = await this.apolloClient.query({
      fetchPolicy: 'network-only',
      query,
    });
    const { session } = data;
    this.verified = session.verified;
    const sessionStatus: boolean = session.verified;
    return sessionStatus;
  }
}
