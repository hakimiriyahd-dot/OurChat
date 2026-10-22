import { createContext, useContext, useEffect, useState } from 'react'

const PRESETS = {
  light: {
    name: 'WhatsApp Light',
    colors: {
      background: '#FFFFFF',
      sidebar: '#F0F2F5',
      chatBg: '#E5DDD5',
      bubbleMe: '#DCF8C6',
      bubbleOther: '#FFFFFF',
      text: '#111B21',
      textSecondary: '#667781',
      accent: '#128C7E',
      header: '#075E54'
    }
  },
  dark: {
    name: 'WhatsApp Dark',
    colors: {
      background: '#111B21',
      sidebar: '#202C33',
      chatBg: '#0B141A',
      bubbleMe: '#005C4B',
      bubbleOther: '#202C33',
      text: '#E9EDEF',
      textSecondary: '#8696A0',
      accent: '#00A884',
      header: '#202C33'
    }
  },
  midnight: {
    name: 'Midnight Black',
    colors: {
      background: '#000000',
      sidebar: '#121212',
      chatBg: '#000000',
      bubbleMe: '#1F6F5E',
      bubbleOther: '#1A1A1A',
      text: '#F2F2F2',
      textSecondary: '#888888',
      accent: '#25D366',
      header: '#0A0A0A'
    }
  },
  ocean: {
    name: 'Ocean Blue',
    colors: {
      background: '#0A192F',
      sidebar: '#112240',
      chatBg: '#0A192F',
      bubbleMe: '#1D4ED8',
      bubbleOther: '#1E3A5F',
      text: '#E0F2FE',
      textSecondary: '#93C5FD',
      accent: '#38BDF8',
      header: '#0C2B4E'
    }
  },
  forest: {
    name: 'Forest Green',
    colors: {
      background: '#1A2E1A',
      sidebar: '#2D4A2B',
      chatBg: '#1A2E1A',
      bubbleMe: '#2E7D32',
      bubbleOther: '#2D4A2B',
      text: '#E8F5E9',
      textSecondary: '#A5D6A7',
      accent: '#66BB6A',
      header: '#1F3B1E'
    }
  },
  sunset: {
    name: 'Sunset Orange',
    colors: {
      background: '#2D1B0E',
      sidebar: '#4A2C17',
      chatBg: '#2D1B0E',
      bubbleMe: '#EA580C',
      bubbleOther: '#4A2C17',
      text: '#FED7AA',
      textSecondary: '#FDBA74',
      accent: '#FB923C',
      header: '#3B2417'
    }
  }
}

const ThemeContext = createContext(null)

function applyTheme(colors) {
  const root = document.documentElement
  root.style.setProperty('--bg-primary', colors.background)
  root.style.setProperty('--bg-secondary', colors.sidebar)
  root.style.setProperty('--bg-chat', colors.chatBg)
  root.style.setProperty('--bubble-me', colors.bubbleMe)
  root.style.setProperty('--bubble-other', colors.bubbleOther)
  root.style.setProperty('--text-primary', colors.text)
  root.style.setProperty('--text-secondary', colors.textSecondary || '#667781')
  root.style.setProperty('--accent', colors.accent)
  root.style.setProperty('--header', colors.header)
}

export function ThemeProvider({ children }) {
  const [themeKey, setThemeKey] = useState(() => localStorage.getItem('ourchat-theme') || 'light')
  const [customColors, setCustomColors] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('ourchat-theme-custom') || 'null')
    } catch { return null }
  })

  const colors = themeKey === 'custom' && customColors ? customColors : PRESETS[themeKey]?.colors || PRESETS.light.colors

  useEffect(() => {
    applyTheme(colors)
  }, [colors])

  const setTheme = (key) => {
    setThemeKey(key)
    localStorage.setItem('ourchat-theme', key)
  }

  const setCustom = (patch) => {
    const next = { ...(customColors || PRESETS.light.colors), ...patch }
    setCustomColors(next)
    localStorage.setItem('ourchat-theme-custom', JSON.stringify(next))
    setTheme('custom')
  }

  return (
    <ThemeContext.Provider value={{ themeKey, setTheme, colors, presets: PRESETS, customColors, setCustom }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  return useContext(ThemeContext)
}

export { PRESETS }
