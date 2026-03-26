'use client'
// ═══════════════════════════════════════════════════════════════
// ApplicationCat — Low-poly PS1 cat avatars per ApplicationStatus
// ViewBox: -8 -4 88 108  (arms + accessories overflow the 72x100 base)
// Each cat shares: Ears, Head, Body, Arms
// Each cat varies: color, eyes, signature accessory
//
// Reference designs:
//   Bookmarked  → Ghost cat (pale lavender, wavy body, sleepy)
//   Applied     → Mail cat  (blue, holding envelope)
//   OA          → Hacker cat (mint, visor goggles, laptop)
//   Phone Screen→ Phone cat  (peach, red handset – ref Image 3)
//   Interview   → Business cat (grey suit, headphones, coffee – ref Image 4)
//   Offer       → Golden cat (gold, halo, star eyes)
//   Rejected    → Sad cat   (grey, X eyes, tears, rain)
//   Withdrawn   → Sleepy cat (muted, backpack, flat expression)
// ═══════════════════════════════════════════════════════════════

import { ApplicationStatus } from '@/app/types'

// ─── Eye variants ────────────────────────────────────────────────────────────

function StarPolygon({ cx, cy }: { cx: number; cy: number }) {
  return (
    <polygon
      points={`${cx},${cy - 5} ${cx + 2},${cy - 2} ${cx + 5},${cy - 2} ${cx + 3},${cy + 1} ${cx + 4},${cy + 5} ${cx},${cy + 3} ${cx - 4},${cy + 5} ${cx - 3},${cy + 1} ${cx - 5},${cy - 2} ${cx - 2},${cy - 2}`}
      fill="#f0c830"
    />
  )
}

function EyesOpen({ lx = 16, rx = 45, y = 28 }: { lx?: number; rx?: number; y?: number }) {
  return (
    <>
      <rect x={lx} y={y} width={11} height={9} fill="#28203c" />
      <rect x={lx + 2} y={y + 1} width={4} height={4} fill="white" opacity={0.28} />
      <rect x={rx} y={y} width={11} height={9} fill="#28203c" />
      <rect x={rx + 2} y={y + 1} width={4} height={4} fill="white" opacity={0.28} />
    </>
  )
}

function EyesSleepy({ lx = 16, rx = 45, y = 28 }: { lx?: number; rx?: number; y?: number }) {
  return (
    <>
      <rect x={lx} y={y + 5} width={11} height={3} fill="#28203c" />
      <rect x={rx} y={y + 5} width={11} height={3} fill="#28203c" />
    </>
  )
}

function EyesX({ lx = 16, rx = 45, y = 28 }: { lx?: number; rx?: number; y?: number }) {
  return (
    <g stroke="#28203c" strokeWidth={2.5} strokeLinecap="square">
      <line x1={lx}      y1={y}     x2={lx + 11} y2={y + 9} />
      <line x1={lx + 11} y1={y}     x2={lx}      y2={y + 9} />
      <line x1={rx}      y1={y}     x2={rx + 11} y2={y + 9} />
      <line x1={rx + 11} y1={y}     x2={rx}      y2={y + 9} />
    </g>
  )
}

function EyesStar({ lx = 16, rx = 45, y = 28 }: { lx?: number; rx?: number; y?: number }) {
  return (
    <>
      <StarPolygon cx={lx + 5} cy={y + 4} />
      <StarPolygon cx={rx + 5} cy={y + 4} />
    </>
  )
}

// ─── Face expressions ─────────────────────────────────────────────────────────

function FaceHappy({ nose = "#e0809a", blush = "#f4a0b4" }: { nose?: string; blush?: string }) {
  return (
    <>
      <polygon points="33,46 39,46 36,52" fill={nose} />
      <polyline points="31,53 36,58 41,53" fill="none" stroke="#28203c" strokeWidth={1.5} strokeLinecap="square" strokeLinejoin="miter" />
      <rect x={10} y={44} width={9} height={5} fill={blush} opacity={0.65} />
      <rect x={53} y={44} width={9} height={5} fill={blush} opacity={0.65} />
    </>
  )
}

function FaceSad({ nose = "#c09098", blush = "#9098b0" }: { nose?: string; blush?: string }) {
  return (
    <>
      <polygon points="33,46 39,46 36,52" fill={nose} />
      <polyline points="31,58 36,53 41,58" fill="none" stroke="#28203c" strokeWidth={1.5} strokeLinecap="square" strokeLinejoin="miter" />
      <rect x={10} y={44} width={9} height={5} fill={blush} opacity={0.40} />
      <rect x={53} y={44} width={9} height={5} fill={blush} opacity={0.40} />
    </>
  )
}

function FaceFlat({ nose = "#c0a0b8" }: { nose?: string }) {
  return (
    <>
      <polygon points="33,46 39,46 36,52" fill={nose} />
      <line x1={31} y1={55} x2={41} y2={55} stroke="#28203c" strokeWidth={1.5} strokeLinecap="square" />
      <rect x={10} y={44} width={9} height={5} fill="#c0a8bc" opacity={0.28} />
      <rect x={53} y={44} width={9} height={5} fill="#c0a8bc" opacity={0.28} />
    </>
  )
}

// ─── Structural base (shared skeleton) ───────────────────────────────────────

function Ears({ outer, inner = "#f8a8be" }: { outer: string; inner?: string }) {
  return (
    <>
      <polygon points="12,20 6,2 27,11" fill={outer} />
      <polygon points="14,19 9,6 24,13" fill={inner} />
      <polygon points="60,20 66,2 45,11" fill={outer} />
      <polygon points="58,19 63,6 48,13" fill={inner} />
    </>
  )
}

function HeadBody({ fill }: { fill: string }) {
  const lit = "rgba(255,255,255,0.13)"
  const shd = "rgba(0,0,0,0.09)"
  return (
    <>
      {/* Head – 6-sided, low-poly bevel */}
      <polygon points="8,18 64,18 68,54 62,60 10,60 4,54" fill={fill} />
      <polygon points="8,18 64,18 60,30 12,30" fill={lit} />
      <polygon points="4,54 10,60 12,30 8,18" fill={shd} />
      <polygon points="68,54 62,60 60,30 64,18" fill={shd} />
      {/* Body – trapezoid */}
      <polygon points="8,60 64,60 68,98 4,98" fill={fill} />
      <polygon points="8,60 26,60 22,98 4,98" fill={shd} />
      <polygon points="46,60 64,60 68,98 50,98" fill={shd} />
      <polygon points="32,60 40,60 38,98 34,98" fill={lit} />
      {/* Arms */}
      <polygon points="-2,72 10,66 8,84 -4,80" fill={fill} />
      <polygon points="-2,72 10,66 9,70 -1,73" fill={lit} />
      <polygon points="74,72 62,66 64,84 76,80" fill={fill} />
      <polygon points="74,72 62,66 63,70 73,73" fill={lit} />
    </>
  )
}

// ═══════════════════════════════════════════════════════════════
// INDIVIDUAL CAT DESIGNS
// ═══════════════════════════════════════════════════════════════

// BOOKMARKED — Ghost cat: lavender, wavy body, sparkle dots, sleepy
function GhostCat() {
  return (
    <g opacity={0.80}>
      <Ears outer="#c0b0dc" inner="#ddd0f0" />
      {/* Head */}
      <polygon points="8,18 64,18 68,54 62,60 10,60 4,54" fill="#d4c8ec" />
      <polygon points="8,18 64,18 60,30 12,30" fill="rgba(255,255,255,0.18)" />
      <polygon points="4,54 10,60 12,30 8,18" fill="rgba(0,0,0,0.08)" />
      <polygon points="68,54 62,60 60,30 64,18" fill="rgba(0,0,0,0.08)" />
      {/* Ghost body — wavy base instead of flat feet */}
      <path d="M 8,60 L 64,60 L 68,98 Q 57,89 50,98 Q 43,107 36,98 Q 29,89 22,98 Q 15,107 4,98 Z" fill="#d4c8ec" />
      {/* Arms – floaty */}
      <polygon points="-2,72 10,66 8,82 -4,78" fill="#d4c8ec" />
      <polygon points="74,72 62,66 64,82 76,78" fill="#d4c8ec" />
      {/* Sleepy eyes */}
      <EyesSleepy lx={16} rx={45} y={30} />
      {/* Face */}
      <polygon points="33,46 39,46 36,52" fill="#c0a0c8" />
      <polyline points="32,53 36,56 40,53" fill="none" stroke="#9888b8" strokeWidth={1.5} strokeLinecap="square" strokeLinejoin="miter" />
      <rect x={10} y={44} width={9} height={5} fill="#c0a8d8" opacity={0.50} />
      <rect x={53} y={44} width={9} height={5} fill="#c0a8d8" opacity={0.50} />
      {/* Floating sparkle pixel dots */}
      <rect x={0}  y={10} width={3} height={3} fill="#c4b4dc" opacity={0.75} />
      <rect x={69} y={14} width={3} height={3} fill="#c4b4dc" opacity={0.75} />
      <rect x={75} y={38} width={2} height={2} fill="#c4b4dc" opacity={0.50} />
      <rect x={-5} y={46} width={2} height={2} fill="#c4b4dc" opacity={0.50} />
      <rect x={33} y={0}  width={2} height={2} fill="#c4b4dc" opacity={0.60} />
    </g>
  )
}

// APPLIED — Mail cat: blue, holding white envelope in right hand
function MailCat() {
  return (
    <>
      <Ears outer="#88b0cc" />
      <HeadBody fill="#a4c4e0" />
      <EyesOpen />
      <FaceHappy />
   
      {/* Envelope in right-hand area */}
      <rect x={58} y={70} width={20} height={14} fill="#f4f0e8" stroke="#909080" strokeWidth={1} />
      <polygon points="58,70 68,79 78,70" fill="#e8e0d0" stroke="#909080" strokeWidth={1} />
      <line x1={60} y1={80} x2={76} y2={80} stroke="#c0b8a0" strokeWidth={1} />
      <line x1={60} y1={83} x2={72} y2={83} stroke="#c0b8a0" strokeWidth={1} />
      {/* Stamp */}
      <rect x={72} y={72} width={5} height={5} fill="#a898c8" />
      <rect x={73} y={73} width={3} height={3} fill="#8878b0" />
    </>
  )
}

// OA — Hacker cat: mint, visor goggles cover eyes, laptop near hands
function HackerCat() {
  return (
    <>
      <Ears outer="#78b888" />
      <HeadBody fill="#9cd4a8" />
      {/* Goggles visor — replaces eyes entirely */}
      <rect x={6}  y={23} width={60} height={22} fill="#252850" />
      <rect x={7}  y={24} width={26} height={20} fill="#1820a0" />
      <rect x={39} y={24} width={27} height={20} fill="#1820a0" />
      <rect x={33} y={26} width={6}  height={8}  fill="#303080" />
      {/* Lens glare */}
      <rect x={8}  y={25} width={10} height={6}  fill="rgba(40,200,255,0.55)" />
      <rect x={40} y={25} width={10} height={6}  fill="rgba(40,200,255,0.55)" />
      {/* Strap sides */}
      <rect x={-1} y={29} width={8}  height={5} fill="#252850" />
      <rect x={65} y={29} width={8}  height={5} fill="#252850" />
      {/* Nose + mouth below goggles */}
      <polygon points="33,48 39,48 36,54" fill="#e0809a" />
      <polyline points="31,55 36,60 41,55" fill="none" stroke="#28203c" strokeWidth={1.5} strokeLinecap="square" strokeLinejoin="miter" />
      <rect x={10} y={46} width={9} height={5} fill="#f4a0b4" opacity={0.60} />
      <rect x={53} y={46} width={9} height={5} fill="#f4a0b4" opacity={0.60} />
      {/* Laptop in hands */}
      <rect x={46} y={72} width={26} height={17} fill="#1a1e30" stroke="#28203c" strokeWidth={1} />
      <rect x={47} y={73} width={24} height={14} fill="#242c48" />
      <rect x={49} y={75} width={16} height={2} fill="#60c878" opacity={0.9} />
      <rect x={49} y={78} width={10} height={2} fill="#60c878" opacity={0.6} />
      <rect x={49} y={81} width={18} height={2} fill="#60c878" opacity={0.75} />
      <rect x={44} y={89} width={30} height={4} fill="#1a1e30" stroke="#28203c" strokeWidth={1} />
    </>
  )
}

// PHONE SCREEN — Phone cat: peach, holding red telephone handset (Image 3 reference!)
function PhoneCat() {
  return (
    <>
      <Ears outer="#d8a898" />
      <HeadBody fill="#f0c4b0" />
      {/* Open/excited eyes */}
      <EyesOpen lx={16} rx={45} y={26} />
      {/* Nose */}
      <polygon points="33,44 39,44 36,50" fill="#e0809a" />
      {/* Excited open mouth */}
      <rect x={29} y={51} width={14} height={10} fill="#c03060" />
      <rect x={30} y={52} width={12} height={7}  fill="#f090a0" opacity={0.65} />
      {/* Blush */}
      <rect x={10} y={42} width={9} height={5} fill="#f4a0b4" opacity={0.65} />
      <rect x={53} y={42} width={9} height={5} fill="#f4a0b4" opacity={0.65} />
      {/* Red telephone handset (like Image 3) */}
      <rect x={54} y={54} width={14} height={26} fill="#d02828" />
      <rect x={54} y={54} width={14} height={9}  fill="#b01818" />
      <rect x={54} y={71} width={14} height={9}  fill="#b01818" />
      <rect x={56} y={56} width={10} height={6}  fill="#e04040" opacity={0.40} />
      {/* Spiral cord */}
      <path d="M 61,80 Q 68,85 64,91 Q 60,96 65,100" fill="none" stroke="#c82020" strokeWidth={2.5} strokeLinecap="square" />
    </>
  )
}

// INTERVIEW — Business cat: grey suit, headphones, coffee (Image 4 reference!)
function BusinessCat() {
  return (
    <>
      <Ears outer="#9898b0" inner="#c8c0d8" />
      <HeadBody fill="#c4bcd0" />
      {/* Suit jacket over body */}
      <polygon points="8,60 28,60 22,98 4,98"   fill="#6868a0" />
      <polygon points="44,60 64,60 68,98 50,98"  fill="#6868a0" />
      {/* Lapels */}
      <polygon points="28,60 36,72 20,60" fill="#8888b8" />
      <polygon points="44,60 36,72 52,60" fill="#8888b8" />
      {/* Tie */}
      <polygon points="34,62 38,62 40,84 36,89 32,84" fill="#c03838" />
      <polygon points="34,62 38,62 36,70"               fill="#a02020" />
      {/* Headphones arc (like Image 4) */}
      <path d="M 8,32 Q 36,14 64,32" fill="none" stroke="#545468" strokeWidth={4} strokeLinecap="square" />
      <rect x={0}  y={28} width={10} height={14} fill="#707090" />
      <rect x={62} y={28} width={10} height={14} fill="#707090" />
      <rect x={1}  y={29} width={8}  height={12} fill="#b0a8c0" />
      <rect x={63} y={29} width={8}  height={12} fill="#b0a8c0" />
      {/* Eyes and face */}
      <EyesOpen />
      <FaceHappy nose="#e0809a" blush="#d0a0c0" />
      {/* Coffee cup (like Image 4!) */}
      <polygon points="62,70 74,70 72,88 60,88"   fill="#f4f0e8" stroke="#28203c" strokeWidth={1} />
      <polygon points="63,73 73,73 72,82 63,82"    fill="#7a4820" />
      <polygon points="62,82 74,82 73,87 61,87"    fill="#c89848" />
      <rect    x={61} y={68} width={14} height={3} fill="#e0dcd4" stroke="#28203c" strokeWidth={1} />
      <rect    x={64} y={68} width={5}  height={2} fill="#303030" />
      <path d="M 74,74 Q 80,78 74,84" fill="none" stroke="#c8b8a8" strokeWidth={2.5} strokeLinecap="square" />
    </>
  )
}

// OFFER — Golden cat: warm gold, halo, star eyes, big happy mouth, sparkles
function GoldenCat() {
  return (
    <>
      {/* Sparkle diamonds around cat */}
      <polygon points="2,14 4,10 6,14 4,18"   fill="#f0d040" />
      <polygon points="65,6 67,2 69,6 67,10"  fill="#f0d040" />
      <polygon points="74,46 76,42 78,46 76,50" fill="#f0d040" opacity={0.70} />
      <polygon points="-4,52 -2,48 0,52 -2,56"  fill="#f0d040" opacity={0.70} />
      {/* Halo */}
      <ellipse cx={36} cy={8} rx={18} ry={6} fill="none" stroke="#f0d040" strokeWidth={3.5} />
      <ellipse cx={36} cy={8} rx={18} ry={6} fill="none" stroke="rgba(255,252,210,0.55)" strokeWidth={1.5} />
      <Ears outer="#c8a840" inner="#f0d880" />
      <HeadBody fill="#e8d080" />
      <EyesStar />
      <FaceHappy nose="#e0809a" blush="#e8a030" />
      {/* Override to big open happy mouth */}
      <rect x={28} y={52} width={16} height={10} fill="#c03060" />
      <rect x={29} y={53} width={14} height={7}  fill="#f090a0" opacity={0.65} />
      {/* Shine fleck */}
      <rect x={30} y={66} width={5} height={5} fill="rgba(255,255,200,0.30)" />
    </>
  )
}

// REJECTED — Sad cat: grey, X eyes, tears, rain drops above
function SadCat() {
  return (
    <>
      {/* Rain drops */}
      <g fill="#8090b4" opacity={0.55}>
        <rect x={7}  y={0} width={2} height={8} />
        <rect x={22} y={2} width={2} height={8} />
        <rect x={36} y={0} width={2} height={8} />
        <rect x={50} y={2} width={2} height={8} />
        <rect x={64} y={0} width={2} height={8} />
        <rect x={14} y={6} width={2} height={7} opacity={0.70} />
        <rect x={43} y={6} width={2} height={7} opacity={0.70} />
      </g>
      <Ears outer="#8888a0" inner="#b8b0cc" />
      <HeadBody fill="#acaabb" />
      <EyesX />
      <FaceSad />
      {/* Teardrop shapes on cheeks */}
      <polygon points="12,47 16,45 18,51 14,54" fill="#90a8cc" opacity={0.75} />
      <polygon points="60,47 56,45 54,51 58,54" fill="#90a8cc" opacity={0.75} />
    </>
  )
}

// WITHDRAWN — Sleepy cat: muted, flat mouth, small backpack, low opacity
function WithdrawnCat() {
  return (
    <g opacity={0.62}>
      <Ears outer="#9898b0" inner="#c0b8d0" />
      <HeadBody fill="#b4accc" />
      <EyesSleepy />
      <FaceFlat />
      {/* Backpack on right side (suggesting "leaving") */}
      <rect x={62} y={62} width={14} height={22} fill="#8880a0" stroke="#28203c" strokeWidth={1} />
      <rect x={62} y={62} width={14} height={3}  fill="#a098c0" />
      <rect x={65} y={66} width={8}  height={14} fill="#7870a0" />
      <rect x={66} y={67} width={6}  height={2}  fill="#9088b0" opacity={0.5} />
      {/* Strap */}
      <line x1={65} y1={62} x2={62} y2={84} stroke="#6a6090" strokeWidth={1.5} strokeLinecap="square" />
    </g>
  )
}



// ─── Map ──────────────────────────────────────────────────────────────────────

const CAT_MAP: Record<ApplicationStatus, React.FC> = {
  Bookmarked:      GhostCat,
  Applied:         MailCat,
  OA:              HackerCat,
  'Phone Screen':  PhoneCat,
  Interview:       BusinessCat,
  Offer:           GoldenCat,
  Rejected:        SadCat,
  Withdrawn:       WithdrawnCat,
}

// ─── Public component ─────────────────────────────────────────────────────────

interface ApplicationCatProps {
  status: ApplicationStatus
  /** Width in px; height is auto-calculated at a 88:108 ratio */
  size?: number
}

export function ApplicationCat({ status, size = 110 }: ApplicationCatProps) {
  const CatContent = CAT_MAP[status]
  const h = Math.round(size * (108 / 88))
  return (
    <svg
      viewBox="-8 -4 88 108"
      width={size}
      height={h}
      xmlns="http://www.w3.org/2000/svg"
      // pixelated keeps the low-poly hard-edge quality when scaled
      style={{ imageRendering: 'pixelated', display: 'block' }}
      aria-label={`${status} cat`}
    >
      <CatContent />
    </svg>
  )
}
