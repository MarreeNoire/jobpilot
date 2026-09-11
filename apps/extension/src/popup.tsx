import React, { useState, useEffect } from 'react';
import './popup.css';

interface JobInfo {
  title: string;
  company: string;
  description: string;
  location: string;
  salary: string;
  contactEmail?: string | null;
  url: string;
  platform: string;
}

interface JobAnalysis {
  summary: string;
  requiredSkills: string[];
  desiredSkills: string[];
  compatibilityScore: number;
}

const Popup: React.FC = () => {
  const [jobInfo, setJobInfo] = useState<JobInfo | null>(null);
  const [analysis, setAnalysis] = useState<JobAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchJobInfo();
  }, []);

  const fetchJobInfo = async () => {
    setLoading(true);
    setError(null);

    try {
      if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
        const response = await new Promise<{ success: boolean; data?: JobInfo; error?: string }>((resolve) => {
          chrome.runtime.sendMessage(
            { type: 'GET_JOB_INFO' },
            (res) => {
              resolve(res || { success: false, error: 'Pas de réponse du script de contenu' });
            }
          );
        });

        if (response.success && response.data) {
          setJobInfo(response.data);
        } else {
          // No job detected on current page
          setJobInfo(null);
        }
      } else {
        // Mock data when tested outside Chrome extension environment
        setJobInfo({
          title: 'Développeur Fullstack TypeScript / React',
          company: 'Acme Technologies',
          location: 'Paris / Télétravail',
          salary: '55k - 65k €',
          url: 'https://example.com/job/123',
          platform: 'LinkedIn',
          description: 'Recherche développeur passionné...',
        });
      }
    } catch {
      setError('Impossible de communiquer avec la page active.');
    } finally {
      setLoading(false);
    }
  };

  const analyzeJob = async (job: JobInfo) => {
    setAnalyzing(true);
    setError(null);

    try {
      // Simulate or call AI analysis API
      await new Promise((resolve) => setTimeout(resolve, 800));
      setAnalysis({
        summary: `Excellente correspondance pour le poste de ${job.title} chez ${job.company}. Vos compétences couvrent l'essentiel des critères demandés.`,
        requiredSkills: ['TypeScript', 'React', 'Node.js', 'PostgreSQL'],
        desiredSkills: ['Tailwind CSS', 'Docker', 'Next.js'],
        compatibilityScore: 92,
      });
    } catch {
      setError("Échec de l'analyse automatique de l'offre.");
    } finally {
      setAnalyzing(false);
    }
  };

  const handleApply = () => {
    if (!jobInfo) return;
    alert(`Candidature initiée pour ${jobInfo.title} chez ${jobInfo.company} ! Redirection vers JobPilot...`);
  };

  const openDashboard = () => {
    if (typeof chrome !== 'undefined' && chrome.tabs) {
      chrome.tabs.create({ url: 'http://localhost:3000/dashboard' });
    } else {
      window.open('http://localhost:3000/dashboard', '_blank');
    }
  };

  return (
    <div className="popup-container">
      {/* Header */}
      <header className="popup-header">
        <div className="brand-wrapper">
          <div className="brand-icon">✨</div>
          <span className="brand-title">JobPilot</span>
        </div>
        <div className="status-badge">
          <span className={`status-dot ${jobInfo ? '' : 'idle'}`} />
          <span>{jobInfo ? 'Offre détectée' : 'En veille'}</span>
        </div>
      </header>

      {/* Main Content */}
      <main className="popup-content">
        {error && <div className="error-banner">{error}</div>}

        {loading ? (
          <div className="empty-state">
            <div className="spinner" style={{ borderColor: '#2563eb', borderTopColor: 'transparent', width: 24, height: 24 }} />
            <p className="empty-text">Détection de l'offre en cours...</p>
          </div>
        ) : jobInfo ? (
          <>
            {/* Detected Job Card */}
            <div className="jp-card">
              <span className="job-platform-badge">{jobInfo.platform || 'Offre Web'}</span>
              <h2 className="job-title">{jobInfo.title}</h2>
              <p className="job-company">{jobInfo.company}</p>

              <div className="job-meta-row">
                {jobInfo.location && (
                  <span className="meta-item">📍 {jobInfo.location}</span>
                )}
                {jobInfo.salary && (
                  <span className="meta-item">💶 {jobInfo.salary}</span>
                )}
                {jobInfo.contactEmail && (
                  <span className="meta-item" style={{ color: '#2563eb', fontWeight: 600 }}>✉️ {jobInfo.contactEmail}</span>
                )}
              </div>
            </div>

            {/* AI Analysis Result */}
            {analysis ? (
              <div className="jp-card analysis-card">
                <div className="analysis-header">
                  <span className="analysis-title">Score de compatibilité</span>
                  <span className="score-badge">★ {analysis.compatibilityScore}%</span>
                </div>

                <p className="analysis-summary">{analysis.summary}</p>

                <div className="skills-section">
                  <span className="skills-title">Compétences clés identifiées :</span>
                  <div className="skills-tags">
                    {analysis.requiredSkills.map((s) => (
                      <span key={s} className="skill-tag">✓ {s}</span>
                    ))}
                    {analysis.desiredSkills.map((s) => (
                      <span key={s} className="skill-tag" style={{ color: '#2563eb' }}>+ {s}</span>
                    ))}
                  </div>
                </div>
              </div>
            ) : null}

            {/* Action Buttons */}
            <div className="actions-group">
              {!analysis ? (
                <button
                  type="button"
                  onClick={() => analyzeJob(jobInfo)}
                  disabled={analyzing}
                  className="btn-primary"
                >
                  {analyzing ? (
                    <>
                      <span className="spinner" />
                      <span>Analyse IA en cours...</span>
                    </>
                  ) : (
                    <span>✨ Analyser avec l'IA JobPilot</span>
                  )}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleApply}
                  className="btn-success"
                >
                  🚀 Générer la candidature sur-mesure
                </button>
              )}

              <button
                type="button"
                onClick={openDashboard}
                className="btn-secondary"
              >
                Ouvrir dans mon Dashboard
              </button>
            </div>
          </>
        ) : (
          /* Empty State */
          <div className="empty-state">
            <div className="empty-icon">🔍</div>
            <h3 className="empty-title">Aucune offre active détectée</h3>
            <p className="empty-text">
              Naviguez sur une page d'offre d'emploi pour activer la capture automatique et l'analyse de compatibilité.
            </p>
            <div className="platform-chips">
              <span className="platform-chip">LinkedIn</span>
              <span className="platform-chip">Indeed</span>
              <span className="platform-chip">Welcome to the Jungle</span>
            </div>

            <div style={{ marginTop: 16, width: '100%' }}>
              <button
                type="button"
                onClick={fetchJobInfo}
                className="btn-secondary"
              >
                🔄 Réessayer la détection
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="popup-footer">
        <span>JobPilot Extension v0.1.0</span>
        <a href="#" onClick={openDashboard} className="footer-link">
          Mon Compte →
        </a>
      </footer>
    </div>
  );
};

export default Popup;