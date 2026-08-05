/**
 * Minimal inline icon set (no icon package installed). Each icon accepts
 * standard SVG props so callers can set size/className.
 */
import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

const base = {
  fill: "none",
  viewBox: "0 0 24 24",
  strokeWidth: 1.75,
  stroke: "currentColor",
} as const;

export function DashboardIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5h6v6.75h-6v-6.75ZM14.25 3.75h6v10.5h-6V3.75ZM3.75 3.75h6v6h-6v-6ZM14.25 17.25h6v3h-6v-3Z" />
    </svg>
  );
}

export function CasesIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 7.5h16.5M4.5 7.5v11.25a1.5 1.5 0 0 0 1.5 1.5h12a1.5 1.5 0 0 0 1.5-1.5V7.5M9 7.5V5.25a1.5 1.5 0 0 1 1.5-1.5h3a1.5 1.5 0 0 1 1.5 1.5V7.5" />
    </svg>
  );
}

export function ClientsIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.5v-1.5a4.5 4.5 0 0 0-4.5-4.5H6a4.5 4.5 0 0 0-4.5 4.5v1.5M8.25 9.75a3.375 3.375 0 1 0 0-6.75 3.375 3.375 0 0 0 0 6.75ZM17.25 19.5v-1.5a4.5 4.5 0 0 0-3-4.245M14.25 3.15a3.375 3.375 0 0 1 0 6.45" />
    </svg>
  );
}

export function DocumentsIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 3.75h4.629a1.5 1.5 0 0 1 1.06.44l3.622 3.62a1.5 1.5 0 0 1 .439 1.061V18a2.25 2.25 0 0 1-2.25 2.25H9A2.25 2.25 0 0 1 6.75 18V6A2.25 2.25 0 0 1 9 3.75ZM13.5 4.125V8.25h4.125M9.75 12.75h4.5M9.75 15.75h4.5" />
    </svg>
  );
}

export function AiReviewIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3 3 0 0 0-2.206-2.206L14.5 6.25l1.035-.259a3 3 0 0 0 2.206-2.206L18 2.75l.259 1.035a3 3 0 0 0 2.206 2.206L21.5 6.25l-1.035.259a3 3 0 0 0-2.206 2.206Z" />
    </svg>
  );
}

export function ReportsIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v18h16.5M8.25 16.5v-4.5M13 16.5V8.25M17.75 16.5v-7.5" />
    </svg>
  );
}

export function SettingsIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.6 6.6 0 0 1 0 .255c-.007.38.138.752.43.992l1.005.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.542-.56.94-1.11.94h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.65 6.65 0 0 1 0-.255c.007-.38-.138-.752-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.073-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.28ZM15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
    </svg>
  );
}

export function AdminIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3 4.5 6v6c0 4.556 3.187 8.16 7.5 9 4.313-.84 7.5-4.444 7.5-9V6L12 3ZM9.75 12l1.5 1.5 3-3.25" />
    </svg>
  );
}

export function ChevronDownIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
    </svg>
  );
}

export function ChevronRightIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
    </svg>
  );
}

export function BellIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.85 23.85 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
    </svg>
  );
}

export function SearchIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
    </svg>
  );
}

export function MenuIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5M3.75 17.25h16.5" />
    </svg>
  );
}

export function XIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
    </svg>
  );
}

export function FilterIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 0 1-.659 1.591l-5.432 5.432a2.25 2.25 0 0 0-.659 1.591v2.927a2.25 2.25 0 0 1-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 0 0-.659-1.591L3.659 7.409A2.25 2.25 0 0 1 3 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0 1 12 3Z" />
    </svg>
  );
}

export function InboxIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 9.776c0-.399.078-.794.23-1.163l1.902-4.61a2.25 2.25 0 0 1 2.08-1.393h8.076a2.25 2.25 0 0 1 2.08 1.393l1.902 4.61c.152.369.23.764.23 1.163V17.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V9.776Z M3.75 9.75h4.5c.34 0 .646.208.771.525l.44 1.1a.833.833 0 0 0 .772.525h4.534a.833.833 0 0 0 .772-.525l.44-1.1a.833.833 0 0 1 .771-.525h4.5" />
    </svg>
  );
}

export function AlertTriangleIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m0 3.75h.007M9.401 3.003c1.155-2 4.043-2 5.197 0l7.355 12.748c1.154 2-.29 4.5-2.599 4.5H4.645c-2.309 0-3.752-2.5-2.598-4.5L9.4 3.003Z" />
    </svg>
  );
}

export function SunIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25M12 18.75V21M4.219 4.219l1.591 1.591M18.19 18.19l1.591 1.591M3 12h2.25M18.75 12H21M4.219 19.781l1.591-1.591M18.19 5.81l1.591-1.591M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z" />
    </svg>
  );
}

export function MoonIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9-5.998Z" />
    </svg>
  );
}
