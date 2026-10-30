import type { SVGAttributes } from 'react';

export default function AppLogoIcon(props: SVGAttributes<SVGElement>) {
    return (
        <svg
            viewBox="0 0 100 100"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={`text-primary ${props.className || ''}`}
            {...props}
        >
            <rect width="100" height="100" rx="28" fill="currentColor" />
            <path
                d="M50 20C33.431 20 20 32.536 20 48C20 54.12 22.128 59.78 25.794 64.39L22 78L36.315 74.346C40.407 76.685 45.074 78 50 78C66.569 78 80 65.464 80 50C80 34.536 66.569 20 50 20Z"
                fill="white"
            />
            <circle cx="37" cy="49" r="4.5" fill="currentColor" />
            <circle cx="50" cy="49" r="4.5" fill="currentColor" />
            <circle cx="63" cy="49" r="4.5" fill="currentColor" />
        </svg>
    );
}
