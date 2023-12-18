// Note should be aligned with fxa-auth-client/lib/crypt variables!
// Deciding not to create a dependency just for this. Also deciding not
// move to fxa-shared since fxa-auth-client does not currently depend on
// fxa-shared

// TBD - Should we move this to a nx lib, and use same routine for fxa-auth-client and fxa-auth-server?
//       Perhaps this better for a follow up.

export const NAMESPACE = 'identity.mozilla.com/picl/v1/';
export const V1_MARKER = 'quickStretch';
export const V2_MARKER = 'quickStretchV2';
export const V1_REGEX = new RegExp(`^${NAMESPACE}${V1_MARKER}:`);
export const V2_REGEX = new RegExp(`^${NAMESPACE}${V2_MARKER}:`);
export const VX_REGEX = new RegExp(
  `^${NAMESPACE}${V1_MARKER}:|^${NAMESPACE}${V2_MARKER}:`
);

export type Salt = {
  namespace?: string;
  version?: 1 | 2;
  value?: string;
};

export function parseSalt(salt: string): Salt {
  if (V2_REGEX.test(salt)) {
    return {
      namespace: NAMESPACE,
      version: 2,
      value: salt.replace(V2_REGEX, ''),
    };
  }

  if (V1_REGEX.test(salt)) {
    return {
      namespace: NAMESPACE,
      version: 1,
      value: salt.replace(V1_REGEX, ''),
    };
  }

  throw new Error('invalid salt format');
}
