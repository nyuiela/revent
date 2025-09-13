import React from 'react'

const layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <html className='bg-events-background'>
      <body> {children} </body>
    </html>
    // <div style={{ width: '100%', height: '100%', position: 'relative', zIndex: 1 }} className='bg-background'>
    //   {/* <Prism
    //     animationType="hover"
    //     timeScale={0.1}
    //     height={3.5}
    //     baseWidth={5.5}
    //     scale={3.6}
    //     hueShift={0}
    //     colorFrequency={1}
    //     noise={0.5}
    //     glow={1}
    //   > */}

    //   {/* <Aurora
    //     colorStops={["#3A29FF", "#FF94B4", "#FF3232"]}
    //     blend={0}
    //     amplitude={1.0}
    //     speed={0.2}
    //   > */}
    //   {children}
    //   {/* </Aurora> */}
    //   {/* </Prism> */}
    // </div >
  )
}

export default layout