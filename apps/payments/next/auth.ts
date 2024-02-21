import NextAuth from 'next-auth';
import { authConfig } from './auth.config';

export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth({
  ...authConfig,
  debug: true,
  providers: [
    {
      id: 'fxa',
      name: 'Firefox Accounts',
      type: 'oidc',
      issuer: process.env.AUTH_ISSUER_URL,
      wellKnown: process.env.AUTH_WELL_KNOWN_URL,
      checks: ['pkce', 'state'],
      client: {
        token_endpoint_auth_method: 'none',
      },
      authorization: { params: { scope: 'openid email profile' } },
      clientId: process.env.AUTH_CLIENT_ID,
    },
  ],
  callbacks: {
    async session(params: any) {
      params.session.user.id = params.token.sub;
      return params.session;
    },
    async redirect(all) {
      console.log('REDIRECT');
      console.log(all);
      return all.url;
    },
    async signIn(all) {
      console.log('SIGN IN');
      console.log(all);
      return true;
    },
  },
});
