/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: false, // or 'media' or 'class'
  theme: {
    colors: {
      'black': "#000",
      'off-black': "#0b0b0b",
      'white': "#FFF",
      'yellow': '#FCD12A',
      'blue': '#000f62',
      'body': '#ff8e00',
      'body-alt': '#33ff66',
      'text-dos': '#00FF00',
      'chat-local': '#00ffd9',
      'chat-world': '#FEC1C0',
      'chat-error': '#FF4700',
      'base-primary': '#9e9382',
      'base-secondary': '#887c69',
      'button-primary': '#C3C7CB',
      'button-secondary': '#c3c7cb',
      'background-primary': '#0072dd',
      'background-secondary': '#03b7ed',
      'background-tertiary': '#06dc38',
      'background-tertiary-half': '#06dc3850',

      key: {
        black: {
          lighter: '#111210',
          darker: '#0d0e0d'
        },
        yellow: {
          inactive: '#fee37350',
          active: '#fee373'
        },
        green: {
          inactive: '#39ce9150',
          active: '#39ce91'
        },
        red: {
          inactive: '#ff8f6750',
          active: '#ff8f67'
        },
        blue: {
          inactive: '#4cebde50',
          active: '#4cebde'
        }
      },

      validation: {
        success: "#5DCE71",
        processing: "#EDA44D",
        error: "#ED4D4D",
      },
    },
    fontFamily: {
      'dos': 'PerfectDOSVGA437',
      'wrongun': 'WRONGUN',
      'creep': 'creep',
    },
    fontSize: {
      "2xs": "1rem",
      xs: "1.1rem",
      sm: "1.3rem",
      md: "1.4rem",
      base: "1.6rem",
      lg: "1.8rem",
      xl: "2rem",
      "2xl": "2.4rem",
      "3xl": "2.8rem",
      "4xl": "3.2rem",
      "5xl": "3.6rem",
      "6xl": "4rem",
      "7xl": ["5.6rem", { lineHeight: 1 }],
      "8xl": ["6.4rem", { lineHeight: 1 }],
      "9xl": ["7.2rem", { lineHeight: 1 }],
    },
    spacing: {
      unset: 'unset',
      px: "1px",
      rem: "1rem",
      0: "0px",
      1: "0.4rem",
      2: "0.8rem",
      3: "1.2rem",
      4: "1.6rem",
      5: "2.4rem",
      6: "2.8rem",
      7: "3.2rem",
      8: "3.6rem",
      9: "4.8rem",
      10: "5.6rem",
      11: "6.4rem",
      12: "7.2rem",
      13: "8rem",
      14: "9.6rem",
      15: "11.2rem",
      16: "12.8rem",
      17: "25.6rem",
      18: "32rem",
      row: "var(--row-space)",
      page: "var(--page-space)",
      "1/2": "50vw"
    },
    extend: {
      minWidth: ({ theme }) => theme("spacing"),
      minHeight: ({ theme }) => theme("spacing"),
      zIndex: {
        '1': '1',
      }
    },
  },
}
