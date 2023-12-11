import NextAuth, { AuthOptions } from 'next-auth';
import { Provider } from 'next-auth/providers';

const fxaProviderLogin: Provider = {
  id: 'fxa',
  name: 'Firefox Accounts',
  type: 'oauth',
  wellKnown: `http://localhost:3030/.well-known/openid-configuration`,
  checks: ['pkce', 'state'],
  idToken: true,
  client: {
    token_endpoint_auth_method: 'none',
  },
  userinfo: {
    request: async (context) => {
      const response = await fetch('http://localhost:1111/v1/profile', {
        headers: {
          Authorization: `Bearer ${context.tokens.access_token ?? ''}`,
        },
      });
      const data = await response.json();
      return data;
    },
  },
  profile(profile: any) {
    return {
      id: profile.uid,
      email: profile.email,
      image: profile.avatar,
    };
  },
  authorization: { params: { scope: 'openid email profile' } },
  clientId: '32aaeb6f1c21316a',
};

const authOptions: AuthOptions = {
  session: {
    strategy: 'jwt',
  },
  providers: [fxaProviderLogin],
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
