/**
 * ─────────────────────────────────────────────────────────────
 *  PORTFOLIO CONTENT — edit everything here.
 *  Every piece of text, metric, tag and link shown in the
 *  3D resume lives in this file.
 * ─────────────────────────────────────────────────────────────
 */

export type StationId = 'academics' | 'experience' | 'trading' | 'coding';

export interface Metric {
  label: string;
  value: string;
}

export interface Section {
  heading: string;
  /** Rendered as a bullet list */
  items?: string[];
  /** Rendered as pill tags */
  tags?: string[];
  /** Rendered as a short paragraph */
  body?: string;
}

export interface LinkItem {
  label: string;
  href: string;
}

export interface Project {
  name: string;
  description: string;
  tags: string[];
  links?: LinkItem[];
}

export interface StationContent {
  id: StationId;
  /** Short name used in the dock + 3D label */
  navLabel: string;
  /** Tiny line shown under the floating 3D label */
  tagline: string;
  title: string;
  subtitle: string;
  summary: string;
  metrics: Metric[];
  sections: Section[];
  projects?: Project[];
  links?: LinkItem[];
}

export const profile = {
  name: 'Bastian Hellarvik',
  oneLiner: 'Working toward a career in quantitative finance.',
  location: 'San Marcos, CA',
  links: [
    { label: 'Resume', href: '/Bastian_Hellarvik_Resume.pdf' },
    { label: 'LinkedIn', href: 'https://www.linkedin.com/in/bastianhellarvik/' },
    { label: 'GitHub', href: 'https://github.com/bastianfh' },
    { label: 'Email', href: 'mailto:bastianfh@gmail.com' },
  ] as LinkItem[],
};

export const stations: Record<StationId, StationContent> = {
  academics: {
    id: 'academics',
    navLabel: 'Academics',
    tagline: 'Education',
    title: 'B.S. in Business Administration',
    subtitle: 'Finance Emphasis · California State University San Marcos',
    summary:
      'Working toward a career in quantitative finance. Finance student studying for the CFA Level I exam, trilingual, with study and work across the U.S., Japan and Norway.',
    metrics: [
      { label: 'GPA', value: '3.33 / 4.0' },
      { label: 'Graduation', value: 'Fall 2026' },
      { label: 'Honors', value: "Dean's List (2x)" },
      { label: 'CFA Level I', value: 'Studying' },
    ],
    sections: [
      {
        heading: 'Relevant Coursework',
        tags: [
          'Advanced Corporate Finance',
          'Advanced Investment Analysis',
          'Business Strategy',
          'Macroeconomics',
          'Microeconomics',
          'Calculus',
        ],
      },
      {
        heading: 'Earlier Education',
        items: [
          'Temple University Japan Campus, Tokyo: B.S. in Business Administration, 2022–2024 (transferred to CSUSM)',
          'UWC ISAK Japan, Nagano: International Baccalaureate Diploma, 2019–2022',
        ],
      },
      {
        heading: 'Certifications',
        items: ['Chartered Financial Analyst (CFA) Program: studying for the Level I exam', 'Google Data Analytics Professional Certificate'],
      },
      {
        heading: 'Leadership & Activities',
        items: ['Finance Society, CSUSM: Member'],
      },
    ],
  },

  experience: {
    id: 'experience',
    navLabel: 'Experience',
    tagline: 'Work History',
    title: 'Work Experience',
    subtitle: 'United States · Japan · Norway',
    summary:
      'Roles in three countries: running event-day operations for CSUSM Athletics, waiting tables in Tokyo, and teaching in Oslo.',
    metrics: [
      { label: 'Current Role', value: 'Building Lead' },
      { label: 'Countries', value: '3' },
      { label: 'Languages', value: '3' },
      { label: 'Working Since', value: '2022' },
    ],
    sections: [
      {
        heading: 'Building Lead · CSUSM Department of Athletics',
        body: 'San Marcos, CA · May 2024–Present',
        items: [
          'Manage sales reporting, daily accounting reconciliation and document filing for home athletic events',
          'Facilitate event logistics and coordinate on-site staff to ensure smooth, on-time execution',
        ],
      },
      {
        heading: 'Waiter · Rigoletto Bar & Grill',
        body: 'Tokyo, Japan · Aug 2022–Oct 2022',
        items: [
          'Reached working proficiency in Japanese through daily communication with guests and kitchen staff',
          'Compiled and analyzed order data to identify popular menu items, streamlining the serving process',
        ],
      },
      {
        heading: 'Teacher · Rodtvet Kindergarten',
        body: 'Oslo, Norway · June 2022–Aug 2022',
        items: [
          'Led educational sessions for children with special needs, adapting methods to individual learning styles',
          'Supported international students in building confidence speaking conversational Norwegian',
        ],
      },
      {
        heading: 'Languages',
        tags: ['Norwegian (native)', 'English (native)', 'Japanese (working proficiency)'],
      },
    ],
  },

  trading: {
    id: 'trading',
    navLabel: 'Trading',
    tagline: 'Technical FX Trading',
    title: 'Technical FX Trading',
    subtitle: 'Self-Employed FX Trader · June 2023–Present',
    summary:
      'Designed and executed a technical FX trading strategy across MetaTrader, cTrader, NinjaTrader and TradingView.',
    metrics: [{ label: 'Cumulative Profit · 3 Years', value: '$31,500' }],
    sections: [
      {
        heading: 'Approach',
        items: [
          'Technical analysis across multiple currency pairs',
          'Excel models to backtest strategies and track risk-adjusted performance',
        ],
      },
      {
        heading: 'Risk Management',
        items: ['Risks 1–2% of the account per trade'],
      },
      {
        heading: 'Platforms',
        tags: ['MetaTrader 4/5', 'cTrader', 'NinjaTrader', 'TradingView'],
      },
    ],
  },

  coding: {
    id: 'coding',
    navLabel: 'Coding',
    tagline: 'Python Projects',
    title: 'Coding Projects',
    subtitle: 'Python · Streamlit · pytest',
    summary: 'Two live web apps built in Python, each with a plain-language mode so non-specialists can read the results.',
    metrics: [
      { label: 'Primary Language', value: 'Python' },
      { label: 'Live Apps', value: '2' },
      { label: 'Automated Tests', value: '420' },
      { label: 'Apps', value: 'Streamlit · Plotly' },
    ],
    projects: [
      {
        name: 'Options Pricing Lab',
        description:
          'Prices options four ways (Black-Scholes / Garman-Kohlhagen for FX, binomial tree, Monte Carlo and Crank-Nicolson finite differences), with the pricing math written from scratch. Each method’s error shrinks at the rate theory predicts, and 420 automated tests run on every push. Recommended by my finance professor as a tool for the class’s final project.',
        tags: ['Python', 'NumPy', 'SciPy', 'Streamlit', 'pytest', 'GitHub Actions'],
        links: [
          { label: 'Open app', href: 'https://options-pricing-lab-bastianfh.streamlit.app/' },
          { label: 'GitHub', href: 'https://github.com/bastianfh/options-pricing-lab' },
        ],
      },
      {
        name: 'Volatility Regime Monitor',
        description:
          'A three-state hidden Markov model labels markets as calm, normal or turbulent from daily price moves, then tests whether forecasts, risk-managed strategies and trading signals improve after costs. Covers major FX pairs, gold and US indices.',
        tags: ['Python', 'Streamlit', 'Hidden Markov Model'],
        links: [
          { label: 'Open app', href: 'https://volatility-regime-monitor-bastianfh.streamlit.app' },
          { label: 'GitHub', href: 'https://github.com/bastianfh/volatility-regime-monitor' },
        ],
      },
    ],
    sections: [
      {
        heading: 'Languages & Libraries',
        tags: ['Python', 'pandas', 'NumPy', 'SciPy', 'Plotly', 'Streamlit', 'pytest', 'SQL'],
      },
      {
        heading: 'Tools',
        tags: ['Git / GitHub', 'GitHub Actions', 'Claude Code', 'Excel', 'Google Sheets', 'Airtable', 'Microsoft Dynamics', 'Microsoft 365', 'Google Workspace'],
      },
    ],
  },
};

/** Order of stations in the arc (left → right) and in the dock */
export const stationOrder: StationId[] = ['academics', 'experience', 'trading', 'coding'];
