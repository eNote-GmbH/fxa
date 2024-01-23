/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import React from 'react';
import { screen } from '@testing-library/react';
import { renderWithLocalizationProvider } from 'fxa-react/lib/test-utils/localizationProvider';
import { getFtlBundle, testAllL10n } from 'fxa-react/lib/test-utils';
import { FluentBundle } from '@fluent/bundle';
import ReportSignin, { viewName } from '.';
import { usePageViewEvent } from '../../../lib/metrics';
import { REACT_ENTRYPOINT } from '../../../constants';

jest.mock('../../../lib/metrics', () => ({
  usePageViewEvent: jest.fn(),
}));

describe('ReportSignin', () => {
  let bundle: FluentBundle;
  beforeAll(async () => {
    bundle = await getFtlBundle('settings');
  });
  it('renders Ready component as expected', () => {
    renderWithLocalizationProvider(<ReportSignin />);
    testAllL10n(screen, bundle);

    expect(
      screen.getByRole('heading', { name: 'Report unauthorized sign-in?' })
    ).toBeInTheDocument();

    expect(
      screen.getByRole('button', { name: 'Report activity' })
    ).toBeInTheDocument();

    expect(
      screen.getByRole('link', { name: 'Why is this happening?' })
    ).toBeInTheDocument();
  });

  it('renders link damaged info if link is damaged', () => {
    renderWithLocalizationProvider(<ReportSignin linkDamaged />);
    testAllL10n(screen, bundle);

    expect(
      screen.getByRole('heading', { name: 'Link damaged' })
    ).toBeInTheDocument();

    expect(
      screen.getByRole('button', { name: 'Report activity' })
    ).not.toBeInTheDocument();

    expect(
      screen.getByRole('link', { name: 'Why is this happening?' })
    ).not.toBeInTheDocument();
  });

  it('emits the expected metrics on render', () => {
    renderWithLocalizationProvider(<ReportSignin />);
    expect(usePageViewEvent).toHaveBeenCalledWith(viewName, REACT_ENTRYPOINT);
  });
});
