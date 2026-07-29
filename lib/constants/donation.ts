export interface DonationBankInfo {
  bank: string;
  account: string;
  holder: string;
}

export interface DonationLink {
  label: string;
  url: string;
}

/**
 * Developer support info (spec F-11). Placeholder values — replace with real
 * account/links before release. Kept as constants so no code change is needed.
 */
export const DONATION_BANK: DonationBankInfo = {
  bank: "카카오뱅크",
  account: "3333-00-0000000",
  holder: "팀갭 개발자",
};

export const DONATION_LINKS: DonationLink[] = [
  { label: "토스로 후원하기", url: "https://toss.me/" },
  { label: "카카오페이 송금", url: "https://qr.kakaopay.com/" },
];

export const DONATION_MESSAGE =
  "팀갭은 무료입니다. 도움이 되었다면 개발자에게 커피 한 잔 사주세요 ☕";
