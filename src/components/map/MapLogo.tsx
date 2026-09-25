// Bottom-left brand plate (same slot and size as the czynaczas logo control).
export const MapLogo = ({ bottom }: { bottom: number }) => (
    <div className="mapgl-bottom-left czynaczas-logo-control">
        <div className="mapgl-control mapgl-bar mapgl-controls" style={{ display: "block", bottom, border: 0 }}>
            <svg width="92" height="30" viewBox="0 0 92 30" role="img" aria-label="Czynalive Logo" style={{ opacity: 0.7, display: "block" }}>
                <rect x="1" y="1" width="90" height="28" rx="8" fill="#ffffff" stroke="#29a847" strokeWidth="1.5" />
                <g transform="translate(6 6) scale(0.28)">
                    <rect width="64" height="64" rx="14" fill="#29a847" />
                    <path
                        d="M18 14h28a6 6 0 0 1 6 6v22a4 4 0 0 1-4 4h-2v4a2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2v-4H24v4a2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2v-4h-2a4 4 0 0 1-4-4V20a6 6 0 0 1 6-6zm0 8v10h28V22zm2 16a3 3 0 1 0 0 .1zm24 0a3 3 0 1 0 0 .1z"
                        fill="#fff"
                    />
                </g>
                <text x="27" y="20" fontFamily="Roboto, Arial, sans-serif" fontSize="13" fontWeight="700" fontStyle="italic" fill="#29a847">
                    czynalive
                </text>
            </svg>
        </div>
    </div>
);
