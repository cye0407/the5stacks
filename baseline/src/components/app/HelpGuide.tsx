"use client";

import Link from 'next/link';
import {
  SquaresFour,
  Database,
  Export,
  GearSix,
  TreeStructure,
} from '@phosphor-icons/react';
import { Modal } from '@/components/ui';

interface HelpGuideProps {
  isOpen: boolean;
  onClose: () => void;
}

const sections = [
  {
    icon: SquaresFour,
    title: 'Dashboard',
    description: 'Your home base. See data coverage, key metrics, and what to do next.',
    href: '/dashboard',
  },
  {
    icon: Database,
    title: 'Data',
    description: 'Enter operational data across 8 domains to build your sustainability baseline.',
    href: '/data',
  },
  {
    icon: Export,
    title: 'Exports',
    description: 'Download structured reports to respond to buyer questionnaires.',
    href: '/exports',
  },
  {
    icon: GearSix,
    title: 'Settings',
    description: 'Edit company profile, manage sites, and load demo data.',
    href: '/settings',
  },
];

export function HelpGuide({ isOpen, onClose }: HelpGuideProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Help Guide" size="md">
      <div className="space-y-4">
        {sections.map((section) => {
          const Icon = section.icon;
          return (
            <Link
              key={section.href}
              href={section.href}
              onClick={onClose}
              className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors group"
            >
              <div className="w-9 h-9 rounded-lg bg-primary-100 flex items-center justify-center shrink-0">
                <Icon className="w-5 h-5 text-primary" weight="duotone" />
              </div>
              <div>
                <div className="text-sm font-semibold text-gray-900 group-hover:text-primary transition-colors">
                  {section.title}
                </div>
                <div className="text-xs text-gray-500 mt-0.5">
                  {section.description}
                </div>
              </div>
            </Link>
          );
        })}

        {/* Five Stacks Framework section */}
        <div className="border-t border-gray-100 pt-4 mt-4">
          <div className="flex items-start gap-3 p-3">
            <div className="w-9 h-9 rounded-lg bg-stack-3/10 flex items-center justify-center shrink-0">
              <TreeStructure className="w-5 h-5 text-stack-3" weight="duotone" />
            </div>
            <div>
              <div className="text-sm font-semibold text-gray-900">Five Stacks Framework</div>
              <div className="text-xs text-gray-500 mt-0.5">
                A structured approach to sustainability — from baseline data collection through strategic transformation.
              </div>
              <div className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-primary bg-primary-100 px-2 py-1 rounded-full">
                You are here: Stack 1 (Baseline)
              </div>
              <p className="text-xs text-gray-400 mt-2">
                Tip: Completing your SWOT analysis prepares you for Stack 2.
              </p>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}
