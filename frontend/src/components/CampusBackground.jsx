import React from 'react';

/**
 * CampusBackground
 * Renders an authentic SpaceBasic-style campus architectural vector silhouette
 * featuring campus academic clocktower, hostel blocks, trees, and student figures.
 * Styled as a subtle, non-distracting watermark at opacity-30.
 */
export default function CampusBackground() {
  return (
    <div 
      className="fixed inset-0 pointer-events-none opacity-30 z-0 overflow-hidden select-none" 
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 1600 700"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="xMidYMax slice"
        className="w-full h-full text-slate-400"
      >
        {/* Soft distant skyline contour */}
        <path
          d="M0 550 Q200 520 400 540 T800 530 T1200 545 T1600 535 L1600 700 L0 700 Z"
          fill="#F1F5F9"
        />

        {/* DISTANT BUILDINGS SILHOUETTE (Light Slate) */}
        <g fill="#E2E8F0">
          {/* Distant building left */}
          <rect x="60" y="380" width="130" height="170" rx="2" />
          <rect x="220" y="420" width="110" height="130" rx="2" />
          {/* Distant library dome */}
          <path d="M470 440 Q540 370 610 440 Z" />
          <rect x="480" y="440" width="120" height="110" rx="2" />
          {/* Distant research center */}
          <rect x="980" y="400" width="160" height="150" rx="2" />
          <polygon points="1060,350 980,400 1140,400" />
          {/* Distant hostel block right */}
          <rect x="1360" y="410" width="180" height="140" rx="2" />
        </g>

        {/* MIDGROUND: HOSTEL BLOCKS & ACADEMIC PAVILIONS */}
        <g fill="#CBD5E1">
          {/* Hostel Block A (Left) */}
          <rect x="140" y="330" width="170" height="230" rx="4" />
          {/* Windows on Hostel A */}
          <g fill="#F8FAFC" opacity="0.8">
            <rect x="160" y="350" width="18" height="24" rx="1" />
            <rect x="195" y="350" width="18" height="24" rx="1" />
            <rect x="230" y="350" width="18" height="24" rx="1" />
            <rect x="265" y="350" width="18" height="24" rx="1" />
            <rect x="160" y="390" width="18" height="24" rx="1" />
            <rect x="195" y="390" width="18" height="24" rx="1" />
            <rect x="230" y="390" width="18" height="24" rx="1" />
            <rect x="265" y="390" width="18" height="24" rx="1" />
            <rect x="160" y="430" width="18" height="24" rx="1" />
            <rect x="195" y="430" width="18" height="24" rx="1" />
            <rect x="230" y="430" width="18" height="24" rx="1" />
            <rect x="265" y="430" width="18" height="24" rx="1" />
            <rect x="160" y="470" width="18" height="24" rx="1" />
            <rect x="195" y="470" width="18" height="24" rx="1" />
            <rect x="230" y="470" width="18" height="24" rx="1" />
            <rect x="265" y="470" width="18" height="24" rx="1" />
          </g>

          {/* Central Academic Clock Tower & Administrative Quad */}
          {/* Main Tower Spire */}
          <polygon points="730,160 700,240 760,240" fill="#94A3B8" />
          <rect x="690" y="240" width="80" height="320" rx="4" />
          {/* Clock Face */}
          <circle cx="730" cy="285" r="22" fill="#F8FAFC" />
          <circle cx="730" cy="285" r="2" fill="#475569" />
          <line x1="730" y1="285" x2="730" y2="272" stroke="#475569" strokeWidth="2" strokeLinecap="round" />
          <line x1="730" y1="285" x2="740" y2="285" stroke="#475569" strokeWidth="2" strokeLinecap="round" />
          {/* Belfry Louvers */}
          <rect x="712" y="325" width="36" height="42" rx="18" fill="#64748B" opacity="0.3" />

          {/* Tower Flanking Wings */}
          <rect x="610" y="340" width="85" height="220" rx="3" />
          <rect x="765" y="340" width="85" height="220" rx="3" />
          {/* Arched windows on Academic Hall */}
          <g fill="#F8FAFC" opacity="0.8">
            <path d="M630 380 Q642 360 654 380 L654 410 L630 410 Z" />
            <path d="M665 380 Q677 360 689 380 L689 410 L665 410 Z" />
            <path d="M775 380 Q787 360 799 380 L799 410 L775 410 Z" />
            <path d="M810 380 Q822 360 834 380 L834 410 L810 410 Z" />
          </g>

          {/* Tech & Engineering Center (Right) */}
          <rect x="1100" y="310" width="190" height="250" rx="4" />
          {/* Glass Grid Facade */}
          <g fill="#F8FAFC" opacity="0.7">
            <rect x="1120" y="330" width="32" height="18" rx="1" />
            <rect x="1165" y="330" width="32" height="18" rx="1" />
            <rect x="1210" y="330" width="32" height="18" rx="1" />
            <rect x="1255" y="330" width="18" height="18" rx="1" />

            <rect x="1120" y="365" width="32" height="18" rx="1" />
            <rect x="1165" y="365" width="32" height="18" rx="1" />
            <rect x="1210" y="365" width="32" height="18" rx="1" />
            <rect x="1255" y="365" width="18" height="18" rx="1" />

            <rect x="1120" y="400" width="32" height="18" rx="1" />
            <rect x="1165" y="400" width="32" height="18" rx="1" />
            <rect x="1210" y="400" width="32" height="18" rx="1" />
            <rect x="1255" y="400" width="18" height="18" rx="1" />

            <rect x="1120" y="435" width="32" height="18" rx="1" />
            <rect x="1165" y="435" width="32" height="18" rx="1" />
            <rect x="1210" y="435" width="32" height="18" rx="1" />
            <rect x="1255" y="435" width="18" height="18" rx="1" />
          </g>
        </g>

        {/* CAMPUS GROUND & LAWN CONTOURS */}
        <path
          d="M0 550 Q300 525 600 545 T1100 535 T1600 545 L1600 700 L0 700 Z"
          fill="#E2E8F0"
        />
        <path
          d="M0 590 Q400 565 800 580 T1600 575 L1600 700 L0 700 Z"
          fill="#CBD5E1"
          opacity="0.5"
        />

        {/* CAMPUS TREES & FOLIAGE */}
        {/* Pine Tree Left */}
        <polygon points="90,460 70,510 110,510" fill="#94A3B8" />
        <polygon points="90,490 60,545 120,545" fill="#94A3B8" />
        <rect x="86" y="545" width="8" height="25" fill="#64748B" />

        {/* Leafy Oak Tree Left-Center */}
        <circle cx="370" cy="485" r="38" fill="#94A3B8" />
        <circle cx="345" cy="495" r="30" fill="#94A3B8" />
        <circle cx="395" cy="495" r="30" fill="#94A3B8" />
        <rect x="365" y="525" width="12" height="40" rx="3" fill="#64748B" />

        {/* Quad Campus Trees */}
        <circle cx="560" cy="510" r="28" fill="#94A3B8" />
        <rect x="557" y="535" width="7" height="30" fill="#64748B" />

        <circle cx="890" cy="505" r="32" fill="#94A3B8" />
        <rect x="886" y="535" width="8" height="30" fill="#64748B" />

        {/* Pine Tree Right */}
        <polygon points="1040,450 1020,500 1060,500" fill="#94A3B8" />
        <polygon points="1040,480 1010,540 1070,540" fill="#94A3B8" />
        <rect x="1036" y="540" width="8" height="25" fill="#64748B" />

        {/* Leafy Tree Right */}
        <circle cx="1340" cy="490" r="36" fill="#94A3B8" />
        <circle cx="1370" cy="500" r="28" fill="#94A3B8" />
        <rect x="1335" y="525" width="10" height="38" rx="2" fill="#64748B" />

        {/* CAMPUS LAMP POSTS */}
        {/* Lamp Post 1 */}
        <g stroke="#64748B" strokeWidth="2" fill="none">
          <line x1="470" y1="500" x2="470" y2="570" />
          <path d="M464 500 Q470 492 476 500" />
          <circle cx="470" cy="502" r="3" fill="#CBD5E1" stroke="none" />
        </g>
        {/* Lamp Post 2 */}
        <g stroke="#64748B" strokeWidth="2" fill="none">
          <line x1="970" y1="505" x2="970" y2="575" />
          <path d="M964 505 Q970 497 976 505" />
          <circle cx="970" cy="507" r="3" fill="#CBD5E1" stroke="none" />
        </g>

        {/* STUDENT SILHOUETTES & CARICATURES (Subtle & Elegant) */}
        {/* Student 1: Student with backpack walking across the quad */}
        <g fill="#64748B">
          {/* Head */}
          <circle cx="430" cy="542" r="5" />
          {/* Torso & Backpack */}
          <path d="M427 548 L433 548 L435 565 L425 565 Z" />
          <path d="M424 550 C421 550 421 560 424 562 Z" /> {/* Backpack */}
          {/* Legs walking */}
          <line x1="428" y1="565" x2="424" y2="582" stroke="#64748B" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="433" y1="565" x2="437" y2="581" stroke="#64748B" strokeWidth="2.5" strokeLinecap="round" />
        </g>

        {/* Student 2: Student sitting on a campus bench reading */}
        <g>
          {/* Campus Bench */}
          <line x1="620" y1="568" x2="650" y2="568" stroke="#94A3B8" strokeWidth="3" strokeLinecap="round" />
          <line x1="624" y1="568" x2="624" y2="578" stroke="#94A3B8" strokeWidth="2" />
          <line x1="646" y1="568" x2="646" y2="578" stroke="#94A3B8" strokeWidth="2" />
          {/* Student figure seated */}
          <circle cx="633" cy="552" r="4.5" fill="#64748B" />
          <path d="M630 557 L637 557 L637 568 L629 568 Z" fill="#64748B" />
          {/* Book */}
          <path d="M638 560 L644 562 L644 566 L638 564 Z" fill="#CBD5E1" />
          {/* Seated legs */}
          <line x1="636" y1="568" x2="636" y2="577" stroke="#64748B" strokeWidth="2" />
        </g>

        {/* Student 3 & 4: Two students walking together and discussing */}
        <g fill="#64748B">
          {/* Student A */}
          <circle cx="795" cy="544" r="4.5" />
          <rect x="792" y="549" width="7" height="15" rx="1.5" />
          <line x1="794" y1="564" x2="792" y2="580" stroke="#64748B" strokeWidth="2" strokeLinecap="round" />
          <line x1="797" y1="564" x2="799" y2="580" stroke="#64748B" strokeWidth="2" strokeLinecap="round" />

          {/* Student B (Carrying notebook) */}
          <circle cx="810" cy="543" r="4.5" />
          <rect x="807" y="548" width="7" height="15" rx="1.5" />
          <rect x="813" y="552" width="4" height="6" rx="0.5" fill="#CBD5E1" />
          <line x1="809" y1="563" x2="807" y2="579" stroke="#64748B" strokeWidth="2" strokeLinecap="round" />
          <line x1="812" y1="563" x2="815" y2="579" stroke="#64748B" strokeWidth="2" strokeLinecap="round" />
        </g>

        {/* Student 5: Student riding bicycle across campus pathway */}
        <g stroke="#64748B" strokeWidth="1.5" fill="none">
          {/* Bike Wheels */}
          <circle cx="1185" cy="572" r="10" />
          <circle cx="1215" cy="572" r="10" />
          {/* Frame */}
          <line x1="1185" y1="572" x2="1198" y2="572" />
          <line x1="1198" y1="572" x2="1208" y2="563" />
          <line x1="1208" y1="563" x2="1215" y2="572" />
          <line x1="1185" y1="572" x2="1196" y2="563" />
          <line x1="1196" y1="563" x2="1208" y2="563" />
          <line x1="1196" y1="563" x2="1198" y2="572" />
          {/* Handlebar & Seat */}
          <line x1="1208" y1="563" x2="1206" y2="557" />
          <line x1="1203" y1="557" x2="1209" y2="557" />
          <line x1="1196" y1="563" x2="1194" y2="559" />
          <line x1="1191" y1="559" x2="1197" y2="559" strokeWidth="2" />
          {/* Rider */}
          <circle cx="1202" cy="544" r="4.5" fill="#64748B" stroke="none" />
          <line x1="1202" y1="549" x2="1197" y2="560" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="1197" y1="560" x2="1199" y2="570" strokeWidth="2" strokeLinecap="round" />
          <line x1="1202" y1="552" x2="1206" y2="558" strokeWidth="1.8" strokeLinecap="round" />
        </g>
      </svg>
    </div>
  );
}
