import { BadgeCheck, Bus, CarFront, Clock, ExternalLink, Footprints, MapPin, Sparkles, Star, TrainFront, Users, Zap } from 'lucide-react';
import { Badge, Button } from '@/components/ui';
import { providerLabels } from '@/lib/hyderabad';
import { formatCurrency, formatDuration, formatSmartDateTime } from '@/lib/utils';
import type { TravelOption } from '@/types';

const icons: Record<string, typeof CarFront> = {
  PRIVATE_CARPOOL: CarFront,
  COMMERCIAL_SHARED_CAB: CarFront,
  PUBLIC_BUS: Bus,
  METRO_FEEDER: TrainFront,
  COMPANY_SHUTTLE: Bus,
  AUTO: Zap,
  CAB: CarFront,
  EXTERNAL_CAB: CarFront,
};

export function TravelOptionCard({
  option,
  onSelect,
  ctaLabel,
}: {
  option: TravelOption;
  onSelect?: () => void;
  ctaLabel?: string;
}) {
  const Icon = icons[option.category] ?? CarFront;
  const sourceTone = option.source === 'LIVE' ? 'success' : option.source === 'EXTERNAL' ? 'info' : 'warning';
  return (
    <article
      className={`rounded-2xl border bg-white p-5 shadow-soft transition-shadow hover:shadow-lift ${
        option.recommended ? 'border-brand-300 ring-1 ring-brand-100' : 'border-ink-100'
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span
            className={`flex h-11 w-11 items-center justify-center rounded-xl ${
              option.recommended ? 'bg-brand-600 text-white' : 'bg-ink-100 text-ink-700'
            }`}
          >
            <Icon className="h-5 w-5" />
          </span>
          <div>
            <p className="flex flex-wrap items-center gap-2 text-sm font-bold text-ink-900">
              {option.providerName}
              {option.verified && (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-mint-700">
                  <BadgeCheck className="h-3.5 w-3.5" /> Verified
                </span>
              )}
            </p>
            <p className="text-xs text-ink-500">
              {providerLabels[option.category] ?? option.category}
              {option.operatorName ? ` · ${option.operatorName}` : ''}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {option.recommended && (
            <Badge tone="brand">
              <Sparkles className="h-3 w-3" /> Recommended
            </Badge>
          )}
          <Badge tone={sourceTone}>{option.source === 'LIVE' ? 'Live' : option.source === 'EXTERNAL' ? 'External' : 'Estimated'}</Badge>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-2xl font-extrabold tracking-tight text-ink-950">{formatCurrency(option.farePerPassenger)}</p>
          <p className="text-[11px] text-ink-400">per passenger{option.fare !== option.farePerPassenger ? ` · total ${formatCurrency(option.fare)}` : ''}</p>
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-500">
          <span className="inline-flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" /> {formatDuration(option.durationMinutes)}</span>
          <span className="inline-flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" /> {option.pickupEtaMinutes} min pickup</span>
          {option.walkingDistanceMeters > 0 && (
            <span className="inline-flex items-center gap-1.5"><Footprints className="h-3.5 w-3.5" /> {option.walkingDistanceMeters} m walk</span>
          )}
          <span className="inline-flex items-center gap-1.5"><Users className="h-3.5 w-3.5" /> {option.availableSeats} seats</span>
          <span className="inline-flex items-center gap-1.5"><Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" /> {Math.round(option.reliability)}% reliable</span>
        </div>
      </div>

      <div className="mt-4 grid gap-2 text-xs text-ink-500 sm:grid-cols-2">
        <p className="rounded-lg bg-ink-50 px-3 py-2"><span className="font-semibold text-ink-700">Departure:</span> {formatSmartDateTime(option.departureTime)}</p>
        <p className="rounded-lg bg-ink-50 px-3 py-2"><span className="font-semibold text-ink-700">Arrival:</span> {formatSmartDateTime(option.arrivalTime)}</p>
        <p className="rounded-lg bg-ink-50 px-3 py-2"><span className="font-semibold text-ink-700">Pickup:</span> {option.pickupLabel}</p>
        <p className="rounded-lg bg-ink-50 px-3 py-2"><span className="font-semibold text-ink-700">Drop:</span> {option.dropLabel}</p>
      </div>

      <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1 text-[11px] text-ink-400">
          <p>{option.cancellationPolicy}</p>
          <p className="mt-0.5">{option.note ?? option.bookingMethod}{option.vehicleInfo ? ` · ${option.vehicleInfo}` : ''}</p>
        </div>
        <div className="flex items-center gap-2">
          {option.deepLink && (
            <a href={option.deepLink} target="_blank" rel="noreferrer">
              <Button variant="outline" size="sm" rightIcon={<ExternalLink className="h-3.5 w-3.5" />}>Open provider</Button>
            </a>
          )}
          {onSelect && (
            <Button size="sm" onClick={onSelect}>
              {ctaLabel ?? (option.rideId ? 'View carpool' : 'Continue')}
            </Button>
          )}
          {!onSelect && !option.deepLink && (
            <span className="text-[11px] font-semibold text-ink-400">{option.bookingMethod}</span>
          )}
        </div>
      </div>
    </article>
  );
}
