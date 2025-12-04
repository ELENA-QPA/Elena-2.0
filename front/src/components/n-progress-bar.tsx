'use client';

import { AppProgressBar as ProgressBar } from 'next-nprogress-bar';
import { Suspense } from 'react';

const NProgressBar = ({ children }: { children: React.ReactNode }) => {
    return (
        <>
            {children}
            <Suspense>
                <ProgressBar
                    height="5px"
                    color='#4536AC'
                    options={{ showSpinner: false }}
                    shallowRouting
                />
            </Suspense>

        </>
    );
};

export default NProgressBar;