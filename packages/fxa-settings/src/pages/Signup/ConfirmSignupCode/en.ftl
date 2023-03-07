## ConfirmSignupCode page
## Users see this page after they have initiated account sign up,
# and a confirmation code has been sent to their email address.

# Page title show in browser title bar or page tab
confirm-signup-code-page-title = Enter confirmation code

# String within the <span> element appears on a separate line
# If more appropriate in a locale, the string within the <span>, "for your { -product-firefox-account }"
# can stand alone as "{ -product-firefox-account }"
confirm-signup-code-heading = Enter confirmation code <span>for your { -product-firefox-account }</span>
# { $email } represents the email that the user entered to sign in
confirm-signup-code-instruction = Enter the code that was sent to { $email } within 5 minutes.
confirm-signup-code-input-label = Enter 6-digit code
# Form button to confirm if the confirmation code entered by the user is valid
confirm-signup-code-confirm-button = Confirm
confirm-signup-code-code-expired = Code expired?
# Link to resend a new code to the user's email.
confirm-signup-code-resend-code-link = Email new code.
confirm-signup-code-success-alert = Account confirmed successfully
# Message displayed in a banner after the user requested to receive a new confirmation code.
# Variable $accountsEmail is the email addressed used to send accounts related emails to users.
confirm-signup-code-resend-code-success-message = Email resent. Add { $accountsEmail } to your contacts to ensure a smooth delivery.
# Error message displayed in an error banner. This is a general message when the cause of the error is unclear.
confirm-signup-code-error-message = Something went wrong. A new code could not be sent.
# Error displayed in tooltip.
confirm-signup-code-is-required-error = Confirmation code is required