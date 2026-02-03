/**
 * UX Design System Tokens
 * Based on provided Figma-style wireframes and UX specs.
 */

export const UI_TOKENS = {
    colors: {
        background: '#050B09', // Deep Forest Black
        panel: '#0F1F19',      // Dark Emerald
        border: '#1D332B',     // Jungle Green
        text: {
            primary: '#ECFDF5', // Mint Ice
            muted: '#6E8C83',   // Sage Grey
        },
        priority: {
            critical: '#F87171', // Soft Red
            high: '#FBBF24',     // Warm Amber
            reserve: '#A78BFA',  // Lavender (New "Recommended" color)
            normal: '#34D399',   // Bright Mint
        },
        brand: {
            primary: '#34D399',  // Mint
            secondary: '#A78BFA' // Lavender
        }
    },
    radius: {
        panel: '16px', // Slightly more rounded for organic feel
        component: '10px',
    },
    typography: {
        headingXL: '26px',
        headingL: '20px',
        body: '13px',
        label: '11px',
    }
} as const;
