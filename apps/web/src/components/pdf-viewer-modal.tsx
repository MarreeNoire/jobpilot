'use client';

import { Eye, FileText, X } from 'lucide-react';
import { useState } from 'react';

interface PdfViewerModalProps {
  title: string;
  fileUrl?: string | null;
  fileContent?: string | null; // base64 string if prototype upload
}

export function PdfViewerModal({ title, fileUrl, fileContent }: PdfViewerModalProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Construct iframe src
  const iframeSrc = fileContent
    ? (fileContent.startsWith('data:') ? fileContent : `data:application/pdf;base64,${fileContent}`)
    : (fileUrl ?? null);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600"
      >
        <Eye className="h-3.5 w-3.5" />
        <span>Aperçu</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="flex h-[85vh] w-full max-w-4xl flex-col rounded-3xl border border-slate-200 bg-white shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
                  <FileText className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">{title}</h3>
                  <p className="text-xs text-slate-500">Prévisualisation du document</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 bg-slate-100 p-2 overflow-hidden">
              {iframeSrc ? (
                <iframe
                  src={iframeSrc}
                  className="h-full w-full rounded-2xl border border-slate-200"
                  title={title}
                />
              ) : (
                <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
                  <FileText className="h-10 w-10 text-slate-300" />
                  <p className="text-sm font-semibold text-slate-600">Aucun fichier prévisualisable</p>
                  <p className="text-xs text-slate-400">Le contenu du document n'est pas disponible.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
