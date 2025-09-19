import React from 'react'

const layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="flex flex-col min-h-screen font-sans text-[var(--app-foreground)] mini-app-theme from-[var(--app-background)] to-[var(--app-gray)] bg-events-background">

      <div className="w-full max-w-md mx-auto p-0 ">
        <header className="flex justify-between items-center mb-0 h-0">
          <div>
            <div className="flex items-center space-x-2">
              {/* Wallet connect moved to StreamHeader */}
            </div>
          </div>
          {/* <div>{saveFrameButton}</div> */}
        </header>

        <main className="flex-1">
          {children}
        </main>
      </div>
    </div>
  )
}

export default layout