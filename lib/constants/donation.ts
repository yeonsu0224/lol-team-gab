export const DONATION = {
  bank: process.env.NEXT_PUBLIC_DONATION_BANK?.trim() || "후원 계좌 준비 중",
  account: process.env.NEXT_PUBLIC_DONATION_ACCOUNT?.trim() || "",
  link: process.env.NEXT_PUBLIC_DONATION_LINK?.trim() || "",
} as const;
