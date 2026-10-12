import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import {
  Bell, CheckCheck, AlertTriangle, Syringe, Info, CheckCircle,
  ShieldAlert, HeartHandshake, ClipboardList, MapPin, Skull, ArrowRightLeft, Send,
  Phone, Mail, Radio, Smartphone
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/shared/PageHeader';
import { Link } from 'react-router-dom';
import { formatDate } from '@/lib/utils';
import type { NotificationType } from '@/types/types';

const notifIcons: Record<NotificationType, React.ElementType> = {
  'booster-due': Syringe,
  'booster-overdue': AlertTriangle,
  'new-incident': AlertTriangle,
  'incident-update': Info,
  'pet-pending': ClipboardList,
  'new-bite-case': ShieldAlert,
  'adoption-request': HeartHandshake,
  'stray-alert': MapPin,
  'owner-pending': ClipboardList,
  'owner-verified': CheckCircle,
  'pet-deceased': Skull,
  'pet-transferred': ArrowRightLeft,
  'transfer-request': ArrowRightLeft,
  'sms-alert': Send,
  'purok-change-request': MapPin,
  'purok-approved': CheckCircle,
  'purok-rejected': AlertTriangle,
};

const notifColors: Record<NotificationType, string> = {
  'booster-due': 'bg-yellow-50 border-yellow-200',
  'booster-overdue': 'bg-red-50 border-red-200',
  'new-incident': 'bg-orange-50 border-orange-200',
  'incident-update': 'bg-blue-50 border-blue-200',
  'pet-pending': 'bg-yellow-50 border-yellow-200',
  'new-bite-case': 'bg-orange-50 border-orange-200',
  'adoption-request': 'bg-pink-50 border-pink-200',
  'stray-alert': 'bg-amber-50 border-amber-200',
  'owner-pending': 'bg-purple-50 border-purple-200',
  'owner-verified': 'bg-emerald-50 border-emerald-200',
  'pet-deceased': 'bg-zinc-100 border-zinc-300',
  'pet-transferred': 'bg-blue-50 border-blue-200',
  'transfer-request': 'bg-indigo-50 border-indigo-200',
  'sms-alert': 'bg-sky-50 border-sky-200',
  'purok-change-request': 'bg-amber-50 border-amber-200',
  'purok-approved': 'bg-emerald-50 border-emerald-200',
  'purok-rejected': 'bg-rose-50 border-rose-200',
};

const iconColors: Record<NotificationType, string> = {
  'booster-due': 'text-yellow-600',
  'booster-overdue': 'text-red-600',
  'new-incident': 'text-orange-600',
  'incident-update': 'text-blue-600',
  'pet-pending': 'text-yellow-600',
  'new-bite-case': 'text-orange-600',
  'adoption-request': 'text-pink-600',
  'stray-alert': 'text-amber-600',
  'owner-pending': 'text-purple-600',
  'owner-verified': 'text-emerald-600',
  'pet-deceased': 'text-zinc-600',
  'pet-transferred': 'text-blue-600',
  'transfer-request': 'text-indigo-600',
  'sms-alert': 'text-sky-600',
  'purok-change-request': 'text-amber-600',
  'purok-approved': 'text-emerald-600',
  'purok-rejected': 'text-rose-600',
};

export function NotificationsPage() {
  const {
    notifications,
    markNotificationRead,
    markAllNotificationsRead,
    currentUser,
    pets,
    incidents,
    offlineDispatches,
    dispatchOfflineNotification,
  } = useApp();
  const [activeTab, setActiveTab] = useState<'in_app' | 'offline_dispatches'>('in_app');

  // Role-based notification filtering: aligned strictly with AppContext
  const filteredNotifs = notifications.filter(n => {
    if (!currentUser) return false;
    if (currentUser.role === 'admin') return true;

    if (currentUser.role === 'operator') {
      // Strictly personal notifications are private to the concerned user
      if (n.type === 'owner-verified' || n.type === 'transfer-request' || n.type === 'pet-transferred') {
        return n.userId === currentUser.id;
      }
      if (n.userId && n.userId === currentUser.id) return true;
      if (n.userId && n.userId !== currentUser.id && n.type !== 'owner-pending' && n.type !== 'pet-pending') {
        return false;
      }

      // Operational barangay tasks
      if (n.type === 'owner-pending') {
        return Boolean(currentUser.barangay && n.message.toLowerCase().includes(currentUser.barangay.toLowerCase()));
      }
      if (n.petId) {
        const pet = pets.find(p => p.id === n.petId);
        if (pet) return pet.barangay.toLowerCase() === currentUser.barangay?.toLowerCase();
      }
      if (n.incidentId) {
        const inc = incidents.find(i => i.id === n.incidentId);
        if (inc) return inc.barangay.toLowerCase() === currentUser.barangay?.toLowerCase();
      }
      if (n.type === 'new-incident' || n.type === 'stray-alert' || n.type === 'pet-pending') {
        if (currentUser.barangay && n.message.toLowerCase().includes(currentUser.barangay.toLowerCase())) {
          return true;
        }
      }
      return false;
    }

    if (currentUser.role === 'owner') {
      // Newly created account waiting for verification has 0 notifications until approval decision
      if (currentUser.verificationStatus !== 'verified') {
        return n.userId === currentUser.id && (n.type === 'owner-verified' || n.title?.toLowerCase().includes('verification'));
      }
      if (n.type === 'pet-pending' || n.type === 'owner-pending') return false;
      if (n.userId) return n.userId === currentUser.id;
      if (n.petId) {
        const pet = pets.find(p => p.id === n.petId);
        if (pet && (pet.ownerId === currentUser.id || (Boolean(pet.ownerName) && pet.ownerName.trim().toLowerCase() === currentUser.name.trim().toLowerCase()))) {
          return true;
        }
      }
      return false;
    }

    if (n.userId && n.userId !== currentUser.id) return false;
    return true;
  });

  const sorted = [...filteredNotifs].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const unread = sorted.filter(n => !n.isRead);
  const read = sorted.filter(n => n.isRead);
  
  const displayUnreadCount = unread.length;

  // Filter offline dispatches for current user
  const userDispatches = (offlineDispatches || []).filter(d => {
    if (!currentUser) return false;
    if (currentUser.role === 'admin') return true;
    if (d.userId && d.userId === currentUser.id) return true;
    if (currentUser.email && d.recipientEmail?.toLowerCase() === currentUser.email.toLowerCase()) return true;
    if (currentUser.contactNumber && d.recipientPhone && d.recipientPhone.includes(currentUser.contactNumber)) return true;
    if (currentUser.role === 'operator') return true;
    return false;
  });

  const handleSendTestOffline = () => {
    if (!currentUser) return;
    dispatchOfflineNotification({
      userId: currentUser.id,
      recipientName: currentUser.name,
      recipientPhone: currentUser.contactNumber || currentUser.contact || '09171234567',
      recipientEmail: currentUser.email || 'user@example.com',
      subject: 'PetReg Irosin: Test Cellular & Email Notification',
      message: `TEST NOTIFICATION: Hello ${currentUser.name}, this is a simulated SMS and Email broadcast from the Irosin Municipal Animal Registry. System connectivity is operational.`,
      channel: 'SMS_AND_EMAIL',
    });
  };

  return (
    <div>
      <PageHeader
        title="Notifications &amp; Dispatches"
        subtitle={
          activeTab === 'in_app'
            ? `${displayUnreadCount} unread notification${displayUnreadCount !== 1 ? 's' : ''}`
            : `${userDispatches.length} simulated SMS & Email transmission logs`
        }
        action={
          <div className="flex items-center gap-2">
            {activeTab === 'offline_dispatches' && (
              <Button size="sm" variant="outline" className="gap-1.5 text-xs" onClick={handleSendTestOffline}>
                <Radio className="h-3.5 w-3.5 text-primary" />
                Dispatch Test SMS / Email
              </Button>
            )}
            {activeTab === 'in_app' && displayUnreadCount > 0 && (
              <Button variant="outline" size="sm" onClick={markAllNotificationsRead}>
                <CheckCheck className="h-4 w-4" />
                Mark All Read
              </Button>
            )}
          </div>
        }
      />

      {/* Tabs navigation */}
      <div className="flex items-center gap-2 border-b mb-6 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('in_app')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors ${
            activeTab === 'in_app'
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'text-muted-foreground hover:bg-muted'
          }`}
        >
          <Bell className="h-4 w-4" />
          <span>In-App Alerts</span>
          {displayUnreadCount > 0 && (
            <Badge variant={activeTab === 'in_app' ? 'secondary' : 'default'} className="h-4 px-1.5 text-[10px]">
              {displayUnreadCount}
            </Badge>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('offline_dispatches')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors ${
            activeTab === 'offline_dispatches'
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'text-muted-foreground hover:bg-muted'
          }`}
        >
          <Smartphone className="h-4 w-4" />
          <span>SMS &amp; Email Notifications (Mobile / Email Gateway)</span>
          <Badge variant={activeTab === 'offline_dispatches' ? 'secondary' : 'outline'} className="h-4 px-1.5 text-[10px]">
            {userDispatches.length}
          </Badge>
        </button>
      </div>

      {activeTab === 'offline_dispatches' ? (
        <div className="space-y-4">
          <div className="rounded-lg border bg-card p-4 text-xs text-muted-foreground">
            <p className="font-semibold text-foreground text-sm flex items-center gap-1.5 mb-1">
              <Radio className="h-4 w-4 text-emerald-600 animate-pulse" />
              Mobile Cellular &amp; Email Notification Gateway
            </p>
            <p className="text-pretty">
              This communication engine sends automated text messages (SMS) directly to registered residents' mobile phone numbers and alert emails to their email inbox whenever residency status is verified, pets are registered, purok requests are approved, or rabies vaccination boosters are due. It acts as an automated cellular &amp; email delivery system ensuring residents receive critical updates without needing to keep the browser portal open.
            </p>
          </div>

          {userDispatches.length === 0 ? (
            <Card>
              <CardContent className="py-16 text-center">
                <Smartphone className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground font-medium">No SMS or Email notifications recorded yet</p>
                <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                  When account verification, booster notices, or registration confirmations occur, cellular SMS and Email logs will appear here.
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Click &ldquo;Dispatch Test SMS / Email&rdquo; above to simulate an instant multi-channel alert.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {userDispatches.map(dispatch => (
                <Card key={dispatch.id} className="border shadow-sm hover:shadow transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 border-b pb-2 mb-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge
                          variant="outline"
                          className={
                            dispatch.channel === 'SMS'
                              ? 'border-sky-500 text-sky-700 bg-sky-50'
                              : dispatch.channel === 'EMAIL'
                              ? 'border-indigo-500 text-indigo-700 bg-indigo-50'
                              : 'border-emerald-500 text-emerald-700 bg-emerald-50'
                          }
                        >
                          {dispatch.channel === 'SMS_AND_EMAIL' ? 'SMS & Email' : dispatch.channel}
                        </Badge>
                        <span className="font-semibold text-sm text-foreground">{dispatch.subject}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <CheckCircle className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                        <span className="text-emerald-700 font-medium">Delivered (Gateway ACK)</span>
                        <span className="text-[11px] ml-1">{formatDate(dispatch.dispatchedAt)}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-muted-foreground mb-2">
                      <div className="flex items-center gap-1.5">
                        <Phone className="h-3.5 w-3.5 text-sky-600 shrink-0" />
                        <span>Recipient Phone: <strong className="text-foreground">{dispatch.recipientPhone}</strong> ({dispatch.recipientName})</span>
                      </div>
                      {dispatch.recipientEmail && (
                        <div className="flex items-center gap-1.5">
                          <Mail className="h-3.5 w-3.5 text-indigo-600 shrink-0" />
                          <span>Recipient Email: <strong className="text-foreground">{dispatch.recipientEmail}</strong></span>
                        </div>
                      )}
                    </div>

                    <div className="bg-muted/50 rounded p-2.5 text-xs text-foreground font-mono">
                      {dispatch.message}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      ) : (
        <>
          {filteredNotifs.length === 0 ? (
            <Card>
              <CardContent className="py-20 text-center">
                <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground font-medium">No notifications yet</p>
                <p className="text-sm text-muted-foreground mt-1">
                  You'll be notified about vaccination reminders and incident updates here.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {/* Unread */}
              {unread.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <h2 className="font-semibold text-sm">Unread</h2>
                    <Badge>{unread.length}</Badge>
                  </div>
                  <div className="space-y-2">
                    {unread.map(n => {
                      const Icon = notifIcons[n.type];
                      return (
                        <Card
                          key={n.id}
                          className={`border ${notifColors[n.type]} cursor-pointer hover:shadow-sm transition-all`}
                          onClick={() => markNotificationRead(n.id)}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-start gap-3">
                              <div className="h-8 w-8 rounded-full bg-white flex items-center justify-center shrink-0 shadow-sm">
                                <Icon className={`h-4 w-4 ${iconColors[n.type]}`} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between">
                                  <p className="font-medium text-sm">{n.title}</p>
                                  <Badge variant="outline" className="text-[10px] bg-white border-primary/30 text-primary">
                                    Click to mark read
                                  </Badge>
                                </div>
                                <p className="text-sm text-muted-foreground mt-0.5">{n.message}</p>
                                <p className="text-xs text-muted-foreground mt-1">{formatDate(n.createdAt)}</p>
                                <div className="flex gap-2 mt-2 flex-wrap" onClick={e => e.stopPropagation()}>
                                  {n.petId && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="h-7 text-xs bg-white"
                                      asChild
                                      onClick={() => markNotificationRead(n.id)}
                                    >
                                      <Link to={`/pets/${n.petId}`}>View Pet</Link>
                                    </Button>
                                  )}
                                  {n.incidentId && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="h-7 text-xs bg-white"
                                      asChild
                                      onClick={() => markNotificationRead(n.id)}
                                    >
                                      <Link to={`/incidents/${n.incidentId}`}>View Incident</Link>
                                    </Button>
                                  )}
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-7 text-xs"
                                    onClick={() => markNotificationRead(n.id)}
                                  >
                                    <CheckCircle className="h-3 w-3 mr-1" />Mark Read
                                  </Button>
                                </div>
                              </div>
                              <div className="h-2.5 w-2.5 rounded-full bg-primary shrink-0 mt-1.5 animate-pulse" />
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Read */}
              {read.length > 0 && (
                <div>
                  <h2 className="font-semibold text-sm mb-3 text-muted-foreground">Earlier</h2>
                  <div className="space-y-2">
                    {read.map(n => {
                      const Icon = notifIcons[n.type];
                      return (
                        <Card key={n.id} className="opacity-70">
                          <CardContent className="p-4">
                            <div className="flex items-start gap-3">
                              <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                                <Icon className="h-4 w-4 text-muted-foreground" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm">{n.title}</p>
                                <p className="text-sm text-muted-foreground mt-0.5">{n.message}</p>
                                <p className="text-xs text-muted-foreground mt-1">{formatDate(n.createdAt)}</p>
                                <div className="flex gap-2 mt-2 flex-wrap">
                                  {n.petId && (
                                    <Button size="sm" variant="ghost" className="h-7 text-xs" asChild>
                                      <Link to={`/pets/${n.petId}`}>View Pet</Link>
                                    </Button>
                                  )}
                                  {n.incidentId && (
                                    <Button size="sm" variant="ghost" className="h-7 text-xs" asChild>
                                      <Link to={`/incidents/${n.incidentId}`}>View Incident</Link>
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
