import type { Config } from "tailwindcss";

const config: Config = {
	darkMode: ["class"],
	content: [
		// "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
		// "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
		// "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
		'./pages/**/*.{ts,tsx}',
		'./components/**/*.{ts,tsx}',
		'./src/components/**/*.{js,ts,jsx,tsx,mdx}',
		'./app/**/*.{ts,tsx}',
		'./src/**/*.{ts,tsx}',
	],
	theme: {
    	extend: {
    		backgroundImage: {
    			'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
    			'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))'
    		},
    		borderRadius: {
    			lg: 'var(--radius)',
    			md: 'calc(var(--radius) - 2px)',
    			sm: 'calc(var(--radius) - 4px)'
    		},    		colors: {
    			background: 'hsl(var(--background))',
    			foreground: 'hsl(var(--foreground))',
    			card: {
    				DEFAULT: 'hsl(var(--card))',
    				foreground: 'hsl(var(--card-foreground))'
    			},
    			popover: {
    				DEFAULT: 'hsl(var(--popover))',
    				foreground: 'hsl(var(--popover-foreground))'
    			},
    			primary: {
    				DEFAULT: 'hsl(var(--primary))',
    				foreground: 'hsl(var(--primary-foreground))'
    			},
    			secondary: {
    				DEFAULT: 'hsl(var(--secondary))',
    				foreground: 'hsl(var(--secondary-foreground))'
    			},
    			muted: {
    				DEFAULT: 'hsl(var(--muted))',
    				foreground: 'hsl(var(--muted-foreground))'
    			},
    			accent: {
    				DEFAULT: 'hsl(var(--accent))',
    				foreground: 'hsl(var(--accent-foreground))'
    			},
    			destructive: {
    				DEFAULT: 'hsl(var(--destructive))',
    				foreground: 'hsl(var(--destructive-foreground))'
    			},
    			border: 'hsl(var(--border))',
    			input: 'hsl(var(--input))',
    			ring: 'hsl(var(--ring))',
    			chart: {
    				'1': 'hsl(var(--chart-1))',
    				'2': 'hsl(var(--chart-2))',
    				'3': 'hsl(var(--chart-3))',
    				'4': 'hsl(var(--chart-4))',
    				'5': 'hsl(var(--chart-5))'
    			},
    			sidebar: {
    				DEFAULT: 'hsl(var(--sidebar-background))',
    				foreground: 'hsl(var(--sidebar-foreground))',
    				primary: 'hsl(var(--sidebar-primary))',
    				'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
    				accent: 'hsl(var(--sidebar-accent))',
    				'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
    				border: 'hsl(var(--sidebar-border))',
    				ring: 'hsl(var(--sidebar-ring))'
    			},
    			// Colores específicos del tema Elena
    			elena: {
    				pink: {
    					50: '#fdf2f8',
    					100: '#fce7f3',
    					200: '#fbcfe8',
    					300: '#f9a8d4',
    					400: '#f472b6',
    					500: '#ec4899',
    					600: '#db2777',
    					700: '#be185d',
    					800: '#9d174d',
    					900: '#831843',
    				},
    				purple: {
    					50: '#faf5ff',
    					100: '#f3e8ff',
    					200: '#e9d5ff',
    					300: '#d8b4fe',
    					400: '#c084fc',
    					500: '#a855f7',
    					600: '#9333ea',
    					700: '#7c3aed',
    					800: '#6b21a8',
    					900: '#581c87',
    				},
    				orange: {
    					50: '#fff7ed',
    					100: '#ffedd5',
    					200: '#fed7aa',
    					300: '#fdba74',
    					400: '#fb923c',
    					500: '#f97316',
    					600: '#ea580c',
    					700: '#c2410c',
    					800: '#9a3412',
    					900: '#7c2d12',
    				}
    			},
			collapsible: {
				content: "pl-4 space-y-1",
				trigger: "w-full [&[data-state=open]>div>svg]:rotate-180",
			  }
    		},
    		keyframes: {
    			'accordion-down': {
    				from: {
    					height: '0'
    				},
    				to: {
    					height: 'var(--radix-accordion-content-height)'
    				}
    			},
    			'accordion-up': {
    				from: {
    					height: 'var(--radix-accordion-content-height)'
    				},
    				to: {
    					height: '0'
    				}
    			}
    		},
    		animation: {
    			'accordion-down': 'accordion-down 0.2s ease-out',
    			'accordion-up': 'accordion-up 0.2s ease-out'
    		}
    	}
    },
	plugins: [require("tailwindcss-animate")],
};
export default config;
