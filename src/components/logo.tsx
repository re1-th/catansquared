/** The Catan² mark: a brick hex with a C, squared by a small wheat hex. Colours are fixed brand colours, not theme tokens. */
export function Logo({ size = 30 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="96 78 852 878" aria-hidden>
      <polygon points="430,199 754,386 754,760 430,947 106,760 106,386" fill="#c5582f" />
      <polygon points="819,87 939,156 939,295 819,363 699,295 699,156" fill="#e8b834" />
      <text x="430" y="710" textAnchor="middle" fontFamily="Georgia, 'Times New Roman', serif" fontWeight="700" fontSize="380" fill="#fff">
        C
      </text>
      <text x="819" y="298" textAnchor="middle" fontFamily="Georgia, 'Times New Roman', serif" fontWeight="700" fontSize="200" fill="#2c2420">
        2
      </text>
    </svg>
  );
}
