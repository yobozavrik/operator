/**
 * UX Design System Tokens
 * Based on provided Figma-style wireframes and UX specs.
 */

export const UI_TOKENS = {
    colors: {
        background: '#0E1117',
        panel: '#0F1622',
        border: '#1F2630',
        text: {
            primary: '#E6EDF3',
            muted: '#8B949E',
        },
        priority: {
            critical: '#E5534B',
            high: '#F6C343',
            reserve: '#58A6FF',
            normal: '#3FB950',
        }
    },
    radius: {
        panel: '12px',
        component: '8px',
    },
    typography: {
        headingXL: '24px',
        headingL: '18px',
        body: '13px', // Average of 12-14px
        label: '11px', // Average of 10-12px
    }
} as const;
