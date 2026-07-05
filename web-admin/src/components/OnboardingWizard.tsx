import React, { useState } from 'react';
import { ChevronRight, ChevronLeft, CheckCircle2 } from 'lucide-react';

interface WizardProps {
  onSubmit: (data: any) => void;
  onCancel: () => void;
}

export default function OnboardingWizard({ onSubmit, onCancel }: WizardProps) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    location: '',
    operatingRadiusKm: 3,
    operatingHours: '08:00 AM - 10:00 PM',
    taxId: '',
    bankAccountNumber: '',
    bankRoutingNumber: ''
  });

  const nextStep = () => setStep(s => Math.min(s + 1, 3));
  const prevStep = () => setStep(s => Math.max(s - 1, 1));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (step === 3) {
      onSubmit(formData);
    } else {
      nextStep();
    }
  };

  const renderStepIndicator = () => (
    <div style={{ display: 'flex', gap: 12, marginBottom: 24, justifyContent: 'center' }}>
      {[1, 2, 3].map(s => (
        <div key={s} style={{ 
          width: 32, height: 32, borderRadius: '50%', 
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: s === step ? 'var(--primary)' : (s < step ? 'var(--success)' : 'var(--surface-alt)'),
          color: s <= step ? '#fff' : 'var(--text-muted)',
          fontWeight: 'bold', fontSize: 14, transition: 'all 0.3s'
        }}>
          {s < step ? <CheckCircle2 size={16} /> : s}
        </div>
      ))}
    </div>
  );

  return (
    <form onSubmit={handleSubmit} style={{ minHeight: 350, display: 'flex', flexDirection: 'column' }}>
      {renderStepIndicator()}
      
      <div style={{ flex: 1, animation: 'fadeIn 0.3s' }}>
        {step === 1 && (
          <div>
            <h4 style={{ marginBottom: 16 }}>Basic Information</h4>
            <div className="form-group">
              <label>Store Name</label>
              <input required autoFocus className="form-control" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="e.g. FreshMart Koramangala" />
            </div>
            <div className="form-group">
              <label>Store Description (Optional)</label>
              <textarea className="form-control" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="Premium grocery store..." rows={3} />
            </div>
          </div>
        )}

        {step === 2 && (
          <div>
            <h4 style={{ marginBottom: 16 }}>Location & Operations</h4>
            <div className="form-group">
              <label>Full Address / Location</label>
              <input required autoFocus className="form-control" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} placeholder="Sector 14, City" />
            </div>
            <div style={{ display: 'flex', gap: 16 }}>
              <div className="form-group" style={{ flex: 1 }}>
                <label>Operating Radius (km)</label>
                <input required type="number" step="0.5" className="form-control" value={formData.operatingRadiusKm} onChange={e => setFormData({...formData, operatingRadiusKm: parseFloat(e.target.value)})} />
              </div>
              <div className="form-group" style={{ flex: 1 }}>
                <label>Operating Hours</label>
                <input required className="form-control" value={formData.operatingHours} onChange={e => setFormData({...formData, operatingHours: e.target.value})} />
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div>
            <h4 style={{ marginBottom: 16 }}>Financial & Compliance</h4>
            <div className="form-group">
              <label>GSTIN / Tax ID</label>
              <input className="form-control" value={formData.taxId} onChange={e => setFormData({...formData, taxId: e.target.value})} placeholder="29ABCDE1234F1Z5" />
            </div>
            <div style={{ display: 'flex', gap: 16 }}>
              <div className="form-group" style={{ flex: 1 }}>
                <label>Bank Account Number</label>
                <input className="form-control" value={formData.bankAccountNumber} onChange={e => setFormData({...formData, bankAccountNumber: e.target.value})} />
              </div>
              <div className="form-group" style={{ flex: 1 }}>
                <label>IFSC / Routing Number</label>
                <input className="form-control" value={formData.bankRoutingNumber} onChange={e => setFormData({...formData, bankRoutingNumber: e.target.value})} />
              </div>
            </div>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 24, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
        <button type="button" className="btn" onClick={step === 1 ? onCancel : prevStep} style={{ background: 'var(--surface-alt)' }}>
          {step === 1 ? 'Cancel' : <><ChevronLeft size={16} /> Back</>}
        </button>
        <button type="submit" className="btn btn-primary">
          {step === 3 ? <><CheckCircle2 size={16} /> Complete Onboarding</> : <>Next <ChevronRight size={16} /></>}
        </button>
      </div>
    </form>
  );
}
