import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, Ambulance, CheckCircle2, PhoneCall, ShieldAlert, ShieldCheck, Siren } from 'lucide-react';
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  EmptyState,
  ErrorState,
  Input,
  LoadingBlock,
  Modal,
  PageHeader,
  Select,
  StatusBadge,
  Textarea,
  useToast,
} from '@/components/ui';
import { bookingsApi, safetyApi } from '@/services/api-services';
import { getApiErrorMessage } from '@/lib/api';
import { formatSmartDateTime } from '@/lib/utils';

export function SafetyPage() {
  const toast = useToast();
  const queryClient = useQueryClient();
  const [sosOpen, setSosOpen] = useState(false);
  const [sosBookingId, setSosBookingId] = useState('');
  const [sosNote, setSosNote] = useState('');
  const [incidentBookingId, setIncidentBookingId] = useState('');
  const [incidentNote, setIncidentNote] = useState('');

  const eventsQuery = useQuery({ queryKey: ['safety', 'events'], queryFn: safetyApi.events });
  const bookingsQuery = useQuery({ queryKey: ['bookings', 'mine', 0, 50], queryFn: () => bookingsApi.mine(0, 50) });
  const bookings = bookingsQuery.data?.items ?? [];

  const sos = useMutation({
    mutationFn: () => safetyApi.sos(sosBookingId || undefined, undefined, undefined, sosNote || undefined),
    onSuccess: async () => {
      setSosOpen(false);
      setSosNote('');
      toast.success('SOS sent to ZEVORA support', 'Your safety event is open and support can see it immediately.');
      await queryClient.invalidateQueries({ queryKey: ['safety', 'events'] });
    },
    onError: (error) => toast.error('Could not send SOS', getApiErrorMessage(error)),
  });

  const report = useMutation({
    mutationFn: () =>
      safetyApi.report({
        bookingId: incidentBookingId || undefined,
        type: 'INCIDENT',
        note: incidentNote,
      }),
    onSuccess: async () => {
      setIncidentNote('');
      toast.success('Incident reported', 'Support will review the details you provided.');
      await queryClient.invalidateQueries({ queryKey: ['safety', 'events'] });
    },
    onError: (error) => toast.error('Could not submit report', getApiErrorMessage(error)),
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Safety & support"
        description="Emergency SOS, incident reporting and the safety event history on your account."
        actions={<Badge tone="success"><ShieldCheck className="h-3 w-3" /> Support monitored</Badge>}
      />

      <div className="grid gap-5 lg:grid-cols-[1fr_1.1fr]">
        <Card className="border-red-200 bg-gradient-to-br from-red-50 to-white">
          <CardContent className="space-y-4 p-6">
            <div className="flex items-center gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-600 text-white">
                <Siren className="h-6 w-6" />
              </span>
              <div>
                <h2 className="text-lg font-extrabold text-ink-950">Emergency SOS</h2>
                <p className="text-sm text-ink-500">Creates a real safety event visible to support.</p>
              </div>
            </div>
            <p className="text-sm text-ink-600">
              If you are in immediate danger, call the emergency services first. Then send an SOS so
              ZEVORA support can review the trip and contact you.
            </p>
            <div className="grid gap-2 sm:grid-cols-2">
              <a href="tel:112"><Button variant="danger" fullWidth leftIcon={<PhoneCall className="h-4 w-4" />}>Call 112</Button></a>
              <a href="tel:100"><Button variant="outline" fullWidth leftIcon={<Ambulance className="h-4 w-4" />}>Call police 100</Button></a>
            </div>
            <Button variant="danger" fullWidth size="lg" leftIcon={<Siren className="h-4 w-4" />} onClick={() => setSosOpen(true)}>
              Send in-app SOS
            </Button>
            <p className="text-xs text-red-700">
              Abusing SOS is a safety violation. Each SOS is logged with your account and an optional booking.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div>
              <CardTitle>Report an incident</CardTitle>
              <p className="text-sm text-ink-500">Non-emergency issues: unsafe driving, harassment, vehicle condition.</p>
            </div>
            <Badge tone="warning"><ShieldAlert className="h-3 w-3" /> Reviewed by support</Badge>
          </CardHeader>
          <CardContent className="space-y-3">
            <Select label="Related booking (optional)" value={incidentBookingId} onChange={(event) => setIncidentBookingId(event.target.value)}>
              <option value="">No specific booking</option>
              {bookings.map((booking) => (
                <option key={booking.id} value={booking.id}>
                  {booking.ride ? `${booking.ride.originAddress} → ${booking.ride.destAddress}` : booking.id} · {formatSmartDateTime(booking.createdAt)}
                </option>
              ))}
            </Select>
            <Textarea
              label="What happened?"
              placeholder="Describe the incident with as much detail as you can…"
              value={incidentNote}
              onChange={(event) => setIncidentNote(event.target.value)}
            />
            <Button
              onClick={() => report.mutate()}
              loading={report.isPending}
              disabled={incidentNote.trim().length < 10}
              leftIcon={<AlertTriangle className="h-4 w-4" />}
            >
              Submit report
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Your safety events</CardTitle>
            <p className="text-sm text-ink-500">SOS and incident records raised from your account.</p>
          </div>
          <Badge tone="neutral">{eventsQuery.data?.length ?? 0} total</Badge>
        </CardHeader>
        <CardContent>
          {eventsQuery.isLoading && <LoadingBlock label="Loading safety events…" className="min-h-24" />}
          {eventsQuery.isError && (
            <ErrorState title="Could not load safety events" description={getApiErrorMessage(eventsQuery.error)} onRetry={() => eventsQuery.refetch()} />
          )}
          {!eventsQuery.isLoading && !eventsQuery.isError && (eventsQuery.data ?? []).length === 0 && (
            <EmptyState
              icon={<ShieldCheck className="h-6 w-6" />}
              title="No safety events"
              description="You have not raised any SOS or incident reports. We hope it stays that way."
              className="border-0"
            />
          )}
          {(eventsQuery.data ?? []).length > 0 && (
            <ul className="divide-y divide-ink-100">
              {(eventsQuery.data ?? []).map((event) => (
                <li key={event.id} className="flex flex-wrap items-start justify-between gap-3 py-3">
                  <div className="flex items-start gap-3">
                    <span className={`mt-0.5 flex h-9 w-9 items-center justify-center rounded-xl ${event.type === 'SOS' ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'}`}>
                      {event.type === 'SOS' ? <Siren className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
                    </span>
                    <div>
                      <p className="flex flex-wrap items-center gap-2 text-sm font-bold text-ink-900">
                        {event.type === 'SOS' ? 'SOS alert' : 'Incident report'}
                        <StatusBadge status={event.status} />
                      </p>
                      {event.note && <p className="mt-0.5 text-sm text-ink-600">{event.note}</p>}
                      <p className="mt-0.5 text-xs text-ink-400">
                        {formatSmartDateTime(event.createdAt)}
                        {event.bookingId ? ` · Booking ${event.bookingId.slice(0, 8)}` : ''}
                        {event.latitude != null && event.longitude != null ? ` · ${event.latitude.toFixed(4)}, ${event.longitude.toFixed(4)}` : ''}
                      </p>
                    </div>
                  </div>
                  {event.status === 'RESOLVED' ? (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-mint-700"><CheckCircle2 className="h-4 w-4" /> Resolved</span>
                  ) : (
                    <span className="text-xs font-semibold text-ink-500">Support is reviewing</span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Modal
        open={sosOpen}
        onClose={() => (sos.isPending ? undefined : setSosOpen(false))}
        title="Send an emergency SOS?"
        description="This immediately creates a safety event for ZEVORA support with your account details."
        footer={
          <>
            <Button variant="ghost" onClick={() => setSosOpen(false)} disabled={sos.isPending}>Cancel</Button>
            <Button variant="danger" onClick={() => sos.mutate()} loading={sos.isPending} leftIcon={<Siren className="h-4 w-4" />}>
              Send SOS now
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <Select label="Related booking (optional)" value={sosBookingId} onChange={(event) => setSosBookingId(event.target.value)}>
            <option value="">No specific booking</option>
            {bookings.map((booking) => (
              <option key={booking.id} value={booking.id}>
                {booking.ride ? `${booking.ride.originAddress} → ${booking.ride.destAddress}` : booking.id}
              </option>
            ))}
          </Select>
          <Input
            label="Short note (optional)"
            placeholder="e.g. Driver took a different route"
            value={sosNote}
            onChange={(event) => setSosNote(event.target.value)}
          />
          <div className="flex items-start gap-2 rounded-lg bg-red-50 p-3 text-xs text-red-700">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <p>The SOS is recorded in the backend. It does not automatically dial emergency services — call 112 for immediate help.</p>
          </div>
        </div>
      </Modal>
    </div>
  );
}
