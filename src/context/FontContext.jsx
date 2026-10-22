import { createContext, useContext, useEffect, useState } from 'react'

export const FONT_FAMILIES = [
  { key: 'system', name: 'System', css: "system-ui, -apple-system, 'Segoe UI', sans-serif" },
  { key: 'inter', name: 'Inter', css: "'Inter', system-ui, sans-serif" },
  { key: 'poppins', name: 'Poppins', css: "'Poppins', sans-serif" },
  { key: 'roboto', name: 'Roboto', css: "'Roboto', sans-serif" },
  { key: 'montserrat', name: 'Montserrat', css: "'Montserrat', sans-serif" },
  { key: 'jetbrains', name: 'JetBrains Mono', css: "'JetBrains Mono', monospace" },
  { key: 'comic', name: 'Comic Sans', css: "'Comic Sans MS', cursive, sans-serif" },
  { key: 'castella', name: 'Castella', css: "'Castella', 'Georgia', serif" }
]

const FontContext = createContext(null)

export function FontProvider({ children }) {
  const [fontKey, setFontKey] = useState(() => localStorage.getItem('ourchat-font') || 'system')
  const [fontWeight, setFontWeight] = useState(() => localStorage.getItem('ourchat-font-weight') || 'normal')
  const [fontStyle, setFontStyle] = useState(() => localStorage.getItem('ourchat-font-style') || 'normal')
  const [fontSize, setFontSize] = useState(() => Number(localStorage.getItem('ourchat-font-size') || 15))

  const family = FONT_FAMILIES.find(f => f.key === fontKey)?.css || FONT_FAMILIES[0].css

  useEffect(() => {
    const root = document.documentElement
    root.style.setProperty('--font-family', family)
    root.style.setProperty('--font-weight', fontWeight)
    root.style.setProperty('--font-style', fontStyle)
    root.style.setProperty('--font-size', `${fontSize}px`)
    document.body.style.fontFamily = family
    document.body.style.fontWeight = fontWeight
    document.body.style.fontStyle = fontStyle
    document.body.style.fontSize = `${fontSize}px`
  }, [family, fontWeight, fontStyle, fontSize])

  const setFont = (key) => { setFontKey(key); localStorage.setItem('ourchat-font', key) }
  const setWeight = (w) => { setFontWeight(w); localStorage.setItem('ourchat-font-weight', w) }
  const setStyle = (s) => { setFontStyle(s); localStorage.setItem('ourchat-font-style', s) }
  const setSize = (n) => { setFontSize(n); localStorage.setItem('ourchat-font-size', n) }

  return (
    <FontContext.Provider value={{ fontKey, setFont, families: FONT_FAMILIES, fontWeight, setWeight, fontStyle, setStyle, fontSize, setSize }}>
      {children}
    </FontContext.Provider>
  )
}

export function useFont() {
  return useContext(FontContext)
}
