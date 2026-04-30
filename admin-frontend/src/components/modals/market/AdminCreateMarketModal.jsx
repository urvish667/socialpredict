import React, { useState } from 'react';
import { adminFetch } from '../../../utils/api';
import { getEndofDayDateTime } from '../../utils/dateTimeTools/FormDateTimeTools';
import DatetimeSelector from '../../datetimeSelector/DatetimeSelector';
import EmojiPickerInput from '../../inputs/EmojiPicker';

const CATEGORIES = [
  { id: 'politics', name: 'Politics', icon: 'account_balance' },
  { id: 'crypto', name: 'Crypto', icon: 'currency_bitcoin' },
  { id: 'sports', name: 'Sports', icon: 'sports_soccer' },
  { id: 'business', name: 'Business', icon: 'trending_up' },
  { id: 'science', name: 'Science', icon: 'science' },
  { id: 'entertainment', name: 'Entertainment', icon: 'movie' },
  { id: 'other', name: 'Other', icon: 'more_horiz' },
];

const MARKET_TYPES = [
  { 
    id: 'BINARY', 
    name: 'Binary', 
    desc: 'Yes/No outcomes only',
    example: '"Will Sundowns win their next match?"',
    icon: 'swap_horiz'
  },
  { 
    id: 'MULTIPLE_CHOICE', 
    name: 'Multiple Choice', 
    desc: 'Events with 3+ outcomes',
    example: '"Who will win Best Actor?"',
    icon: 'ballot',
  },
];

const AdminCreateMarketModal = ({ isOpen, onClose, onMarketCreated }) => {
  const [questionTitle, setQuestionTitle] = useState('');
  const [description, setDescription] = useState('');
  const [resolutionDateTime, setResolutionDateTime] = useState(getEndofDayDateTime());
  const [outcomeType, setOutcomeType] = useState('BINARY');
  const [yesLabel, setYesLabel] = useState('');
  const [noLabel, setNoLabel] = useState('');
  const [category, setCategory] = useState('');
  const [options, setOptions] = useState(['', '', '']); // Min 3 options for MC
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const addOption = () => {
    if (options.length < 10) {
      setOptions([...options, '']);
    }
  };

  const removeOption = (index) => {
    if (options.length > 3) {
      setOptions(options.filter((_, i) => i !== index));
    }
  };

  const updateOption = (index, value) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (isSubmitting) return;
    setError('');
    setIsSubmitting(true);

    if (!category) {
      setError('Please select a category');
      setIsSubmitting(false);
      return;
    }

    if (outcomeType === 'MULTIPLE_CHOICE') {
      const filledOptions = options.filter(o => o.trim() !== '');
      if (filledOptions.length < 3) {
        setError('Multiple choice markets require at least 3 options');
        setIsSubmitting(false);
        return;
      }
    }

    let isoDateTime = resolutionDateTime;
    if (resolutionDateTime) {
      const dateTime = new Date(resolutionDateTime);
      if (!isNaN(dateTime.getTime())) {
        isoDateTime = dateTime.toISOString();
      } else {
        setError('Invalid date-time value');
        setIsSubmitting(false);
        return;
      }
    }

    try {
      const marketData = {
        questionTitle,
        description,
        outcomeType,
        resolutionDateTime: isoDateTime,
        initialProbability: 0.5,
        isResolved: false,
        category,
      };

      if (outcomeType === 'BINARY') {
        marketData.yesLabel = yesLabel.trim() || 'YES';
        marketData.noLabel = noLabel.trim() || 'NO';
      } else {
        marketData.options = options.filter(o => o.trim() !== '').map(o => o.trim());
      }

      const response = await adminFetch('/v0/create', {
        method: 'POST',
        body: JSON.stringify(marketData),
      });

      if (response.ok) {
        if (onMarketCreated) onMarketCreated();
        onClose();
        // Reset form
        setQuestionTitle('');
        setDescription('');
        setCategory('');
        setOutcomeType('BINARY');
      } else {
        const errorText = await response.text();
        setError(`Failed: ${errorText}`);
      }
    } catch (err) {
      setError(`Error: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/90 flex justify-center items-center z-[200] backdrop-blur-xl p-4 sm:p-6">
      <div className="relative bg-[#0b0f0e] border border-white/10 w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl custom-scrollbar animate-in fade-in zoom-in duration-300">
        
        {/* Header */}
        <div className="sticky top-0 bg-[#0b0f0e] border-b border-white/5 p-6 flex justify-between items-center z-10">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-[#ddff5c]">add_circle</span>
            <h2 className="text-lg font-black uppercase tracking-[0.2em] text-white">Genesis Creation</h2>
          </div>
          <button onClick={onClose} className="text-white/30 hover:text-white transition-colors">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="p-8">
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-10">
            
            {/* Left Column - Basics */}
            <div className="space-y-8">
              {/* Market Type */}
              <div className="space-y-4">
                <label className="block text-[10px] font-black uppercase tracking-widest text-white/30">Sector Protocol</label>
                <div className="grid grid-cols-2 gap-3">
                  {MARKET_TYPES.map((type) => (
                    <button
                      key={type.id}
                      type="button"
                      onClick={() => setOutcomeType(type.id)}
                      className={`p-4 border transition-all text-left relative ${
                        outcomeType === type.id 
                          ? 'border-[#ddff5c] bg-[#ddff5c]/5 text-[#ddff5c]'
                          : 'border-white/5 bg-white/[0.02] text-white/40 hover:border-white/20'
                      }`}
                    >
                      <span className="material-symbols-outlined text-xl mb-2 block">{type.icon}</span>
                      <span className="text-[10px] font-black uppercase tracking-widest">{type.name}</span>
                      {outcomeType === type.id && (
                        <span className="absolute top-2 right-2 material-symbols-outlined text-xs">check_circle</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Category */}
              <div className="space-y-4">
                <label className="block text-[10px] font-black uppercase tracking-widest text-white/30">Vertical Alignment</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setCategory(cat.id)}
                      className={`p-3 border text-center transition-all ${
                        category === cat.id
                          ? 'border-[#ddff5c] bg-[#ddff5c]/10 text-[#ddff5c]'
                          : 'border-white/5 bg-white/[0.02] text-white/30 hover:border-white/10'
                      }`}
                    >
                      <span className="material-symbols-outlined text-sm block mb-1">{cat.icon}</span>
                      <span className="text-[8px] font-black uppercase tracking-widest">{cat.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Question */}
              <div className="space-y-3">
                <label className="block text-[10px] font-black uppercase tracking-widest text-white/30">Prime Directive (Title)</label>
                <EmojiPickerInput
                  value={questionTitle}
                  onChange={(e) => setQuestionTitle(e.target.value)}
                  placeholder="The question being asked..."
                  className="w-full bg-white/[0.03] border border-white/10 text-white p-4 text-xs font-bold focus:border-[#ddff5c] outline-none transition-all"
                />
              </div>

              {/* Description */}
              <div className="space-y-3">
                <label className="block text-[10px] font-black uppercase tracking-widest text-white/30">Resolution Parameters (Description)</label>
                <EmojiPickerInput
                  type="textarea"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Specify clear resolution criteria..."
                  className="w-full h-32 bg-white/[0.03] border border-white/10 text-white p-4 text-xs font-bold focus:border-[#ddff5c] outline-none transition-all resize-none"
                />
              </div>
            </div>

            {/* Right Column - Outcomes & Timing */}
            <div className="space-y-8">
              {/* Outcomes Section */}
              <div className="space-y-4">
                <label className="block text-[10px] font-black uppercase tracking-widest text-white/30">Outcome Vectors</label>
                
                {outcomeType === 'BINARY' ? (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={yesLabel}
                        onChange={(e) => setYesLabel(e.target.value)}
                        placeholder="YES"
                        className="w-full bg-white/[0.03] border border-white/10 text-white p-3 text-[10px] font-black uppercase tracking-widest focus:border-[#ddff5c] outline-none"
                      />
                      <p className="text-[8px] text-white/20 uppercase font-black tracking-widest">Positive Affirmation</p>
                    </div>
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={noLabel}
                        onChange={(e) => setNoLabel(e.target.value)}
                        placeholder="NO"
                        className="w-full bg-white/[0.03] border border-white/10 text-white p-3 text-[10px] font-black uppercase tracking-widest focus:border-[#ddff5c] outline-none"
                      />
                      <p className="text-[8px] text-white/20 uppercase font-black tracking-widest">Negative Refutation</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="space-y-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                      {options.map((opt, i) => (
                        <div key={i} className="flex gap-2">
                          <input
                            type="text"
                            value={opt}
                            onChange={(e) => updateOption(i, e.target.value)}
                            placeholder={`Variable ${i + 1}`}
                            className="flex-1 bg-white/[0.03] border border-white/10 text-white p-3 text-[10px] font-black uppercase tracking-widest focus:border-[#ddff5c] outline-none"
                          />
                          {options.length > 3 && (
                            <button onClick={() => removeOption(i)} type="button" className="text-white/20 hover:text-red-500">
                              <span className="material-symbols-outlined text-sm">delete</span>
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                    {options.length < 10 && (
                      <button 
                        type="button" 
                        onClick={addOption}
                        className="text-[9px] font-black uppercase tracking-widest text-[#ddff5c] hover:underline"
                      >
                        + Add outcome variable
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Resolution Date */}
              <div className="space-y-4">
                <label className="block text-[10px] font-black uppercase tracking-widest text-white/30">Entropy Termination (Resolution Date)</label>
                <DatetimeSelector
                  value={resolutionDateTime}
                  onChange={(e) => setResolutionDateTime(e.target.value)}
                />
                <p className="text-[8px] text-white/20 uppercase font-black tracking-widest">The moment the sector transitions to static state</p>
              </div>

              {/* Submit Area */}
              <div className="pt-6 space-y-4">
                {error && (
                  <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] font-black uppercase tracking-widest">
                    Error: {error}
                  </div>
                ) }
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-4 bg-[#ddff5c] text-black text-xs font-black uppercase tracking-[0.3em] hover:bg-[#e6ff85] active:scale-95 transition-all shadow-[0_0_30px_rgba(221,255,92,0.1)]"
                >
                  {isSubmitting ? 'Transmitting...' : 'Commit to Blockchain'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AdminCreateMarketModal;
