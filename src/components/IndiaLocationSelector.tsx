import React, { useEffect, useMemo, useState } from 'react';
import { GeoLocation } from '../types';
import {
  ALL_28_STATES,
  ALL_UNION_TERRITORIES,
  INDIA_STATES_AND_DISTRICTS,
  buildGeoLocationFromDistrict,
} from '../data/indiaLocations';
import { MapPin, Navigation } from 'lucide-react';

interface IndiaLocationSelectorProps {
  selectedLocation: GeoLocation;
  onSelectLocation: (loc: GeoLocation) => void;
  customAddress?: string;
  onCustomAddressChange?: (addr: string) => void;
  showAddressInput?: boolean;
  showGpsButton?: boolean;
  compact?: boolean;
}

function matchStateAndDistrict(loc: GeoLocation) {
  const cityToken = loc.city.split(',')[0].trim().toLowerCase();
  const stateObj =
    INDIA_STATES_AND_DISTRICTS.find(
      (s) =>
        loc.city.includes(s.state) ||
        loc.address.includes(s.state) ||
        s.districts.some(
          (d) =>
            d.name.toLowerCase() === cityToken ||
            d.name.toLowerCase().includes(cityToken)
        )
    ) ||
    INDIA_STATES_AND_DISTRICTS.find((s) => s.state === 'Maharashtra') ||
    INDIA_STATES_AND_DISTRICTS[0];

  const districtObj =
    stateObj.districts.find(
      (d) =>
        loc.city.startsWith(d.name) ||
        d.name.toLowerCase() === cityToken ||
        d.name.toLowerCase().includes(cityToken)
    ) ||
    stateObj.districts.find((d) => d.name.includes('Mumbai Suburban')) ||
    stateObj.districts[0];

  return { stateName: stateObj.state, districtName: districtObj.name };
}

export const IndiaLocationSelector: React.FC<IndiaLocationSelectorProps> = ({
  selectedLocation,
  onSelectLocation,
  customAddress,
  onCustomAddressChange,
  showAddressInput = false,
  showGpsButton = false,
  compact = false,
}) => {
  const initialMatch = useMemo(() => matchStateAndDistrict(selectedLocation), []);
  const [selectedStateName, setSelectedStateName] = useState<string>(initialMatch.stateName);
  const [selectedDistrictName, setSelectedDistrictName] = useState<string>(
    initialMatch.districtName
  );
  const [gpsStatus, setGpsStatus] = useState<string>('');

  useEffect(() => {
    const matched = matchStateAndDistrict(selectedLocation);
    if (
      selectedLocation.city.includes(matched.stateName) ||
      selectedLocation.address.includes(matched.stateName)
    ) {
      setSelectedStateName(matched.stateName);
      setSelectedDistrictName(matched.districtName);
    }
  }, [selectedLocation]);

  const activeStateObj = useMemo(
    () =>
      INDIA_STATES_AND_DISTRICTS.find((s) => s.state === selectedStateName) ||
      INDIA_STATES_AND_DISTRICTS[0],
    [selectedStateName]
  );

  const handleStateChange = (newStateName: string) => {
    setSelectedStateName(newStateName);
    const nextStateObj =
      INDIA_STATES_AND_DISTRICTS.find((s) => s.state === newStateName) ||
      INDIA_STATES_AND_DISTRICTS[0];
    const firstDistrict = nextStateObj.districts[0];
    setSelectedDistrictName(firstDistrict.name);
    const newLoc = buildGeoLocationFromDistrict(newStateName, firstDistrict);
    onSelectLocation(newLoc);
    if (onCustomAddressChange) {
      onCustomAddressChange(newLoc.address);
    }
  };

  const handleDistrictChange = (newDistrictName: string) => {
    setSelectedDistrictName(newDistrictName);
    const foundDistrict =
      activeStateObj.districts.find((d) => d.name === newDistrictName) ||
      activeStateObj.districts[0];
    const newLoc = buildGeoLocationFromDistrict(activeStateObj.state, foundDistrict);
    onSelectLocation(newLoc);
    if (onCustomAddressChange) {
      onCustomAddressChange(newLoc.address);
    }
  };

  const handleDetectGps = () => {
    if (!navigator.geolocation) {
      setGpsStatus('GPS not supported in this browser.');
      return;
    }
    setGpsStatus('Detecting...');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const gpsLoc: GeoLocation = {
          city: `${selectedDistrictName}, ${activeStateObj.state} (GPS)`.slice(0, 80),
          address:
            customAddress?.trim() ||
            `GPS (${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}) — ${selectedDistrictName}, ${activeStateObj.state}`,
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        };
        onSelectLocation(gpsLoc);
        setGpsStatus('GPS coordinates applied');
      },
      () => {
        setGpsStatus('Permission denied — using selected district');
      }
    );
  };

  return (
    <div className={compact ? 'space-y-2.5' : 'bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-3'}>
      <div className="flex items-center justify-between gap-2">
        <label className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span>India State &amp; District / City Hub (For Nearest Seller Matching)</span>
        </label>
        {showGpsButton && (
          <button
            type="button"
            onClick={handleDetectGps}
            className="text-[11px] font-semibold text-indigo-700 hover:text-indigo-900 flex items-center gap-1 cursor-pointer shrink-0"
          >
            <Navigation className="w-3 h-3" />
            <span>{gpsStatus || 'Use GPS'}</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        <div>
          <label className="block text-[11px] font-medium text-slate-600 mb-1">
            Select State (All 28 States + UTs) *
          </label>
          <select
            value={selectedStateName}
            onChange={(e) => handleStateChange(e.target.value)}
            className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-lg bg-white text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-slate-900/10"
          >
            <optgroup label="28 States of India">
              {ALL_28_STATES.map((s) => (
                <option key={s.state} value={s.state}>
                  {s.state} ({s.districts.length} {s.districts.length === 1 ? 'district' : 'districts'})
                </option>
              ))}
            </optgroup>
            <optgroup label="Union Territories">
              {ALL_UNION_TERRITORIES.map((ut) => (
                <option key={ut.state} value={ut.state}>
                  {ut.state} ({ut.districts.length})
                </option>
              ))}
            </optgroup>
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-medium text-slate-600 mb-1">
            Select District / City Hub ({activeStateObj.districts.length}) *
          </label>
          <select
            value={selectedDistrictName}
            onChange={(e) => handleDistrictChange(e.target.value)}
            className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-lg bg-white text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-slate-900/10"
          >
            {activeStateObj.districts.map((d) => (
              <option key={d.name} value={d.name}>
                {d.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {showAddressInput && onCustomAddressChange && (
        <div>
          <label className="block text-[11px] font-medium text-slate-600 mb-1">
            Street / Area / Warehouse Address
          </label>
          <input
            type="text"
            value={customAddress !== undefined ? customAddress : selectedLocation.address}
            onChange={(e) => onCustomAddressChange(e.target.value)}
            placeholder={`Street address in ${selectedDistrictName}, ${activeStateObj.state}`}
            className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
          />
        </div>
      )}
    </div>
  );
};
