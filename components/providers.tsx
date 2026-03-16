'use client'

import { ThemeProvider } from 'next-themes'
import { Toaster } from 'sileo'
import type { ReactNode } from 'react'

interface ProvidersProps {
    children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
    return (
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            <Toaster position="top-right" />
            {children}
        </ThemeProvider>
    )
}
