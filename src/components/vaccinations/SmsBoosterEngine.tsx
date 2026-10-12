import { useState } from 'react';
import { Send, MessageSquare, CheckCircle2, Clock, AlertCircle, RefreshCw, Smartphone, Sparkles, Filter } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { useApp } from '@/context/AppContext';
import { formatDate } from '@/lib/utils';
import type { SmsReminderLog } from '@/types/types';

export function SmsBoosterEngine() {
  const { smsLogs, simulateBoosterReminders, currentUser, pets } = useApp();
  const [isSimulating, setIsSimulating] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'sent' | 'delivered'>('all');
  const [testModalOpen, setTestModalOpen] = useState(false);
  const [lastDispatchedCount, setLastDispatchedCount] = useState<number | null>(null);

  const canManage = currentUser?.role === 'admin' || currentUser?.role === 'operator' || currentUser?.role === 'vet_clinic';

  const handleRunBatch = () => {
    setIsSimulating(true);
    setLastDispatchedCount(null);
    setTimeout(() => {
      const generated = simulateBoosterReminders();
      setIsSimulating(false);
      setLastDispatchedCount(generated.length);
    }, 600);
  };

  const filteredLogs = (smsLogs || []).filter(log => {
    const matchesStatus = statusFilter === 'all' || log.status === statusFilter;
    const matchesSearch =
      searchTerm === '' ||
      log.petName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.recipientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.recipientPhone.includes(searchTerm) ||
      log.vaccineType.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <Card className="border border-primary/20 bg-gradient-to-r from-blue-50/40 via-background to-primary/5 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Smartphone className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                Automated SMS Rabies Booster Notification Engine
                <Badge className="bg-primary/10 text-primary text-[10px] font-mono">
                  Telco Gateway Sim
                </Badge>
              </CardTitle>
              <CardDescription className="text-xs">
                Dispatches broadcast cellular notifications to pet owners for expiring and overdue boosters under RA 9482
              </CardDescription>
            </div>
          </div>

          {canManage && (
            <div className="flex items-center gap-2">
              <Button
                onClick={handleRunBatch}
                disabled={isSimulating}
                className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs h-8 shadow-sm font-semibold"
              >
                {isSimulating ? (
                  <RefreshCw className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                ) : (
                  <Send className="h-3.5 w-3.5 mr-1.5" />
                )}
                {isSimulating ? 'Dispatching SMS...' : 'Run Scheduled Reminders'}
              </Button>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {lastDispatchedCount !== null && (
          <div className="p-3 bg-green-50 border border-green-200 text-green-900 rounded-lg text-xs flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
            <span>
              <strong>Successfully dispatched {lastDispatchedCount} automated SMS booster alerts</strong> to owners across Irosin.
            </span>
          </div>
        )}

        {/* Stats strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
          <div className="p-2.5 bg-background border rounded-lg">
            <span className="text-muted-foreground block text-[11px]">Total Outbound Dispatches</span>
            <span className="text-base font-bold font-mono">{smsLogs?.length ?? 0}</span>
          </div>
          <div className="p-2.5 bg-background border rounded-lg">
            <span className="text-muted-foreground block text-[11px]">Delivered Rate</span>
            <span className="text-base font-bold font-mono text-green-600">100%</span>
          </div>
          <div className="p-2.5 bg-background border rounded-lg">
            <span className="text-muted-foreground block text-[11px]">Target Window</span>
            <span className="text-base font-bold">Within 30 Days</span>
          </div>
          <div className="p-2.5 bg-background border rounded-lg">
            <span className="text-muted-foreground block text-[11px]">Sender ID</span>
            <span className="text-base font-mono font-bold text-primary">LGU-IROSIN</span>
          </div>
        </div>

        {/* Search and logs preview */}
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Recent Cellular Transmission Log:
            </p>
            <Input
              placeholder="Search recipient, pet name, or phone..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="h-7 text-xs max-w-xs"
            />
          </div>

          <div className="divide-y max-h-56 overflow-y-auto border rounded-lg bg-background">
            {filteredLogs.length === 0 ? (
              <div className="p-6 text-center text-xs text-muted-foreground">
                No outbound SMS logs recorded yet. Click "Run Scheduled Reminders" to simulate a broadcast dispatch cycle.
              </div>
            ) : (
              filteredLogs.slice(0, 12).map(log => (
                <div key={log.id} className="p-3 hover:bg-muted/30 transition-colors text-xs space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-foreground">
                        {log.recipientName}
                      </span>
                      <span className="font-mono text-[11px] text-muted-foreground">
                        ({log.recipientPhone})
                      </span>
                      <Badge variant="outline" className="text-[10px] bg-primary/5 text-primary border-primary/20">
                        Pet: {log.petName}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className="bg-green-100 text-green-800 border-green-300 text-[10px]">
                        <CheckCircle2 className="h-2.5 w-2.5 mr-1 text-green-600" />
                        {log.status.toUpperCase()}
                      </Badge>
                      <span className="text-[10px] text-muted-foreground">
                        {formatDate(log.sentAt)}
                      </span>
                    </div>
                  </div>
                  <p className="text-[11px] font-mono text-muted-foreground bg-muted/40 p-1.5 rounded border border-border/40">
                    "{log.message}"
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
