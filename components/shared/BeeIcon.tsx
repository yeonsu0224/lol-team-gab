import Image from "next/image";

/** 꿀벌(기대 이상) 아이콘. 원본이 사각 jpg라 원형으로 잘라 쓴다. */
export function BeeIcon({ size = 18 }: { size?: number }) {
  return (
    <Image
      className="tg-bee-icon"
      src="/bee.jpg"
      alt=""
      width={size}
      height={size}
      style={{ width: size, height: size }}
    />
  );
}
