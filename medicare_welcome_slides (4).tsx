import { useMemo, useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Layers, ArrowLeft, ArrowRight, Home, GraduationCap } from "lucide-react";

/***********************
 * Minimal local UI kit *
 ***********************/
function cx(...xs: (string | false | null | undefined)[]) {
  return xs.filter(Boolean).join(" ");
}

const Button: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>> = ({ className, children, ...rest }) => (
  <button
    className={cx(
      "btn",
      "pop-press",
      className
    )}
    {...rest}
  >
    {children}
  </button>
);

const Card: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, children, ...rest }) => (
  <div className={cx("card-glass", className)} {...rest}>{children}</div>
);
const CardContent: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, children, ...rest }) => (
  <div className={cx("card-content", className)} {...rest}>{children}</div>
);

const Progress: React.FC<{ value: number; className?: string }> = ({ value, className }) => (
  <div className={cx("w-full h-2 rounded-full bg-white/20 overflow-hidden", className)}>
    <div
      className="h-full bg-yellow-300"
      style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={100}
      role="progressbar"
    />
  </div>
);

/***********************
 * Assets + helpers     *
 ***********************/
const QUIZ_FILE_NAME = "Medicare Training Multiple Choice Quiz Modern.pdf";
const LOGO_FILE_NAME = "AHM logo.png";
const resolveAsset = (n: string) => {
  const prefix = (typeof window !== "undefined" && (window as any).__ASSET_PREFIX__) ? (window as any).__ASSET_PREFIX__ : "";
  return `${prefix}${encodeURI(n.replace(/^.*\//, ""))}`;
};

/***********************
 * Types                *
 ***********************/
interface MCQ { q: string; options: string[]; correctIndex: number }
interface LessonBlockImage { src: string; alt?: string; caption?: string }
interface LessonBlock { type: 'p'|'ul'|'ol'|'img'|'h3'|'quote'|'html'; text?: string; items?: string[]; image?: LessonBlockImage; html?: string }
interface ModuleDef { id: number; color: string; title: string; icon?: JSX.Element|null; objectives: string[]; keyPoints: string[]; breakdown?: string; breakdownBlocks?: LessonBlock[]; miniQuiz: MCQ; extraQuiz?: MCQ[] }
interface ExamItem extends MCQ { moduleId:number; moduleTitle:string; sourceKey:string }

/***********************
 * App config
 ***********************/
const PASS_THRESHOLD = 0.8; // exam pass
const MODULE_PASS = 0.75;   // per-module gate

/***********************
 * Confetti helpers
 ***********************/
function ensureConfettiKeyframes(){
  if (typeof document === 'undefined') return;
  const id = 'ahm-fall-style';
  if (document.getElementById(id)) return;
  const el = document.createElement('style');
  el.id = id;
  el.textContent = `@keyframes fall { 0% { transform: translateY(0) rotate(0deg); opacity: 1; } 100% { transform: translateY(110vh) rotate(720deg); opacity: 0; } }`;
  document.head.appendChild(el);
}

function ConfettiBurst({count=60}:{count?:number}){
  const pieces=Array.from({length:count}).map((_,i)=>{
    const left=Math.random()*100, delay=Math.random()*0.6, duration=2.2+Math.random()*0.8, rotate=Math.random()*360, size=10+Math.random()*10, emoji=Math.random()<0.5?'🎉':'✨';
    return (
      <span
        key={i}
        style={{position:'fixed',top:'-5vh',left:`${left}vw`,fontSize:size,transform:`rotate(${rotate}deg)`,animation:`fall ${duration}s ${delay}s ease-in forwards`,pointerEvents:'none',zIndex:50}}
      >{emoji}</span>
    );
  });
  return <>{pieces}</>;
}

/***********************
 * Dataset (Modules 1–9)
 * — Uses the detailed breakdowns and quizzes
 ***********************/
const MODULES: ModuleDef[] = [
  {
    id:1,color:"bg-pink-500",title:"Module 1: Introduction to Medicare",icon:<Layers className="w-8 h-8"/>,
    objectives:["Define what Medicare is and who it serves.","Differentiate Medicare from Medicaid.","Understand the overall structure of Medicare."],
    keyPoints:["Federal health insurance for 65+, certain disabilities, ESRD/ALS.","Medicare ≠ Medicaid (age/disability vs. income-based).","Four parts: A (Hospital), B (Medical), C (Advantage), D (Drugs)."],
    breakdownBlocks:[
      {type:'h3',text:'Slide 2 — What is Medicare?'},
      {type:'p',text:'Medicare is the federal health insurance program for people 65+, people under 65 who have certain disabilities (after 24 months of Social Security Disability benefits), and those with ESRD or ALS. It helps cover hospital stays, medical visits, preventive services, and prescription drugs.'},
      {type:'ul',items:['Part A – Hospital Insurance','Part B – Medical Insurance','Part C – Medicare Advantage (private plans)','Part D – Prescription Drug Coverage']},
      {type:'quote',text:'Key Point: Medicare ≠ Medicaid. Medicare is age/disability-based; Medicaid is income-based. Some qualify for both ("dual eligibles").'},
      {type:'img',image:{src:'slide_2.png',alt:'Slide 2: Introduction to Medicare',caption:'Slide 2'}},
    ],
    miniQuiz:{q:'Medicare is primarily for:',options:['Anyone under age 65','People 65+, some under 65 with disabilities, ESRD, or ALS','Low-income families only','Veterans'],correctIndex:1},
    extraQuiz:[
      {q:'True/False: Medicare and Medicaid are the same program.',options:['True','False'],correctIndex:1},
      {q:'Which is not a part of Medicare?',options:['Part A','Part B','Part C','Part F'],correctIndex:3},
      {q:'What does Part D cover?',options:['Hospital services','Prescription drugs','Durable medical equipment','Skilled nursing care'],correctIndex:1},
    ],
  },
  {
    id:2,color:"bg-green-500",title:"Module 2: Medicare Part A – Hospital Insurance",icon:<Layers className="w-8 h-8"/>,
    objectives:['Describe what Medicare Part A covers.','Identify eligibility requirements for premium-free Part A.','Explain deductibles, coinsurance, and premium costs.'],
    keyPoints:['Covers inpatient hospital, SNF (after 3-day stay), hospice, some home health.','Premium-free with ~40 work credits (10 years); otherwise monthly premium applies.','Deductible/coinsurance are per benefit period; Part A does not cover custodial long-term care.'],
    breakdownBlocks:[
      {type:'h3',text:'Slide 3 — Part A Coverage & Costs'},
      {type:'ul',items:['Inpatient hospital stays','Skilled nursing facility care (after qualifying 3-day inpatient stay)','Hospice care (comfort-focused services)','Some home health care']},
      {type:'p',text:'Premium-free if you or a spouse worked 40 quarters paying Medicare taxes; otherwise a monthly premium may apply. Deductibles and coinsurance apply per benefit period with increasing member costs after day thresholds.'},
      {type:'quote',text:'Key Point: Part A does not cover custodial long-term care.'},
      {type:'img',image:{src:'slide_3.png',alt:'Slide 3: Part A – Hospital Insurance',caption:'Slide 3'}},
    ],
    miniQuiz:{q:'How many credits for premium-free Part A?',options:['20','30','40','50'],correctIndex:2},
    extraQuiz:[
      {q:'True/False: Part A covers long-term custodial care.',options:['True','False'],correctIndex:1},
      {q:'Which is covered by Part A?',options:['Outpatient x-rays','Skilled nursing (after 3-day stay)','Routine dental','Vaccinations'],correctIndex:1},
      {q:'What is the 2025 Part A deductible?',options:['$816','$1,632','$408','$185'],correctIndex:1},
    ],
  },
  {
    id:3,color:"bg-blue-500",title:"Module 3: Medicare Part B – Medical Insurance",icon:<Layers className="w-8 h-8"/>,
    objectives:['Understand what Medicare Part B covers.','Review premiums, deductibles, and IRMAA surcharges.','Recognize penalties for late enrollment.'],
    keyPoints:['Covers doctor visits, outpatient care, labs/x-rays, preventive services, DME, some home health.','2025 est.: ~$185/mo premium; $257 annual deductible; typically 80% Medicare / 20% member after deductible.','IRMAA adds income-related premium; delaying Part B without creditable coverage causes a permanent penalty.'],
    breakdownBlocks:[
      {type:'h3',text:'Slides 4–11 — Part B Coverage & Costs'},
      {type:'ul',items:['Physician visits, outpatient services, labs, imaging','Preventive services (annual wellness visit, screenings, vaccines)','Durable medical equipment (DME)','Some home health care']},
      {type:'ul',items:['Estimated 2025 premium ~$185/month (IRMAA may increase up to ~ $628.90/mo).','Annual deductible ~$257; after deductible, Medicare pays ~80% and member pays ~20%.','Late enrollment without creditable coverage results in a permanent penalty.']},
      {type:'img',image:{src:'slide_4.png',alt:'Part B: Coverage',caption:'Slide 4'}},
      {type:'img',image:{src:'slide_5.png',alt:'Part B: Costs',caption:'Slide 5'}},
      {type:'img',image:{src:'slide_6.png',alt:'Preventive services',caption:'Slide 6'}},
      {type:'img',image:{src:'slide_7.png',alt:'DME',caption:'Slide 7'}},
      {type:'img',image:{src:'slide_8.png',alt:'Home health',caption:'Slide 8'}},
      {type:'img',image:{src:'slide_9.png',alt:'Coinsurance',caption:'Slide 9'}},
      {type:'img',image:{src:'slide_10.png',alt:'IRMAA',caption:'Slide 10'}},
      {type:'img',image:{src:'slide_11.png',alt:'Enrollment timing',caption:'Slide 11'}},
    ],
    miniQuiz:{q:'After deductible, Medicare Part B pays:',options:['50%','70%','80%','100%'],correctIndex:2},
    extraQuiz:[
      {q:'True/False: Delaying Part B without other coverage may cause a penalty.',options:['True','False'],correctIndex:0},
      {q:'Which is covered by Part B?',options:['Inpatient hospital stay','Doctor visits','Prescription drugs','Custodial care'],correctIndex:1},
      {q:'Extra premium for higher incomes is called:',options:['Copay','Coinsurance','IRMAA','Deductible'],correctIndex:2},
    ],
  },
  {
    id:4,color:"bg-indigo-500",title:"Module 4: Enrollment Periods",icon:<Layers className="w-8 h-8"/>,
    objectives:['Identify IEP, AEP, OEP, and SEP windows.','Explain when beneficiaries can enroll or switch coverage.'],
    keyPoints:['IEP: 7 months around 65th birthday.','AEP: Oct 15–Dec 7 for changing MA/Part D.','OEP: Jan 1–Mar 31 for MA enrollees to switch/drop.','SEPs: Qualifying life events (move, loss of employer coverage, Medicaid).'],
    breakdownBlocks:[
      {type:'h3',text:'Slides 13–17 — Enrollment Windows'},
      {type:'ul',items:['IEP: 7 months around 65th birthday','AEP: Oct 15–Dec 7 (change plans, add/drop Part D)','OEP: Jan 1–Mar 31 (MA enrollees only)','SEPs: move, loss of employer coverage, Medicaid eligibility changes']},
      {type:'img',image:{src:'slide_13.png',alt:'IEP',caption:'Slide 13'}},
      {type:'img',image:{src:'slide_14.png',alt:'AEP',caption:'Slide 14'}},
      {type:'img',image:{src:'slide_15.png',alt:'OEP',caption:'Slide 15'}},
      {type:'img',image:{src:'slide_16.png',alt:'SEPs',caption:'Slide 16'}},
      {type:'img',image:{src:'slide_17.png',alt:'Scenarios',caption:'Slide 17'}},
    ],
    miniQuiz:{q:'IEP lasts:',options:['3 months','6 months','7 months','12 months'],correctIndex:2},
    extraQuiz:[
      {q:'Which occurs Oct 15–Dec 7?',options:['OEP','AEP','SEP','IEP'],correctIndex:1},
      {q:'True/False: During OEP, any Medicare enrollee can join Part D.',options:['True','False'],correctIndex:1},
      {q:'Which triggers a SEP?',options:['Moving to new state','Turning 40','Tax filing changes','Employer bonus'],correctIndex:0},
    ],
  },
  {
    id:5,color:"bg-teal-500",title:"Module 5: Dual Eligibility (Medicare + Medicaid)",icon:<Layers className="w-8 h-8"/>,
    objectives:['Define dual eligibility.','Identify all MSP categories.','Distinguish partial vs. full duals.'],
    keyPoints:['Duals may get Medicare costs paid by Medicaid and often extra benefits.','Medicare Savings Programs include QMB, SLMB, QI, QDWI; plus FBDE (full Medicaid).','Partial (premium help only) vs. full (Medicaid benefits + some/all Medicare costs).'],
    breakdownBlocks:[
      {type:'h3',text:'Slides 18–20 — Duals & MSPs'},
      {type:'p',text:'Dual eligible individuals qualify for both Medicare and Medicaid. Medicaid can help pay Medicare premiums, deductibles, and copays, and may cover additional services like dental, vision, and transportation.'},
      {type:'h3',text:'Medicare Savings Program Categories'},
      {type:'ul',items:['QMB Only – Pays Part A & B premiums and Medicare cost-sharing; no full Medicaid','QMB Plus – Same as QMB Only + full Medicaid','SLMB Only – Pays Part B premium only','SLMB Plus – Part B premium + full Medicaid','QI – Part B premium only (limited funding)','QDWI – Part A premium only (working disabled)','FBDE – Full Medicaid; state may pay some Medicare costs']},
      {type:'html',html:`<div class="overflow-x-auto"><table class="w-full text-sm border border-gray-300"><thead class="bg-gray-100"><tr><th class="p-2 text-left">Category</th><th class="p-2 text-left">Pays Part A Premium?</th><th class="p-2 text-left">Pays Part B Premium?</th><th class="p-2 text-left">Pays Deductibles/Coinsurance?</th><th class="p-2 text-left">Full Medicaid Benefits?</th></tr></thead><tbody><tr><td class="p-2">QMB Only</td><td class="p-2">✅ (if owed)</td><td class="p-2">✅</td><td class="p-2">✅</td><td class="p-2">❌</td></tr><tr><td class="p-2">QMB Plus</td><td class="p-2">✅</td><td class="p-2">✅</td><td class="p-2">✅</td><td class="p-2">✅</td></tr><tr><td class="p-2">SLMB Only</td><td class="p-2">❌</td><td class="p-2">✅</td><td class="p-2">❌</td><td class="p-2">❌</td></tr><tr><td class="p-2">SLMB Plus</td><td class="p-2">❌</td><td class="p-2">✅</td><td class="p-2">❌</td><td class="p-2">✅</td></tr><tr><td class="p-2">QI</td><td class="p-2">❌</td><td class="p-2">✅</td><td class="p-2">❌</td><td class="p-2">❌</td></tr><tr><td class="p-2">QDWI</td><td class="p-2">✅</td><td class="p-2">❌</td><td class="p-2">❌</td><td class="p-2">❌</td></tr><tr><td class="p-2">FBDE</td><td class="p-2">Varies</td><td class="p-2">Varies</td><td class="p-2">Varies</td><td class="p-2">✅</td></tr></tbody></table></div>`},
      {type:'img',image:{src:'slide_18.png',alt:'Dual eligibility overview',caption:'Slide 18'}},
      {type:'img',image:{src:'slide_19.png',alt:'MSP categories',caption:'Slide 19'}},
      {type:'img',image:{src:'slide_20.png',alt:'Examples & scenarios',caption:'Slide 20'}},
    ],
    miniQuiz:{q:'Which pays both A & B premiums + cost-sharing, but no full Medicaid?',options:['QMB Only','QI','SLMB Only','QDWI'],correctIndex:0},
    extraQuiz:[
      {q:'True/False: SLMB Plus = B premium + full Medicaid.',options:['True','False'],correctIndex:0},
      {q:'QDWI helps:',options:['Retired teachers','Disabled workers losing free Part A','High-income beneficiaries','People with Medicaid only'],correctIndex:1},
      {q:'Which pays B premium only, limited federal funds?',options:['QI','QMB Plus','FBDE','QDWI'],correctIndex:0},
    ],
  },
  {
    id:6,color:"bg-orange-500",title:"Module 6: Medicare Advantage (Part C – MAPD)",icon:<Layers className="w-8 h-8"/>,
    objectives:['Explain MAPD coverage.','Identify extra benefits.','Review SNP categories.'],
    keyPoints:['MAPDs combine Parts A+B and usually Part D, run by private insurers.','Often include extras (dental, vision, hearing, fitness).','SNP types: C-SNP (chronic), D-SNP (dual), I-SNP (institutional).'],
    breakdownBlocks:[
      {type:'h3',text:'Slides 21–23 — MAPD Overview'},
      {type:'ul',items:['Combine Part A + Part B + usually Part D','Operated by private insurers; must cover what Original Medicare covers','Often include extras: dental, vision, hearing, gym memberships']},
      {type:'ul',items:['SNP Types:','• C-SNP – for specific chronic conditions','• D-SNP – for dual eligibles','• I-SNP – for institutionalized members']},
      {type:'img',image:{src:'slide_21.png',alt:'MAPD basics',caption:'Slide 21'}},
      {type:'img',image:{src:'slide_22.png',alt:'MAPD extras',caption:'Slide 22'}},
      {type:'img',image:{src:'slide_23.png',alt:'SNP categories',caption:'Slide 23'}},
    ],
    miniQuiz:{q:'True/False: MAPDs are run by Medicare directly.',options:['True','False'],correctIndex:1},
    extraQuiz:[
      {q:'Which extra benefit may be included?',options:['Vision & dental','Life insurance','Childcare','Auto insurance'],correctIndex:0},
      {q:'I-SNP is for:',options:['Nursing home residents','Pediatrics','Veterans only','Employers'],correctIndex:0},
      {q:'MAPDs must cover at least what Original Medicare covers under:',options:['Parts A & B','Part D only','Medicaid','TRICARE'],correctIndex:0},
    ],
  },
  {
    id:7,color:"bg-purple-500",title:"Module 7: Medicare Advantage – Plan Types",icon:<Layers className="w-8 h-8"/>,
    objectives:['Compare HMO, PPO, HMO-POS, and PFFS plans.'],
    keyPoints:['HMO: in-network only, PCP + referrals, lower cost.','PPO: in/out-of-network, no referrals, higher flexibility/cost.','HMO-POS: HMO with limited out-of-network option.','PFFS: any Medicare-approved provider who accepts plan terms.'],
    breakdownBlocks:[
      {type:'h3',text:'Slides 24–35 — Plan Type Comparison'},
      {type:'ul',items:['HMO – Must use in-network providers; PCP required; referrals; generally lower cost','PPO – Use in- or out-of-network; no referrals; more flexible; higher cost for OON','HMO-POS – HMO with some out-of-network benefits','PFFS – No formal network; provider must accept plan terms at each visit']},
      {type:'img',image:{src:'slide_24.png',alt:'MA overview',caption:'Slide 24'}},
      {type:'img',image:{src:'slide_25.png',alt:'Plan types',caption:'Slide 25'}},
      {type:'img',image:{src:'slide_26.png',alt:'HMO',caption:'Slide 26'}},
      {type:'img',image:{src:'slide_27.png',alt:'PPO',caption:'Slide 27'}},
      {type:'img',image:{src:'slide_28.png',alt:'PFFS',caption:'Slide 28'}},
      {type:'img',image:{src:'slide_29.png',alt:'HMO-POS',caption:'Slide 29'}},
      {type:'img',image:{src:'slide_30.png',alt:'SNP overview',caption:'Slide 30'}},
      {type:'img',image:{src:'slide_31.png',alt:'D-SNP',caption:'Slide 31'}},
      {type:'img',image:{src:'slide_32.png',alt:'C-SNP',caption:'Slide 32'}},
      {type:'img',image:{src:'slide_33.png',alt:'I-SNP',caption:'Slide 33'}},
      {type:'img',image:{src:'slide_34.png',alt:'MOOP/extras',caption:'Slide 34'}},
      {type:'img',image:{src:'slide_35.png',alt:'Star Ratings',caption:'Slide 35'}},
    ],
    miniQuiz:{q:'Which requires referral to a specialist?',options:['PPO','HMO','PFFS','HMO-POS'],correctIndex:1},
    extraQuiz:[
      {q:'True/False: PPOs cover out-of-network care at higher cost.',options:['True','False'],correctIndex:0},
      {q:'Which has no network but provider must accept terms?',options:['PFFS','HMO','PPO','HMO-POS'],correctIndex:0},
      {q:'HMO-POS allows:',options:['Any provider at same cost','Some out-of-network services at higher cost','No referrals in-network','Unlimited OON coverage'],correctIndex:1},
    ],
  },
  {
    id:8,color:"bg-red-500",title:"Module 8: Medicare Part D – Prescription Drug Coverage",icon:<Layers className="w-8 h-8"/>,
    objectives:['Explain Part D coverage.','Understand formularies, tiers, coverage gap.','Recognize penalties.'],
    keyPoints:['PDPs are standalone for Original Medicare; MAPDs include Part D.','Every plan has its own formulary & tiers; costs = premium + deductible + copay/coinsurance.','Late enrollment penalty: 1% of base premium per month without creditable coverage (permanent).'],
    breakdownBlocks:[
      {type:'h3',text:'Slides 36–43, 45, 57 — Part D Essentials'},
      {type:'ul',items:['PDPs: standalone drug plans for those with A and/or B','MAPDs: Medicare Advantage plans that include drug coverage','Formularies & tiers vary; check annually','Costs depend on tier, network (preferred vs standard), and stage (deductible, initial, gap, catastrophic)']},
      {type:'ul',items:['Penalty: 1% of national base beneficiary premium per month without creditable coverage — permanent once applied']},
      {type:'img',image:{src:'slide_36.png',alt:'Part D overview',caption:'Slide 36'}},
      {type:'img',image:{src:'slide_37.png',alt:'Formularies',caption:'Slide 37'}},
      {type:'img',image:{src:'slide_38.png',alt:'Tiers',caption:'Slide 38'}},
      {type:'img',image:{src:'slide_39.png',alt:'Benefit stages',caption:'Slide 39'}},
      {type:'img',image:{src:'slide_40.png',alt:'Pharmacy networks',caption:'Slide 40'}},
      {type:'img',image:{src:'slide_41.png',alt:'Creditable coverage',caption:'Slide 41'}},
      {type:'img',image:{src:'slide_42.png',alt:'Penalties',caption:'Slide 42'}},
      {type:'img',image:{src:'slide_43.png',alt:'MTM programs',caption:'Slide 43'}},
      {type:'img',image:{src:'slide_45.png',alt:'Examples',caption:'Slide 45'}},
      {type:'img',image:{src:'slide_57.png',alt:'Reminders',caption:'Slide 57'}},
    ],
    miniQuiz:{q:'True/False: Every Part D plan has the same formulary.',options:['True','False'],correctIndex:1},
    extraQuiz:[
      {q:'Penalty is based on:',options:['Each month without coverage','Annual income','State of residence','Number of dependents'],correctIndex:0},
      {q:'“Donut hole” refers to:',options:['Deductible','Coverage gap','Catastrophic stage','Out-of-network penalty'],correctIndex:1},
      {q:'Who can join Part D?',options:['Anyone with A and/or B','Only those with C','Medicaid only','Over 70 only'],correctIndex:0},
    ],
  },
  {
    id:9,color:"bg-yellow-500",title:"Module 9: Medigap (Medicare Supplement Insurance)",icon:<Layers className="w-8 h-8"/>,
    objectives:['Define Medigap.','Compare to Medicare Advantage.','Identify enrollment rules.'],
    keyPoints:['Private policies that cover Medicare “gaps”: deductibles, coinsurance, copays.','Plans standardized A–N; C & F not available to new enrollees after Jan 1, 2020.','Must have Parts A & B; best time to buy is 6-month Medigap Open Enrollment after Part B start (age 65+).'],
    breakdownBlocks:[
      {type:'h3',text:'Slides 47–52 — Medigap Overview'},
      {type:'p',text:'Medigap plans help pay some costs not covered by Original Medicare, such as copays, coinsurance, and deductibles. Benefits are standardized by letter across insurers.'},
      {type:'ul',items:['Must have Parts A & B to enroll','Plans A–N; C & F unavailable for new enrollees after 1/1/2020','6-month Medigap Open Enrollment (when 65+ and enrolled in Part B) is generally the best time to buy']},
      {type:'img',image:{src:'slide_47.png',alt:'Medigap basics',caption:'Slide 47'}},
      {type:'img',image:{src:'slide_48.png',alt:'Standardized plans',caption:'Slide 48'}},
      {type:'img',image:{src:'slide_49.png',alt:'Enrollment timing',caption:'Slide 49'}},
      {type:'img',image:{src:'slide_50.png',alt:'What Medigap does not cover',caption:'Slide 50'}},
      {type:'img',image:{src:'slide_51.png',alt:'Pair with Part D',caption:'Slide 51'}},
      {type:'img',image:{src:'slide_52.png',alt:'Guaranteed issue examples',caption:'Slide 52'}},
    ],
    miniQuiz:{q:'True/False: You must have A & B to buy Medigap.',options:['True','False'],correctIndex:0},
    extraQuiz:[
      {q:'Plans no longer available for new enrollees after 2020?',options:['A & G','C & F','K & L','N & D'],correctIndex:1},
      {q:'Medigap covers:',options:['Copays, coinsurance, deductibles','Prescription drugs','Long-term care','Dental & vision by default'],correctIndex:0},
      {q:'Which offers more provider freedom?',options:['Medicare Advantage','Medigap','Part D','Medicaid'],correctIndex:1},
    ],
  },
];

/***********************
 * Runtime dataset validator (lightweight tests)
 ***********************/
function validateDataset(mods: ModuleDef[]) {
  const errors: string[] = [];
  mods.forEach((m) => {
    const allQs: MCQ[] = [m.miniQuiz, ...(m.extraQuiz || [])];
    allQs.forEach((q, idx) => {
      if (q.correctIndex < 0 || q.correctIndex >= q.options.length) {
        errors.push(`Module ${m.id} Q${idx}: correctIndex out of range`);
      }
    });
  });
  if (errors.length && typeof window !== 'undefined') {
    // eslint-disable-next-line no-console
    console.warn('[AHM dataset validation]', errors);
  }
  return errors;
}

/***********************
 * Main component
 ***********************/
export default function MedicareTrainingApp(){
  const runtimeModules: ModuleDef[]|undefined = (typeof window!=="undefined" && (window as any).AHM_MODULES) ? (window as any).AHM_MODULES as ModuleDef[] : undefined;
  const DATASET: ModuleDef[] = runtimeModules && Array.isArray(runtimeModules) ? runtimeModules : MODULES;
  type Step = 'welcome'|'module'|'exam'|'results';
  const [step,setStep]=useState<Step>('welcome');
  const [index,setIndex]=useState(0);
  const [answers,setAnswers]=useState<Record<string,number|null>>({});
  const [submitted,setSubmitted]=useState<Record<string,boolean>>({});
  const [graded,setGraded]=useState<Record<string,number|null>>({}); // last submitted choice per question

  // dataset validation (tests)
  useEffect(()=>{ validateDataset(DATASET); },[DATASET]);

  // Build + shuffle exam
  const FINAL_EXAM: ExamItem[] = useMemo(()=>{
    const items:ExamItem[]=[];
    DATASET.forEach(m=>{
      items.push({...m.miniQuiz,moduleId:m.id,moduleTitle:m.title,sourceKey:`m-${m.id}-0`});
      m.extraQuiz?.forEach((q,qi)=>items.push({...q,moduleId:m.id,moduleTitle:m.title,sourceKey:`m-${m.id}-${qi+1}`}));
    });
    for(let i=items.length-1;i>0;i--){ const j=(Math.random()*(i+1))|0; [items[i],items[j]]=[items[j],items[i]]; }
    return items;
  },[DATASET]);

  // module gradient palette (one per module index)
  const MODULE_GRADIENTS = [
    'linear-gradient(135deg,#7c3aed 0%, #06b6d4 100%)',
    'linear-gradient(135deg,#10b981 0%, #06b6d4 100%)',
    'linear-gradient(135deg,#3b82f6 0%, #7c3aed 100%)',
    'linear-gradient(135deg,#6366f1 0%, #ef4444 100%)',
    'linear-gradient(135deg,#0ea5a4 0%, #f59e0b 100%)',
    'linear-gradient(135deg,#f97316 0%, #ef4444 100%)',
    'linear-gradient(135deg,#8b5cf6 0%, #ef4444 100%)',
    'linear-gradient(135deg,#ef4444 0%, #f97316 100%)',
    'linear-gradient(135deg,#f59e0b 0%, #7c3aed 100%)',
  ];

  const [examSelections,setExamSelections]=useState<Record<number,number|null>>({});
  const [examSubmitted,setExamSubmitted]=useState(false);
  const [examScore,setExamScore]=useState(0);
  const [showConfetti,setShowConfetti]=useState(false);
  const [confettiTimeout,setConfettiTimeout]=useState<number|null>(null);

  // On mount: keyframes
  useEffect(()=>{ ensureConfettiKeyframes(); },[]);

  // Navigation
  const startTraining=useCallback(()=>{ setIndex(0); setStep('module'); },[]);
  const openModule=useCallback((i:number)=>{ setIndex(i); setStep('module'); },[]);
  const goHome=useCallback(()=>setStep('welcome'),[]);

  // Progress
  const progress = step==='module'?((index+1)/DATASET.length)*100: step==='welcome'?0:100;
  const current = DATASET[index];

  // Gate per-module
  const canProceed = useMemo(()=>{
    if(step!=='module') return false; const cur=DATASET[index]; if(!cur) return false;
    const keys=[`m-${cur.id}-0`,...(cur.extraQuiz?.map((_,qi)=>`m-${cur.id}-${qi+1}`)||[])];
    const answered = keys.filter(k=>submitted[k]).length;
    const correct = keys.filter(k=>{ const sel=(graded[k]??-1) as number; if(k===`m-${cur.id}-0`) return sel===cur.miniQuiz.correctIndex; const qi=parseInt(k.split('-').pop()||'1',10)-1; return sel===(cur.extraQuiz?.[qi]?.correctIndex??-1); }).length;
    return answered===keys.length && (correct/keys.length)>=MODULE_PASS;
  },[step,DATASET,index,submitted,graded]);

  const next=useCallback(()=>{
    if(step==='module'&&!canProceed) return;
    if(step==='module'&&index<DATASET.length-1){ setIndex(index+1); }
    else if(step==='module'&&index===DATASET.length-1){ setStep('exam'); }
  },[step,index,DATASET.length,canProceed]);

  const prev=useCallback(()=>{
    if(step==='module'){ if(index>0) setIndex(index-1); else setStep('welcome'); }
    else if(step==='exam'){ setStep('module'); setIndex(DATASET.length-1); }
    else if(step==='results'){ setStep('exam'); }
  },[step,index,DATASET.length]);

  const examAllAnswered = useMemo(()=>FINAL_EXAM.every((_,i)=>examSelections[i]!==null&&examSelections[i]!==undefined),[FINAL_EXAM,examSelections]);

  const submitExam=useCallback(()=>{
    if(!examAllAnswered) return;
    let correct = 0;
    FINAL_EXAM.forEach((it,i)=>{ if(examSelections[i]===it.correctIndex) correct++; });
    const pct = correct / FINAL_EXAM.length;
    setExamScore(pct);
    setExamSubmitted(true);
    setStep('results');
    if(pct>=PASS_THRESHOLD){
      setShowConfetti(true);
      const t = window.setTimeout(()=>setShowConfetti(false),3500);
      setConfettiTimeout(t);
    }
  },[examAllAnswered,FINAL_EXAM,examSelections]);

  const resetExam=useCallback(()=>{ setExamSelections({}); setExamSubmitted(false); setExamScore(0); setStep('exam'); },[]);

  useEffect(()=>{
    return ()=>{
      if (confettiTimeout !== null) {
        window.clearTimeout(confettiTimeout);
      }
    };
  },[confettiTimeout]);

  // Handlers for knowledge check submit (per-question)
  const handleSubmitQuestion = useCallback((key: string, value: number | null = null) => {
    const val = value !== null ? value : (answers[key] ?? null);
    setSubmitted((prev: Record<string, boolean>) => ({ ...prev, [key]: true }));
    setGraded((prev: Record<string, number | null>) => ({ ...prev, [key]: val }));
  }, [answers]);

  return (
    <div className="min-h-screen bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-sans">
      {showConfetti && <ConfettiBurst/>}
      <div className="max-w-6xl mx-auto p-6 md:p-10 fade-in">
        <header className="site-header" style={{justifyContent:'center'}}>
          <h1 className="site-title">American Health Marketplace</h1>
        </header>
        <AnimatePresence mode="wait">
          {step==='welcome' && (
            <motion.section key="welcome">
              <h1 className="text-5xl font-bold text-center mb-6 h1-gradient"><Sparkles className="inline w-10 h-10 text-yellow-300"/> Welcome to the Medicare Training Program!</h1>
              <div className="max-w-4xl mx-auto" style={{marginBottom: '40px'}}>
                <Card className="card-glass">
                  <CardContent>
                    <h3 className="h2">Program Overview</h3>
                    <p className="p-muted mt-2">This interactive training introduces Medicare, its parts, costs, eligibility, and supplemental coverage options. Participants will learn through modules, objectives, real-world scenarios, and quizzes with instant feedback.</p>
                  </CardContent>
                </Card>
              </div>

              <div className="module-grid" style={{marginTop: '28px'}}>
                {DATASET.map((m,i)=>(
                  <button key={m.id} onClick={()=>openModule(i)} className={cx('module-tile','tile-gradient-border','pop-press')} style={{background: MODULE_GRADIENTS[i % MODULE_GRADIENTS.length]}}>
                    <div style={{width:56,height:56,display:'flex',alignItems:'center',justifyContent:'center',borderRadius:12,background:'rgba(255,255,255,0.06)'}}>
                      {m.icon ?? <Layers className="w-6 h-6"/>}
                    </div>
                    <span className="mt-3 block title">{m.title}</span>
                  </button>
                ))}
              </div>
              <div className="text-center mt-12">
                <Button onClick={startTraining} className="btn-yellow btn-pill">🚀 Let’s Dive In!</Button>
              </div>
            </motion.section>
          )}

          {step==='module' && current && (
            <motion.section key="module">
              <div className="flex items-center gap-3 mb-4">
                <Button onClick={()=>setStep('welcome')} className="btn-ghost"><Home className="w-4 h-4 mr-2"/> Home</Button>
                <span className="flex-1 text-small">Module {index+1} of {DATASET.length}</span>
              </div>
              <Progress value={progress} className="h-2"/>
              <Card className="mt-6 bg-white text-gray-900"><CardContent>
                <h2 className="text-2xl font-bold mb-4">{current.title}</h2>
                <section className="mt-6"><h3 className="font-semibold">Learning Objectives</h3><ul className="list-disc ml-5 mt-2">{current.objectives.map((o,i)=>(<li key={i}>{o}</li>))}</ul></section>
                <section className="mt-6"><h3 className="font-semibold">Key Points</h3><ul className="list-disc ml-5 mt-2">{current.keyPoints.map((k,i)=>(<li key={i}>{k}</li>))}</ul></section>
                <section className="mt-6"><h3 className="font-semibold">Breakdown</h3>
                  {current.breakdownBlocks && current.breakdownBlocks.length ? (
                    <div className="mt-2 space-y-3">
                      {current.breakdownBlocks.map((blk,i)=>{
                        if(blk.type==='p') return <p key={i} className="leading-relaxed">{blk.text}</p>;
                        if(blk.type==='h3') return <h4 key={i} className="text-lg font-bold">{blk.text}</h4>;
                        if(blk.type==='quote') return <blockquote key={i} className="border-l-4 pl-3 italic text-gray-700">{blk.text}</blockquote>;
                        if(blk.type==='ul'&&blk.items) return <ul key={i} className="list-disc ml-6 space-y-1">{blk.items.map((it,j)=>(<li key={j}>{it}</li>))}</ul>;
                        if(blk.type==='ol'&&blk.items) return <ol key={i} className="list-decimal ml-6 space-y-1">{blk.items.map((it,j)=>(<li key={j}>{it}</li>))}</ol>;
                        if(blk.type==='img'&&blk.image){ const src=resolveAsset(blk.image.src); return (
                          <figure key={i} className="bg-gray-50 rounded-xl p-3">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={src} alt={blk.image.alt||''} loading="lazy" decoding="async" className="w-full rounded-md" onError={e=>{(e.target as HTMLImageElement).style.display='none'}}/>
                            {(blk.image.caption||blk.image.alt)&&(<figcaption className="mt-2 text-sm text-gray-600">{blk.image.caption||blk.image.alt}</figcaption>)}
                          </figure>
                        );}
                        if(blk.type==='html'&&blk.html) return <div key={i} className="prose max-w-none" dangerouslySetInnerHTML={{__html:blk.html}}/>;
                        return null;
                      })}
                    </div>
                  ) : (<p className="mt-2 whitespace-pre-line">{current.breakdown}</p>)}
                </section>

                {/* Knowledge Check */}
                <section className="mt-6"><h3 className="text-lg font-semibold">Knowledge Check</h3>
                  <p className="mt-2 font-medium">{current.miniQuiz.q}</p>
                  <fieldset className="mt-4 space-y-3" role="radiogroup" aria-label={`Mini quiz for ${current.title}`}>
                    <legend className="sr-only">Mini quiz choices</legend>
                    {current.miniQuiz.options.map((opt,i)=>{ const key=`m-${current.id}-0`; const sel=answers[key]??null; const wasSubmitted=submitted[key]??false; const gradedSel = graded[key] ?? null; const canSubmit = sel!==null && !(wasSubmitted && gradedSel===current.miniQuiz.correctIndex); return (
                      <label key={i} className={`block flex items-center gap-2 p-2 rounded-md border ${sel===i?'border-indigo-600':'border-gray-200'}`}>
                        <input type="radio" name={`q-${key}`} checked={sel===i} onChange={()=>setAnswers(prev=>({...prev,[key]:i}))}/>
                        <span>{opt}</span>
                      </label>
                    );})}
                  </fieldset>
                  {(()=>{ const key=`m-${current.id}-0`; const sel=answers[key]??null; const wasSubmitted=submitted[key]??false; const gradedSel = graded[key] ?? null; const correct = gradedSel===current.miniQuiz.correctIndex; const disableSubmit = sel===null || (wasSubmitted && correct); return (
                    <div className="mt-4 flex items-center gap-4 quiz-submit-row">
                      <Button onClick={()=>handleSubmitQuestion(key, sel as number|null)} disabled={disableSubmit} className="quiz-submit bg-indigo-600 hover:bg-indigo-700 text-white">{wasSubmitted? (correct? 'Submitted' : 'Resubmit') : 'Submit'}</Button>
                      {wasSubmitted && (
                        <span className={`text-sm font-semibold ${correct?'text-green-600':'text-red-600'}`} aria-live="polite">{correct?'✅ Correct!':'❌ Not quite. Review above and try again.'}</span>
                      )}
                    </div>
                  );})()}
                </section>

                {!!current.extraQuiz?.length && (
                  <section className="mt-6 space-y-4">
                    {current.extraQuiz.map((q,qi)=>{ const key=`m-${current.id}-${qi+1}`; const sel=answers[key]??null; const wasSubmitted=submitted[key]??false; const gradedSel = graded[key] ?? null; const correct = gradedSel===q.correctIndex; const disableSubmit = sel===null || (wasSubmitted && correct); return (
                      <div key={key}>
                        <p className="font-medium">{q.q}</p>
                        {q.options.map((opt,oi)=>(
                          <label key={oi} className={`block p-2 rounded-md border ${sel===oi?'border-indigo-600':'border-gray-200'} mt-1`}>
                            <input type="radio" name={`q-${key}`} checked={sel===oi} onChange={()=>setAnswers(prev=>({...prev,[key]:oi}))}/> {opt}
                          </label>
                        ))}
                        <div className="mt-4 flex items-center gap-4 quiz-submit-row">
                          <Button onClick={()=>handleSubmitQuestion(key, sel as number|null)} disabled={disableSubmit} className="quiz-submit bg-indigo-600 hover:bg-indigo-700 text-white">{wasSubmitted? (correct? 'Submitted' : 'Resubmit') : 'Submit'}</Button>
                          {wasSubmitted && (<span className={`text-sm font-semibold ${correct?'text-green-600':'text-red-600'}`}>{correct?'✅ Correct!':'❌ Try again'}</span>)}
                        </div>
                      </div>
                    );})}
                  </section>
                )}

                <footer className="mt-8 flex justify-between items-center">
                  <Button onClick={prev} className="btn-ghost"><ArrowLeft className="w-4 h-4 mr-2"/> Previous</Button>
                  <Button onClick={next} disabled={!canProceed} className={cx(canProceed? 'btn-primary':'btn btn-disabled') }>
                    {index===DATASET.length-1?'Begin Final Exam':<>Next <ArrowRight className="w-4 h-4 ml-2"/></>}
                  </Button>
                </footer>
              </CardContent></Card>
            </motion.section>
          )}

          {step==='exam' && (
            <motion.section key="exam">
              <div className="flex items-center gap-3 mb-4">
                <Button onClick={prev}><ArrowLeft className="w-4 h-4 mr-2"/> Back</Button>
                <span className="flex-1 text-sm">Final Exam • {FINAL_EXAM.length} questions • Passing {Math.round(PASS_THRESHOLD*100)}%</span>
              </div>
              <Progress value={100} className="h-2"/>
              <Card className="mt-6 bg-white text-gray-900"><CardContent>
                <h2 className="text-2xl font-bold">Final Exam</h2>
                <p className="text-gray-700 mt-1">Answer all questions. You must score {Math.round(PASS_THRESHOLD*100)}% or higher to pass.</p>
                <div className="mt-6 space-y-6">
                  {FINAL_EXAM.map((item,i)=>{ const sel=examSelections[i]??null; return (
                    <div key={i} className="border rounded-xl p-4">
                      <div className="text-sm text-gray-600 mb-1">{item.moduleTitle}</div>
                      <p className="font-medium">{i+1}. {item.q}</p>
                      <div className="mt-2 space-y-2">
                        {item.options.map((opt,oi)=>(
                          <label key={oi} className={`flex items-center gap-2 p-2 rounded-md border ${sel===oi?'border-indigo-600':'border-gray-200'}`}>
                            <input type="radio" name={`exam-${i}`} checked={sel===oi} onChange={()=>setExamSelections((prev: Record<number, number | null>)=>({...prev,[i]:oi}))}/>
                            <span>{opt}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  );})}
                </div>
                <div className="mt-6 flex items-center gap-3">
                  <Button className={cx(examAllAnswered? 'btn-primary' : 'btn btn-disabled')} disabled={!examAllAnswered} onClick={submitExam}>Submit Exam</Button>
                  <a href={resolveAsset(QUIZ_FILE_NAME)} target="_blank" rel="noreferrer"><Button className="btn-yellow">Open Printable Quiz</Button></a>
                </div>
              </CardContent></Card>
            </motion.section>
          )}

          {step==='results' && (
            <motion.section key="results" className="text-center">
              <GraduationCap className="w-16 h-16 mx-auto text-yellow-300 mb-4"/>
              <h2 className="text-4xl font-bold">Final Exam Results</h2>
              <p className="mt-2 text-white/90">Score: <span className="font-bold">{Math.round(examScore*100)}%</span> — {examScore>=PASS_THRESHOLD?'Passed ✅':'Try Again ❌'}</p>
              <div className="mt-6 flex items-center justify-center gap-3">
                <Button onClick={()=>{setStep('welcome'); setIndex(0);}} className="btn-ghost">Back to Home</Button>
                <Button onClick={resetExam} className="btn-primary">Retake Exam</Button>
              </div>
              {examSubmitted && (
                <Card className="mt-8 bg-white text-gray-900 text-left max-w-4xl mx-auto"><CardContent>
                  <h3 className="text-xl font-bold mb-4">Review</h3>
                  <div className="space-y-4">
                    {FINAL_EXAM.map((item,i)=>{ const sel = (examSelections[i] ?? null) as number | null; const correct = sel === item.correctIndex; if(correct) return null; return (
                      <div key={i} className="border rounded-xl p-4">
                        <div className="text-sm text-gray-600 mb-1">{item.moduleTitle}</div>
                        <p className="font-medium">{i+1}. {item.q}</p>
                        <p className="mt-2"><span className="font-semibold">Your answer:</span> {item.options[sel as number]??'(blank)'}</p>
                        <p className="mt-1 text-green-700"><span className="font-semibold">Correct answer:</span> {item.options[item.correctIndex]}</p>
                      </div>
                    );})}
                  </div>
                  <div className="mt-6"><a href={resolveAsset(QUIZ_FILE_NAME)} target="_blank" rel="noreferrer"><Button className="bg-yellow-400 text-black">Open Printable Quiz</Button></a></div>
                </CardContent></Card>
              )}
            </motion.section>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
