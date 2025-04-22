const { nextui, commonColors } = require("@nextui-org/theme");

export const sizes = {
	jsonSeaRecommendedWidth: 1024,

	// Node
	nodeMinWidth: 220, // Excepted array node.
	nodeMaxWidth: 440,
	arrayNodeSize: 64,
	nodeGap: 100,
	nodeContentHeight: 40,
	nodePadding: 12,

	// Node Detail Panel
	nodeDetailPanelWidth: 420,
};

/** @type {import('tailwindcss').Config} */
module.exports = {
	content: [
		"./src/**/*.{js,ts,jsx,tsx,mdx}",
		"./node_modules/@nextui-org/theme/dist/components/(button|chip|card|navbar|toggle|tooltip|modal|input|circular-progress|table|image|link).js",
	],
	prefix: "",
	safelist: [
		"hidden",
		"invisible",
		"text-hl-key",
		"text-hl-string",
		"text-hl-number",
		"text-hl-boolean",
		"text-hl-null",
		"text-hl-empty",
	],
	theme: {
		container: {
			center: true,
			padding: "2rem",
			screens: {
				"2xl": "1400px",
			},
		},
		extend: {
			spacing: {
				"page-header": "var(--max-header-width)",
				search: "var(--search-width)",
				"search-h": "var(--search-height)",
				header: "var(--container-height)",
				statusbar: "var(--statusbar-height)",
				"max-key": "var(--max-key-length)",
			},
			backgroundColor: {
				"hl-key": "var(--bg-key)",
				"btn-active": "var(--btn-bg-active)",
			},
			colors: {
				"hl-key": "var(--hl-key)",
				"hl-string": "var(--hl-string)",
				"hl-number": "var(--hl-number)",
				"hl-boolean": "var(--hl-null)",
				"hl-null": "var(--hl-null)",
				"hl-empty": "var(--hl-empty)",
				"hl-index": "var(--hl-index)",
				"btn-input": "var(--btn-input)",
				error: "var(--parse-error)",
				"error-foreground": "var(--parse-error-foreground)",
				btn: "var(--btn-text-color)",
				input: "hsl(var(--input))",
				ring: "hsl(var(--ring))",
				background: "hsl(var(--background))",
				foreground: "hsl(var(--foreground))",
				primary: {
					DEFAULT: "hsl(var(--primary))",
					foreground: "hsl(var(--primary-foreground))",
				},
				secondary: {
					DEFAULT: "hsl(var(--secondary))",
					foreground: "hsl(var(--secondary-foreground))",
				},
				destructive: {
					DEFAULT: "hsl(var(--destructive))",
					foreground: "hsl(var(--destructive-foreground))",
				},
				muted: {
					DEFAULT: "hsl(var(--muted))",
					foreground: "hsl(var(--muted-foreground))",
				},
				accent: {
					DEFAULT: "hsl(var(--accent))",
					foreground: "hsl(var(--accent-foreground))",
				},
				popover: {
					DEFAULT: "hsl(var(--popover))",
					foreground: "hsl(var(--popover-foreground))",
				},
				card: {
					DEFAULT: "hsl(var(--card))",
					foreground: "hsl(var(--card-foreground))",
				},
			},
			borderRadius: {
				lg: "var(--radius)",
				md: "calc(var(--radius) - 2px)",
				sm: "calc(var(--radius) - 4px)",
			},
			boxShadow: {
				search:
					"0 0 0 1px hsla(0, 0%, 0%, 0.1),0 4px 11px hsla(0, 0%, 0%, 0.1)",
			},
			keyframes: {
				"accordion-down": {
					from: { height: "0" },
					to: { height: "var(--radix-accordion-content-height)" },
				},
				"accordion-up": {
					from: { height: "var(--radix-accordion-content-height)" },
					to: { height: "0" },
				},
			},
			animation: {
				"accordion-down": "accordion-down 0.2s ease-out",
				"accordion-up": "accordion-up 0.2s ease-out",
			},

			padding: {
				nodePadding: sizes.nodePadding,
			},
			height: {
				nodeContentHeight: sizes.nodeContentHeight,
			},
			minWidth: {
				arrayNodeSize: sizes.arrayNodeSize,
				nodeMinWidth: sizes.nodeMinWidth,
				nodeDetailPanelWidth: sizes.nodeDetailPanelWidth,
			},
			maxWidth: {
				arrayNodeSize: sizes.arrayNodeSize,
				nodeMaxWidth: sizes.nodeMaxWidth,
				nodeDetailPanelWidth: sizes.nodeDetailPanelWidth,
			},
			minHeight: {
				arrayNodeSize: sizes.arrayNodeSize,
			},
			maxHeight: {
				arrayNodeSize: sizes.arrayNodeSize,
			},
		},
	},
	darkMode: "class",
	plugins: [
		require("tailwindcss-animate"),
		require("tailwind-scrollbar")({
			nocompatible: true,
			preferredStrategy: "pseudoelements",
		}),

		nextui({
			addCommonColors: true, // override common colors (e.g. "blue", "green", "pink").
			defaultTheme: "light", // default theme from the themes object
			defaultExtendTheme: "light", // default theme to extend on custom themes
			layout: {}, // common layout tokens (applied to all themes)
			themes: {
				light: {
					layout: {},
					colors: {
						border: "rgba(0, 0, 0, 0.15)",
						backgroundAlpha: "rgba(255, 255, 255, 0.8)",
						backgroundContrast: "#ffffff",
						titleJson: "#00254D", // 'JSON' of 'JSON SEA'
						titleSea: "#4C76A5", // 'SEA' of 'JSON SEA'
					},
				},
				dark: {
					layout: {},
					colors: {
						border: "rgba(255, 255, 255, 0.15)",
						backgroundAlpha: "rgba(0, 0, 0, 0.6)",
						backgroundContrast: "#16181A",
						titleJson: commonColors.zinc[100], // 'JSON' of 'JSON SEA'
						titleSea: commonColors.zinc[100], // 'SEA' of 'JSON SEA'
					},
				},
			},
		}),
	],
};
