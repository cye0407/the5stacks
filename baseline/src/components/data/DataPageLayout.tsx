"use client";

import Link from 'next/link';
import { ArrowLeft, Plus, Download, Upload } from 'lucide-react';
import { Button, Card, CardTitle, ProgressBar } from '@/components/ui';
import { cn } from '@/lib/utils/cn';
import type { LucideIcon } from 'lucide-react';

interface DataPageLayoutProps {
  title: string;
  description: string;
  icon: LucideIcon;
  iconColor: string;
  progress: number;
  itemCount: number;
  children: React.ReactNode;
  onAddNew?: () => void;
  addNewLabel?: string;
  tips?: { title: string; description: string }[];
  trackingContent?: React.ReactNode;
  backLink?: string;
}

export function DataPageLayout({
  title,
  description,
  icon: Icon,
  iconColor,
  progress,
  itemCount,
  children,
  onAddNew,
  addNewLabel = 'Add Entry',
  tips,
  trackingContent,
  backLink = '/data',
}: DataPageLayoutProps) {
  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-8">
        <div className="flex items-start gap-4">
          <Link
            href={backLink}
            className="mt-1 p-2 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>

          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', iconColor)}>
                <Icon className="w-5 h-5" />
              </div>
              <h1 className="text-2xl font-bold text-deep-forest">{title}</h1>
            </div>
            <p className="text-gray-500 ml-13">{description}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 ml-13 lg:ml-0">
          <Button variant="outline" size="sm">
            <Upload className="w-4 h-4 mr-2" />
            Import
          </Button>
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          {onAddNew && (
            <Button onClick={onAddNew}>
              <Plus className="w-4 h-4 mr-2" />
              {addNewLabel}
            </Button>
          )}
        </div>
      </div>

      {/* Progress + Tracking Row */}
      <div className={cn('grid gap-4 mb-4', trackingContent ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1')}>
        {/* Progress Card */}
        <Card className="bg-cream py-3 px-4">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-1">
                <span className="text-xs font-medium text-gray-600">Data Completeness</span>
                <span className="text-xs text-gray-400">
                  {itemCount} {itemCount === 1 ? 'entry' : 'entries'}
                </span>
              </div>
              <ProgressBar value={progress} size="sm" className="max-w-xs" />
            </div>
            <div className="text-center border border-gray-200 rounded-lg px-3 py-2 bg-white min-w-[70px] ml-4">
              <div className="text-base font-bold text-primary">{progress}%</div>
              <div className="text-xs text-gray-500">done</div>
            </div>
          </div>
        </Card>

        {/* Tracking Content (optional second column) */}
        {trackingContent && (
          <Card className="bg-gray-50 py-3 px-4">
            {trackingContent}
          </Card>
        )}
      </div>

      {/* Main Content */}
      {children}

      {/* Tips Card */}
      {tips && tips.length > 0 && (
        <Card className="mt-8 bg-cream border-forest-300">
          <CardTitle className="text-forest-700 mb-3">Tips for Better Data</CardTitle>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            {tips.map((tip, index) => (
              <div key={index}>
                <p className="font-medium text-gray-900 mb-1">{tip.title}</p>
                <p className="text-gray-600">{tip.description}</p>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
