import React from 'react'
import Prism from '../components/prisma'

const layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', zIndex: 1 }}>
      <Prism
        animationType="hover"
        timeScale={0.1}
        height={3.5}
        baseWidth={5.5}
        scale={3.6}
        hueShift={0}
        colorFrequency={1}
        noise={0.5}
        glow={1}
      >
        {children}
      </Prism>
    </div >
  )
}

export default layout