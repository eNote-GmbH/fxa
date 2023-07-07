import { BaseTarget } from '../../lib/targets/base';

export function getReactFeatureFlagUrl(
  target: BaseTarget,
  path: string,
  showReactApp = true
) {
  return `${target.contentServerUrl}${path}?showReactApp=${showReactApp}`;
}
