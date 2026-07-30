export const DONATION = {
  account: process.env.NEXT_PUBLIC_DONATION_ACCOUNT?.trim() || "",
  holder: process.env.NEXT_PUBLIC_DONATION_HOLDER?.trim() || "",
  /** 토스 송금 QR. 이미지만 바꾸면 교체된다. */
  qrImage: "/tossQR.png",
  qrLabel: "토스 송금 QR 코드",
};
