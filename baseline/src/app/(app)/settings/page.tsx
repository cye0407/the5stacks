"use client";

import { useState, useRef } from 'react';
import {
  Buildings,
  MapPin,
  Target,
  ShieldCheck,
  Trash,
  Plus,
  PencilSimple,
  Image,
  UploadSimple,
  X
} from '@phosphor-icons/react';
import { Card, CardTitle, Button, Input, Select, TextArea, Badge, Modal, ConfirmDialog } from '@/components/ui';
import { useAppStore } from '@/stores/appStore';
import { useDataStore } from '@/stores/dataStore';
import { cn } from '@/lib/utils/cn';
import type { Site, SiteType, SiteOwnership } from '@/types';

type SettingsTab = 'profile' | 'company' | 'sites' | 'goals' | 'data';

const siteTypeOptions = [
  { value: 'hq', label: 'Headquarters' },
  { value: 'production', label: 'Production / Manufacturing' },
  { value: 'warehouse', label: 'Warehouse / Distribution' },
  { value: 'office', label: 'Office' },
  { value: 'retail', label: 'Retail' },
  { value: 'mixed', label: 'Mixed Use' },
  { value: 'other', label: 'Other' },
];

const ownershipOptions = [
  { value: 'owned', label: 'Owned' },
  { value: 'leased', label: 'Leased' },
  { value: 'shared', label: 'Shared' },
];

export default function SettingsPage() {
  const { company, sites, swot, goals, companyLogo, updateCompany, addSite, updateSite, removeSite, updateSwot, updateGoals, setCompanyLogo } =
    useAppStore();
  const { resetDataStore } = useDataStore();

  const [activeTab, setActiveTab] = useState<SettingsTab>('company');
  const [showSiteModal, setShowSiteModal] = useState(false);
  const [editingSite, setEditingSite] = useState<Site | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [siteToDelete, setSiteToDelete] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [siteForm, setSiteForm] = useState<Partial<Site>>({
    siteName: '',
    siteType: 'production',
    country: '',
    city: '',
    ownership: 'leased',
    isPrimary: false,
  });

  const tabs = [
    { id: 'company' as SettingsTab, label: 'Company', icon: Buildings },
    { id: 'sites' as SettingsTab, label: 'Sites', icon: MapPin },
    { id: 'goals' as SettingsTab, label: 'Goals & SWOT', icon: Target },
    { id: 'data' as SettingsTab, label: 'Data Management', icon: ShieldCheck },
  ];

  const handleAddSite = () => {
    setEditingSite(null);
    setSiteForm({
      siteName: '',
      siteType: 'production',
      country: '',
      city: '',
      ownership: 'leased',
      isPrimary: false,
    });
    setShowSiteModal(true);
  };

  const handleEditSite = (site: Site) => {
    setEditingSite(site);
    setSiteForm(site);
    setShowSiteModal(true);
  };

  const handleSaveSite = () => {
    const now = new Date().toISOString();
    if (editingSite) {
      updateSite(editingSite.id, { ...siteForm, updatedAt: now });
    } else {
      addSite({
        ...siteForm,
        id: crypto.randomUUID(),
        companyId: company?.id || '',
        createdAt: now,
        updatedAt: now,
      } as Site);
    }
    setShowSiteModal(false);
  };

  const handleDeleteSite = (id: string) => {
    setSiteToDelete(id);
  };

  const confirmDeleteSite = () => {
    if (siteToDelete) {
      removeSite(siteToDelete);
      setSiteToDelete(null);
    }
  };

  const handleResetData = () => {
    resetDataStore();
    setShowDeleteConfirm(false);
  };

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please upload an image file');
        return;
      }
      // Validate file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        alert('Image must be less than 2MB');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setCompanyLogo(base64);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveLogo = () => {
    setCompanyLogo(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Settings</h1>
        <p className="text-gray-500">Manage your company profile, sites, and preferences.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Sidebar */}
        <div className="md:w-64 flex-shrink-0">
          <nav className="space-y-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    'w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-left transition-colors',
                    activeTab === tab.id
                      ? 'bg-primary-100 text-primary font-medium'
                      : 'text-gray-600 hover:bg-gray-50'
                  )}
                >
                  <Icon className="w-5 h-5" weight="duotone" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1">
          {/* Company Settings */}
          {activeTab === 'company' && (
            <div className="space-y-6">
              {/* Logo Upload Card */}
              <Card className="rounded-2xl">
                <CardTitle>Company Logo</CardTitle>
                <p className="text-sm text-gray-500 mt-1 mb-4">
                  Upload your company logo to personalize the app and exports.
                </p>

                <div className="flex items-start gap-6">
                  {/* Logo Preview */}
                  <div className="flex-shrink-0">
                    {companyLogo ? (
                      <div className="relative group">
                        <img
                          src={companyLogo}
                          alt="Company Logo"
                          className="w-24 h-24 object-contain rounded-2xl border-2 border-gray-200 bg-gray-50"
                        />
                        <button
                          onClick={handleRemoveLogo}
                          className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
                        >
                          <X className="w-4 h-4" weight="bold" />
                        </button>
                      </div>
                    ) : (
                      <div className="w-24 h-24 rounded-2xl border-2 border-dashed border-gray-300 bg-gray-50 flex items-center justify-center">
                        <Image className="w-8 h-8 text-gray-400" weight="duotone" />
                      </div>
                    )}
                  </div>

                  {/* Upload Controls */}
                  <div className="flex-1">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="hidden"
                      id="logo-upload"
                    />
                    <Button
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <UploadSimple className="w-4 h-4 mr-2" weight="duotone" />
                      {companyLogo ? 'Change Logo' : 'Upload Logo'}
                    </Button>
                    <p className="text-xs text-gray-400 mt-2">
                      PNG, JPG, or SVG. Max 2MB. Recommended: 200x200px or larger.
                    </p>
                  </div>
                </div>
              </Card>

              {/* Company Profile Card */}
              <Card className="rounded-2xl">
                <CardTitle>Company Profile</CardTitle>
                <div className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label="Legal Entity Name"
                      value={company?.legalEntityName || ''}
                      onChange={(e) => updateCompany({ legalEntityName: e.target.value })}
                    />
                    <Input
                      label="Trading Name"
                      value={company?.tradingName || ''}
                      onChange={(e) => updateCompany({ tradingName: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label="Industry"
                      value={company?.industryDescription || ''}
                      onChange={(e) => updateCompany({ industryDescription: e.target.value })}
                    />
                    <Input
                      label="Registration Number"
                      value={company?.registrationNumber || ''}
                      onChange={(e) => updateCompany({ registrationNumber: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label="Total FTE"
                      type="number"
                      value={company?.totalFte || ''}
                      onChange={(e) => updateCompany({ totalFte: parseInt(e.target.value) || 0 })}
                    />
                    <Input
                      label="Headquarters Country"
                      value={company?.headquartersCountry || ''}
                      onChange={(e) => updateCompany({ headquartersCountry: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label="Reporting Period Start"
                      type="date"
                      value={company?.reportingPeriodStart || ''}
                      onChange={(e) => updateCompany({ reportingPeriodStart: e.target.value })}
                    />
                    <Input
                      label="Reporting Period End"
                      type="date"
                      value={company?.reportingPeriodEnd || ''}
                      onChange={(e) => updateCompany({ reportingPeriodEnd: e.target.value })}
                    />
                  </div>
                  <div className="flex justify-end">
                    <Button>Save Changes</Button>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {/* Sites Settings */}
          {activeTab === 'sites' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold text-gray-900">Operational Sites</h2>
                <Button onClick={handleAddSite}>
                  <Plus className="w-4 h-4 mr-2" weight="bold" />
                  Add Site
                </Button>
              </div>

              {sites.length === 0 ? (
                <Card className="text-center py-8 rounded-2xl">
                  <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-4" weight="duotone" />
                  <p className="text-gray-500">No sites configured yet.</p>
                  <Button className="mt-4" onClick={handleAddSite}>
                    Add First Site
                  </Button>
                </Card>
              ) : (
                <div className="space-y-3">
                  {sites.map((site) => {
                    const typeLabel = siteTypeOptions.find((t) => t.value === site.siteType)?.label;
                    return (
                      <Card key={site.id} className="rounded-2xl">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-stack-2 to-stack-3 flex items-center justify-center">
                              <MapPin className="w-5 h-5 text-white" weight="duotone" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-gray-900">{site.siteName}</span>
                                {site.isPrimary && <Badge variant="high">Primary</Badge>}
                              </div>
                              <p className="text-sm text-gray-500">
                                {typeLabel} • {site.city ? `${site.city}, ` : ''}
                                {site.country}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button variant="ghost" size="sm" onClick={() => handleEditSite(site)}>
                              <PencilSimple className="w-4 h-4" weight="duotone" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteSite(site.id)}
                              disabled={site.isPrimary}
                            >
                              <Trash className="w-4 h-4 text-red-500" weight="duotone" />
                            </Button>
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Goals & SWOT Settings */}
          {activeTab === 'goals' && (
            <div className="space-y-6">
              <Card className="rounded-2xl">
                <CardTitle>Goals</CardTitle>
                <div className="space-y-4 mt-4">
                  <TextArea
                    label="Primary Goal"
                    value={goals?.primaryGoal || ''}
                    onChange={(e) => updateGoals({ primaryGoal: e.target.value })}
                    rows={3}
                  />
                  <Select
                    label="Time Horizon"
                    value={goals?.timeHorizon || '1-year'}
                    onChange={(e) => updateGoals({ timeHorizon: e.target.value as any })}
                    options={[
                      { value: '1-year', label: '1 Year' },
                      { value: '2-3-years', label: '2-3 Years' },
                      { value: '5-years', label: '5 Years' },
                    ]}
                  />
                  <Select
                    label="Primary Motivation"
                    value={goals?.primaryMotivation || 'compliance'}
                    onChange={(e) => updateGoals({ primaryMotivation: e.target.value as any })}
                    options={[
                      { value: 'compliance', label: 'Regulatory Compliance' },
                      { value: 'cost', label: 'Cost Reduction' },
                      { value: 'customers', label: 'Customer Requirements' },
                      { value: 'values', label: 'Company Values' },
                      { value: 'competitive', label: 'Competitive Advantage' },
                      { value: 'financing', label: 'Access to Financing' },
                      { value: 'risk', label: 'Risk Management' },
                    ]}
                  />
                  <TextArea
                    label="Success Definition"
                    value={goals?.successDefinition || ''}
                    onChange={(e) => updateGoals({ successDefinition: e.target.value })}
                    rows={3}
                    hint="How will you know you've achieved your goal?"
                  />
                </div>
              </Card>

              <Card className="rounded-2xl">
                <CardTitle>SWOT Analysis</CardTitle>
                <div className="space-y-4 mt-4">
                  <TextArea
                    label="Strengths"
                    value={swot?.strengths || ''}
                    onChange={(e) => updateSwot({ strengths: e.target.value })}
                    rows={3}
                    hint="What sustainability advantages do you have?"
                  />
                  <TextArea
                    label="Weaknesses"
                    value={swot?.weaknesses || ''}
                    onChange={(e) => updateSwot({ weaknesses: e.target.value })}
                    rows={3}
                    hint="What areas need improvement?"
                  />
                  <TextArea
                    label="Opportunities"
                    value={swot?.opportunities || ''}
                    onChange={(e) => updateSwot({ opportunities: e.target.value })}
                    rows={3}
                    hint="What external opportunities exist?"
                  />
                  <TextArea
                    label="Threats"
                    value={swot?.threats || ''}
                    onChange={(e) => updateSwot({ threats: e.target.value })}
                    rows={3}
                    hint="What external challenges do you face?"
                  />
                </div>
              </Card>
            </div>
          )}

          {/* Data Management Settings */}
          {activeTab === 'data' && (
            <div className="space-y-6">
              <Card className="rounded-2xl">
                <CardTitle>Data Storage</CardTitle>
                <p className="text-sm text-gray-500 mt-2 mb-4">
                  Your data is currently stored locally in your browser. In the future, you'll be able to sync with
                  cloud storage for backup and collaboration.
                </p>
                <div className="flex items-center gap-4">
                  <Badge variant="info">Local Storage</Badge>
                  <span className="text-sm text-gray-500">Data persists across browser sessions</span>
                </div>
              </Card>

              <Card className="border-red-200 rounded-2xl">
                <CardTitle className="text-red-700">Danger Zone</CardTitle>
                <p className="text-sm text-gray-500 mt-2 mb-4">
                  These actions are irreversible. Please be certain before proceeding.
                </p>
                <Button variant="outline" className="border-red-300 text-red-700 hover:bg-red-50" onClick={() => setShowDeleteConfirm(true)}>
                  <Trash className="w-4 h-4 mr-2" weight="duotone" />
                  Reset All Operational Data
                </Button>
              </Card>
            </div>
          )}
        </div>
      </div>

      {/* Site Modal */}
      <Modal
        isOpen={showSiteModal}
        onClose={() => setShowSiteModal(false)}
        title={editingSite ? 'Edit Site' : 'Add Site'}
      >
        <div className="space-y-4">
          <Input
            label="Site Name"
            value={siteForm.siteName || ''}
            onChange={(e) => setSiteForm({ ...siteForm, siteName: e.target.value })}
            placeholder="e.g., Main Factory, London Office"
          />
          <Select
            label="Site Type"
            value={siteForm.siteType}
            onChange={(e) => setSiteForm({ ...siteForm, siteType: e.target.value as SiteType })}
            options={siteTypeOptions}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Country"
              value={siteForm.country || ''}
              onChange={(e) => setSiteForm({ ...siteForm, country: e.target.value })}
            />
            <Input
              label="City"
              value={siteForm.city || ''}
              onChange={(e) => setSiteForm({ ...siteForm, city: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Ownership"
              value={siteForm.ownership}
              onChange={(e) => setSiteForm({ ...siteForm, ownership: e.target.value as SiteOwnership })}
              options={ownershipOptions}
            />
            <Input
              label="Floor Area (m²)"
              type="number"
              value={siteForm.floorAreaM2 || ''}
              onChange={(e) => setSiteForm({ ...siteForm, floorAreaM2: parseFloat(e.target.value) || undefined })}
            />
          </div>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={siteForm.isPrimary || false}
              onChange={(e) => setSiteForm({ ...siteForm, isPrimary: e.target.checked })}
              className="rounded border-gray-300"
            />
            <span className="text-sm text-gray-700">Primary site</span>
          </label>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <Button variant="outline" onClick={() => setShowSiteModal(false)}>
            Cancel
          </Button>
          <Button onClick={handleSaveSite}>{editingSite ? 'Update' : 'Add Site'}</Button>
        </div>
      </Modal>

      {/* Delete Data Confirmation */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleResetData}
        title="Reset All Data?"
        message="This will permanently delete all your operational data including materials, energy, transport, workforce, and other records. Your company profile and sites will be preserved."
        detail="This action cannot be undone."
        confirmLabel="Reset All Data"
        variant="danger"
      />

      {/* Delete Site Confirmation */}
      <ConfirmDialog
        isOpen={siteToDelete !== null}
        onClose={() => setSiteToDelete(null)}
        onConfirm={confirmDeleteSite}
        title="Delete Site?"
        message={`Are you sure you want to delete "${sites.find(s => s.id === siteToDelete)?.siteName || 'this site'}"? Any data associated with this site will not be automatically removed.`}
        confirmLabel="Delete Site"
        variant="danger"
      />
    </div>
  );
}
