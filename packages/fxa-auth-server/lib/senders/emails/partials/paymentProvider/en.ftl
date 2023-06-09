# After the colon is how the user paid, e.g. PayPal or credit card
payment-method = Payment Method:
payment-provider-paypal-plaintext = { payment-method } { -brand-paypal }
# Variables:
#  $cardType (String) - The type of the credit card, all lowercase, e.g. amex
#  $cardName (String) - The brand name of the credit card, e.g. American Express
#  $lastFour (String) - The last four digits of the credit card, e.g. 5309
card-ending-in = { $cardType } card ending in { $lastFour }
cc-card-ending-in = { $cardName } card ending in { $lastFour }
unknown-card-ending-in = Unknown card ending in { $lastFour }
