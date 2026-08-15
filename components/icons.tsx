import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

function base(props: IconProps) {
  return {
    width: 24,
    height: 24,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    ...props,
  };
}

export function IconHome(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M4 11.2 12 4l8 7.2" />
      <path d="M6.5 10.5V20h11v-9.5" />
      <path d="M10 20v-5h4v5" />
    </svg>
  );
}

export function IconCloset(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M4 5.5 7.5 3h9L20 5.5" />
      <path d="M4 5.5h16v4H4z" />
      <path d="M5.5 9.5 4 20h16l-1.5-10.5" />
      <path d="M9 9.5V14M15 9.5V14" />
      <path d="M9 17h6" />
    </svg>
  );
}

export function IconDress(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M8 3.5 6.5 6.5 4 5.5 5 12l3.5-1.5V20h7v-9.5L19 12l1-6.5-2.5 1L16 3.5" />
      <path d="M12 3.5c.7 1 1 2.2 1 3.5M12 3.5c-.7 1-1 2.2-1 3.5" />
    </svg>
  );
}

export function IconHeart(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M12 20.5S4 15.2 4 9.8C4 7 6.2 5 8.7 5c1.5 0 2.8.8 3.3 2 .5-1.2 1.8-2 3.3-2C17.8 5 20 7 20 9.8c0 5.4-8 10.7-8 10.7Z" />
    </svg>
  );
}

export function IconPlus(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

export function IconTrash(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M5 7h14M9.5 7V5h5v2M7 7l1 13h8l1-13" />
      <path d="M10 11v5M14 11v5" />
    </svg>
  );
}

export function IconX(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M6 6l12 12M18 6 6 18" />
    </svg>
  );
}

export function IconRefresh(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M20 12a8 8 0 1 1-2.34-5.66" />
      <path d="M20 4v5h-5" />
    </svg>
  );
}

export function IconChevronRight(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="m9 6 6 6-6 6" />
    </svg>
  );
}

export function IconUpload(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M12 16V4m0 0L7 9m5-5 5 5" />
      <path d="M5 16v3h14v-3" />
    </svg>
  );
}

export function IconSun(props: IconProps) {
  return (
    <svg {...base(props)}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2.5M12 19.5V22M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M2 12h2.5M19.5 12H22M4.9 19.1l1.8-1.8M17.3 6.7l1.8-1.8" />
    </svg>
  );
}

export function IconCloud(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M7 18h10a4 4 0 0 0 .8-7.9A6 6 0 0 0 6.3 9.6 4.5 4.5 0 0 0 7 18Z" />
    </svg>
  );
}

export function IconRain(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M7 14h10a4 4 0 0 0 .8-7.9A6 6 0 0 0 6.3 5.6 4.5 4.5 0 0 0 7 14Z" />
      <path d="m9.5 17-.8 3M14.5 17l-.8 3M17.5 19l-.7 2.6" />
    </svg>
  );
}

export function IconSnow(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M7 13h10a4 4 0 0 0 .8-7.9A6 6 0 0 0 6.3 4.6 4.5 4.5 0 0 0 7 13Z" />
      <path d="M12 16.5v3M10.3 18l3.4-2M13.7 18l-3.4-2" />
    </svg>
  );
}

export function IconEdit(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M4 20h4l11-11-4-4L4 16v4Z" />
      <path d="m13.5 6.5 4 4" />
    </svg>
  );
}

export function IconSparkle(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M12 3c.5 4.5 2.5 6.5 7 7-4.5.5-6.5 2.5-7 7-.5-4.5-2.5-6.5-7-7 4.5-.5 6.5-2.5 7-7Z" />
    </svg>
  );
}

export function IconUser(props: IconProps) {
  return (
    <svg {...base(props)}>
      <circle cx="12" cy="8" r="4" />
      <path d="M4.5 20c.8-4 4-6 7.5-6s6.7 2 7.5 6" />
    </svg>
  );
}

export function IconCamera(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M4 8h3l1.5-2.5h7L17 8h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1Z" />
      <circle cx="12" cy="13.5" r="3.5" />
    </svg>
  );
}
