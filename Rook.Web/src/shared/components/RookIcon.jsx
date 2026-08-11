function RookIcon({ size = 20, color = 'currentColor' }) {
    return (
        <svg viewBox="0 0 24 24" width={size} height={size} fill={color}>
            <rect x="5" y="3" width="3" height="3" />
            <rect x="10.5" y="3" width="3" height="3" />
            <rect x="16" y="3" width="3" height="3" />
            <rect x="5" y="6" width="14" height="3" />
            <polygon points="8,9 16,9 18,17 6,17" />
            <rect x="4" y="17" width="16" height="3" rx="1" />
        </svg>
    );
}

export default RookIcon;