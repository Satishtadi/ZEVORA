import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { ArrowRight, Calculator, Leaf, TrendingUp, Wallet } from 'lucide-react';
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  ErrorState,
  Input,
  LoadingBlock,
  PageHeader,
  StatCard,
  useToast,
} from '@/components/ui';
import { commuteApi } from '@/services/api-services';
import { getApiErrorMessage } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';

export function SavingsPage() {
  const toast = useToast();
  const [soloFare, setSoloFare] = useState('350');
  const [sharedFare, setSharedFare] = useState('120');
  const [workingDays, setWorkingDays] = useState('22');

  const savingsQuery = useQuery({ queryKey: ['commute', 'savings'], queryFn: commuteApi.monthlySavings });
  const calculator = useMutation({
    mutationFn: () =>
      commuteApi.calculateSavings(Number(soloFare) || 0, Number(sharedFare) || 0, Math.max(1, Number(workingDays) || 1)),
    onError: (error) => toast.error('Could not calculate savings', getApiErrorMessage(error)),
  });

  const result = calculator.data;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Your savings"
        description="Backend estimates based on your completed shared trips, plus a planning calculator."
        actions={<Link to="/app/search"><Button leftIcon={<ArrowRight className="h-4 w-4" />}>Book a smarter ride</Button></Link>}
      />

      {savingsQuery.isLoading && <LoadingBlock label="Loading savings…" />}
      {savingsQuery.isError && <ErrorState title="Could not load savings" description={getApiErrorMessage(savingsQuery.error)} onRetry={() => savingsQuery.refetch()} />}

      {savingsQuery.data && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Estimated savings" value={formatCurrency(savingsQuery.data.savings)} hint={`Last ${savingsQuery.data.periodDays} days`} icon={<Leaf className="h-5 w-5" />} tone="mint" />
            <StatCard label="Shared spend" value={formatCurrency(savingsQuery.data.sharedSpend)} hint="Actual recorded shared trips" icon={<Wallet className="h-5 w-5" />} tone="brand" />
            <StatCard label="Solo estimate" value={formatCurrency(savingsQuery.data.estimatedSoloSpend)} hint="What solo travel may have cost" icon={<Calculator className="h-5 w-5" />} tone="amber" />
            <StatCard label="Completed trips" value={savingsQuery.data.completedTrips} hint="Trips counted in this estimate" icon={<TrendingUp className="h-5 w-5" />} tone="ink" />
          </div>
          <p className="rounded-xl bg-sky-50 px-4 py-3 text-xs text-sky-800">{savingsQuery.data.note}</p>
        </>
      )}

      <div className="grid gap-5 lg:grid-cols-[1fr_1fr]">
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Commute savings calculator</CardTitle>
              <p className="text-sm text-ink-500">Estimate what switching from solo cab travel could save each month.</p>
            </div>
          </CardHeader>
          <CardContent>
            <form
              className="space-y-4"
              onSubmit={(event) => {
                event.preventDefault();
                calculator.mutate();
              }}
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <Input label="Solo cab fare per day (₹)" type="number" min={0} value={soloFare} onChange={(event) => setSoloFare(event.target.value)} />
                <Input label="Shared fare per day (₹)" type="number" min={0} value={sharedFare} onChange={(event) => setSharedFare(event.target.value)} />
              </div>
              <Input label="Working days per month" type="number" min={1} max={31} value={workingDays} onChange={(event) => setWorkingDays(event.target.value)} />
              <Button type="submit" loading={calculator.isPending} leftIcon={<Calculator className="h-4 w-4" />}>Calculate savings</Button>
            </form>
          </CardContent>
        </Card>

        <Card className="bg-ink-950 text-white">
          <CardContent className="flex h-full flex-col justify-between gap-5 p-6">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-brand-200">Calculator result</p>
              {result ? (
                <>
                  <p className="mt-2 text-4xl font-extrabold tracking-tight">{formatCurrency(result.monthlySavings)}</p>
                  <p className="mt-1 text-sm text-ink-300">estimated monthly savings across {result.workingDays} working days</p>
                  <div className="mt-5 space-y-2 text-sm">
                    <p className="flex justify-between border-b border-white/10 pb-2"><span className="text-ink-300">Solo cost</span><span className="font-semibold">{formatCurrency(result.monthlySoloCost)}</span></p>
                    <p className="flex justify-between border-b border-white/10 pb-2"><span className="text-ink-300">Shared cost</span><span className="font-semibold">{formatCurrency(result.monthlySharedCost)}</span></p>
                    <p className="flex justify-between"><span className="text-ink-300">Working days</span><span className="font-semibold">{result.workingDays}</span></p>
                  </div>
                  <p className="mt-4 text-xs text-ink-400">{result.note}</p>
                </>
              ) : (
                <p className="mt-3 text-sm text-ink-300">
                  Enter your current solo fare and the shared fare you expect. The backend calculates
                  monthly figures instantly.
                </p>
              )}
            </div>
            <Link to="/app/search"><Button variant="secondary" fullWidth>Find a shared ride</Button></Link>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="space-y-2 p-5 text-sm text-ink-600">
          <p className="font-bold text-ink-900">How this is calculated</p>
          <p>
            Monthly savings compare a solo-travel estimate against what you actually spent on shared
            trips recorded by the backend. The calculator uses the fares you enter; it does not
            predict future prices.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
