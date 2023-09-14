postChangeAccountRecovery-email-subject = Account recovery key changed
postChangeAccountRecovery-email-title = You changed your account recovery key
postChangeAccountRecovery-email-body-part1 = You now have a new account recovery key. Your previous key was deleted.
postChangeAccountRecovery-email-body-part2 = Save this new key in a safe place — you’ll need it to restore your encrypted browsing data if you forget your password.
# Provides information about the origin of the account recovery key change and actions to take if the request was not legitimate.
# Variable:
#   $uaBrowser (String) - The user agent's browser (e.g., Firefox Nightly)
#   $uaOS (String) - the user agent's operating system (e.g., Mac OSX)
#   $uaOSVersion (String) - the user agent's operating system version (e.g., 10.5)
postChangeAccountRecovery-email-body-part3 = This request came from { $uaBrowser } on { $uaOS } { $uaOSVersion }. If this wasn’t you,
  <a data-l10n-name="revokeAccountRecoveryLink">delete the new key</a> and <a data-l10n-name="passwordChangeLink">change your password</a>. For more info, visit <a data-l10n-name="supportLink">{ -brand-mozilla } Support</a>.
postChangeAccountRecovery-email-action-button = Manage account
