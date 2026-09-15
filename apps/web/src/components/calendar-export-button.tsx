'use client';

import { useState } from 'react';
import { Calendar, Download, ExternalLink } from 'lucide-react';

interface CalendarExportButtonProps {
  title: string;
  scheduledAt: string;
  timezone: string;
  mode: 'VIDEO' | 'PHONE' | 'ONSITE';
  meetingUrl?: string | null;
  notes?: string | null;
}

function formatDateToICS(date: Date): string {
  return date.toISOString().replace(/-|:|\.\d+/g, '');
}

export function CalendarExportButton({
  title,
  scheduledAt,
  timezone,
  mode,
  meetingUrl,
  notes,
}: CalendarExportButtonProps) {
  const [open, setOpen] = useState(false);

  const startDate = new Date(scheduledAt);
  // Default 45 minutes duration
  const endDate = new Date(startDate.getTime() + 45 * 60 * 1000);

  const modeLabels = { VIDEO: 'Visioconférence', PHONE: 'Téléphone', ONSITE: 'Sur site' };
  const locationText = meetingUrl ?? `Format: ${modeLabels[mode]}`;
  const descriptionText = [
    `Entretien: ${title}`,
    `Format: ${modeLabels[mode]}`,
    meetingUrl ? `Lien: ${meetingUrl}` : undefined,
    notes ? `Instructions: ${notes}` : undefined,
  ].filter(Boolean).join('\n');

  // Google Calendar URL
  const googleCalendarUrl = new URL('https://calendar.google.com/calendar/render');
  googleCalendarUrl.searchParams.set('action', 'TEMPLATE');
  googleCalendarUrl.searchParams.set('text', `JobPilot: ${title}`);
  googleCalendarUrl.searchParams.set('dates', `${formatDateToICS(startDate)}/${formatDateToICS(endDate)}`);
  googleCalendarUrl.searchParams.set('details', descriptionText);
  if (locationText) {
    googleCalendarUrl.searchParams.set('location', locationText);
  }

  // Download .ics file
  function handleDownloadICS() {
    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//JobPilot//NONSGML v1.0//FR',
      'BEGIN:VEVENT',
      `UID:jobpilot-${Date.now()}@jobpilot.app`,
      `DTSTAMP:${formatDateToICS(new Date())}`,
      `DTSTART:${formatDateToICS(startDate)}`,
      `DTEND:${formatDateToICS(endDate)}`,
      `SUMMARY:JobPilot: ${title}`,
      `DESCRIPTION:${descriptionText.replace(/\n/g, '\\n')}`,
      `LOCATION:${locationText}`,
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n');

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `entretien-${startDate.toISOString().slice(0, 10)}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setOpen(false);
  }

  return (
    <div className="relative inline-block text-left">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="inline-flex items-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700 transition hover:bg-indigo-100"
      >
        <Calendar className="h-3.5 w-3.5" />
        <span>Ajouter à l&apos;agenda</span>
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-1 w-52 rounded-xl border border-slate-200 bg-white p-1 shadow-lg ring-1 ring-black/5">
          <a
            href={googleCalendarUrl.toString()}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-100"
          >
            <ExternalLink className="h-3.5 w-3.5 text-blue-500" />
            <span>Google Calendar</span>
          </a>
          <button
            type="button"
            onClick={handleDownloadICS}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-100"
          >
            <Download className="h-3.5 w-3.5 text-emerald-600" />
            <span>Télécharger (.ics)</span>
          </button>
        </div>
      )}
    </div>
  );
}
