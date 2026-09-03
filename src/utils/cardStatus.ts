export type CardStatus = 'discontinued' | 'invite_only' | 'lifetime_free' | null;

export function getCardStatus(card: any): CardStatus {
  if (!card?.sourceable) {
    return 'discontinued';
  } else if (card?.invite_only) {
    return 'invite_only';
  } else if (
    (card?.annual_fee_text == '0' || card?.annual_fee_text == 0) &&
    (card?.joining_fees == '0' || card?.joining_fees == 0 ||
      card?.joining_fee_text == '0' || card?.joining_fee_text == 0)
  ) {
    return 'lifetime_free';
  }
  return null;
}

export function canApply(card: any): boolean {
  const status = getCardStatus(card);
  return status !== 'discontinued' && status !== 'invite_only';
}
