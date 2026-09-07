import type { Config } from "tailwindcss";

const config: Config = {
    darkMode: ["class"],
    content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
  	extend: {
  		fontFamily: {
  			sans: ['var(--font-geist-sans)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
  			mono: ['var(--font-geist-mono)', 'ui-monospace', 'monospace'],
  		},
  		letterSpacing: {
  			// Display type is set tight, as in the brand kit's type scale.
  			tightest: '-0.045em',
  			display: '-0.035em',
  			// Mono labels are set wide and uppercase.
  			label: '0.10em',
  		},
  		colors: {
  			// IdeaBoard's signature: a deeper, bluer indigo-violet than the
  			// kmab purple it takes its cue from.
  			brand: {
  				50: '#F2EFFF',
  				100: '#E6E0FF',
  				200: '#CFC3FF',
  				300: '#B29FFF',
  				400: '#9375FF',
  				500: '#6D4AFF',
  				600: '#5A35E8',
  				700: '#4726BC',
  				800: '#361E90',
  				900: '#261566',
  			},
  			// Brand-kit green, used for affirmative signals and board links.
  			signal: {
  				50: '#EFFDF6',
  				100: '#DCF9EA',
  				200: '#B9F4D5',
  				300: '#92EEBD',
  				400: '#68E7A4',
  				500: '#3DE08A',
  				600: '#34C177',
  				700: '#2B9D61',
  				800: '#21794B',
  				900: '#175534',
  			},
  			// Brand-kit amber, used for warnings and technical notes.
  			highlight: {
  				50: '#FEFAF1',
  				100: '#FDF4E0',
  				200: '#FBEAC0',
  				300: '#F9DE9E',
  				400: '#F7D177',
  				500: '#F5C451',
  				600: '#D3A946',
  				700: '#AC8939',
  				800: '#846A2C',
  				900: '#5D4A1F',
  			},
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
  			}
  		},
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		}
  	}
  },
  plugins: [require("tailwindcss-animate")],
};
export default config;
