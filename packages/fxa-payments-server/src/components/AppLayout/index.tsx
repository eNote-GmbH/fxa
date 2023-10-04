import React, { ReactNode, useEffect, useContext, useState } from 'react';
import { AppContext } from '../../lib/AppContext';
import { Localized } from '@fluent/react';
import classNames from 'classnames';

import './index.scss';

export type AppLayoutProps = {
  children: ReactNode;
};

export const AppLayout = ({ children }: AppLayoutProps) => {
  return (
    <>
      <div
        id="stage"
        data-testid="stage"
        className="fade-in-forward"
        style={{ opacity: 1 }}
      >
        {children}
      </div>
    </>
  );
};

export const SignInLayoutContext = React.createContext({
  setHideLogo: (hideLogo: boolean) => {},
});

export const SignInLayout = ({ children }: { children: ReactNode }) => {
  const [hideLogo, setHideLogo] = useState(false);
  const mainContentClassNames = classNames('payments-card', {
    'hide-logo': hideLogo,
  });
  return (
    <AppLayout>
      <SignInLayoutContext.Provider value={{ setHideLogo }}>
        <div className="sign-in">
          <div className={mainContentClassNames}>{children}</div>
        </div>
      </SignInLayoutContext.Provider>
    </AppLayout>
  );
};

export const SettingsLayout = ({ children }: { children: ReactNode }) => {
  useEffect(() => {
    document.body.classList.add('settings');
    return () => document.body.classList.remove('settings');
  }, [children]);

  const { config } = useContext(AppContext);
  const homeURL = `${config.servers.content.url}/settings`;
  let breadcrumbs = (
    <nav aria-label="breadcrumbs" data-testid="breadcrumbs" className="w-full">
      <ol className="breadcrumbs">
        <li>
          <Localized id="settings-home">
            <a href={homeURL}>Account Home</a>
          </Localized>
        </li>
        <li>
          <Localized id="settings-subscriptions-title">
            <a href="/subscriptions" aria-current="location">
              Subscriptions
            </a>
          </Localized>
        </li>
      </ol>
    </nav>
  );

  return (
    <AppLayout>
      <div className="settings">
        <div id="fxa-settings-header-wrapper">
          <header id="fxa-settings-header">
            <h1 id="fxa-manage-account">
              <Localized id="project-brand-2">
                <span className="fxa-account-title">Firefox accounts</span>
              </Localized>
            </h1>
            {/*
              * TODO: We can't actually sign out of FxA from here. Maybe back to settings?
              <button id="signout" className="settings-button secondary-button">Sign out</button>
              */}
          </header>
          {breadcrumbs}
        </div>

        <div id="fxa-settings" className="mb-12">
          <div id="fxa-settings-content">{children}</div>
        </div>
      </div>
    </AppLayout>
  );
};

export default AppLayout;
