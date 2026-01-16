/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: ['class'],
    content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
  	extend: {
  		fontFamily: {
  			sans: ['Inter', 'sans-serif'],
  			inter: ['Inter', 'sans-serif'],
  		},
  		backgroundImage: {
  			'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
  			'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))'
  		},
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		},
  		colors: {
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
  			// TTT POS Custom Status Colors
  			success: 'hsl(var(--success))',
  			processing: 'hsl(var(--processing))',
  			active: 'hsl(var(--active))',
  			draft: 'hsl(var(--draft))',
  			warning: 'hsl(var(--warning))',
  						// Text Colors
			'text-primary': 'hsl(var(--text-primary))',
			'text-secondary': 'hsl(var(--text-secondary))',
			'text-muted': 'hsl(var(--text-muted))',
			// Button Colors
			'button-default': 'hsl(var(--button-default))',
			'button-hover': 'hsl(var(--button-hover))',
			// Input Colors
			'input-bg': 'hsl(var(--input-bg))',
			'input-text': 'hsl(var(--input-text))',
			// Status Colors
			'success-light': 'hsl(var(--success-light))',
			'success-bg': 'hsl(var(--success-bg))',
			'error-light': 'hsl(var(--error-light))',
			'error-bg': 'hsl(var(--error-bg))',
			'info-light': 'hsl(var(--info-light))',
			'info-bg': 'hsl(var(--info-bg))',
			'warning-light': 'hsl(var(--warning-light))',
			'warning-bg': 'hsl(var(--warning-bg))',
			'neutral-light': 'hsl(var(--neutral-light))',
			'neutral-bg': 'hsl(var(--neutral-bg))',
			chart: {
				'1': 'hsl(var(--chart-1))',
				'2': 'hsl(var(--chart-2))',
				'3': 'hsl(var(--chart-3))',
				'4': 'hsl(var(--chart-4))',
				'5': 'hsl(var(--chart-5))'
			}
  		}
  	}
  },
  plugins: [require("tailwindcss-animate")],
}
