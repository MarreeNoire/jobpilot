'use client';

import { ExternalLink, Eye, FileText, X } from 'lucide-react';
import { useState } from 'react';

interface PdfViewerModalProps {
  title: string;
  fileUrl?: string | null;
  fileContent?: string | null; // base64 string if prototype upload
}

function getEmbeddableUrl(url: string | null | undefined): string | null {
  if (!url) return null;

  // Google Drive URL conversion
  if (url.includes('drive.google.com') && url.includes('/view')) {
    return url.replace(/\/view(\?.*)?$/, '/preview');
  }

  // Dropbox URL conversion
  if (url.includes('dropbox.com') && url.includes('dl=0')) {
    return url.replace('dl=0', 'raw=1');
  }

  return url;
}

export function PdfViewerModal({ title, fileUrl, fileContent }: PdfViewerModalProps) {
  const [isOpen, setIsOpen] = useState(false);

  const rawUrl = getEmbeddableUrl(fileUrl);

  // Construct iframe src: base64 data URI if provided, otherwise embeddable URL
  const iframeSrc = fileContent
    ? (fileContent.startsWith('data:') ? fileContent : `data:application/pdf;base64,${fileContent}`)
    : rawUrl;

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600 shadow-sm"
      >
        <Eye className="h-3.5 w-3.5" />
        <span>Aperçu</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 sm:p-6">
          <div className="flex h-[88vh] w-full max-w-5xl flex-col rounded-3xl border border-slate-200 bg-white shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">{title}</h3>
                  <p className="text-xs text-slate-500">Prévisualisation du document</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {fileUrl && (
                  <a
                    href={fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-blue-600 transition hover:bg-blue-50 hover:text-blue-700"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    <span>Ouvrir dans un nouvel onglet</span>
                  </a>
                )}
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="flex h-9 w-9 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
                  title="Fermer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="flex-1 bg-slate-100 p-2 overflow-hidden">
              {iframeSrc ? (
                <iframe
                  src={iframeSrc}
                  className="h-full w-full rounded-2xl border border-slate-200 bg-white"
                  title={title}
                />
              ) : (
                <div className="flex h-full flex-col items-center justify-center gap-3 text-center p-6">
                  <FileText className="h-12 w-12 text-slate-300" />
                  <p className="text-sm font-semibold text-slate-700">Fichier non disponible en aperçu direct</p>
                  {fileUrl && (
                    <a
                      href={fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 transition"
                    >
                      <ExternalLink className="h-4 w-4" />
                      <span>Ouvrir le document</span>
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
