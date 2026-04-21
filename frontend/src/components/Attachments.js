import { useState, useEffect } from 'react';
import { FaPaperclip, FaUpload, FaFile } from 'react-icons/fa';
import api from '../services/api';

export default function Attachments({ incidentId, onToast }) {
  const [attachments, setAttachments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    loadAttachments();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [incidentId]);

  const loadAttachments = async () => {
    try {
      const res = await api.get(`/api/incidents/${incidentId}/attachments`);
      setAttachments(res.data.attachments || []);
    } catch (err) {
      onToast?.('Failed to load attachments', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      await api.post(`/api/incidents/${incidentId}/attachments`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      loadAttachments();
      onToast?.('File uploaded', 'success');
    } catch (err) {
      onToast?.('Failed to upload file', 'error');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const timeAgo = (isoString) => {
    if (!isoString) return '';
    const diff = Math.floor((Date.now() - new Date(isoString)) / 1000);
    if (diff < 60) return 'just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border)',
      borderRadius: '12px',
      padding: '20px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <FaPaperclip size={14} style={{ color: 'var(--gold)' }} />
          <h4 style={{ margin: 0, fontSize: '13px', fontWeight: '600', color: 'var(--text)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
            Attachments ({attachments.length})
          </h4>
        </div>
        
        <label style={{
          background: 'var(--gold)',
          color: '#fff',
          border: 'none',
          borderRadius: '8px',
          padding: '6px 12px',
          cursor: uploading ? 'default' : 'pointer',
          opacity: uploading ? 0.5 : 1,
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          fontSize: '11px',
          fontWeight: '600',
        }}>
          <FaUpload size={10} />
          {uploading ? 'Uploading...' : 'Upload'}
          <input type="file" onChange={handleUpload} disabled={uploading} style={{ display: 'none' }} />
        </label>
      </div>

      {loading ? (
        <p style={{ fontSize: '12px', color: 'var(--muted)', margin: 0 }}>Loading...</p>
      ) : attachments.length === 0 ? (
        <p style={{ fontSize: '12px', color: 'var(--muted)', margin: 0, fontStyle: 'italic' }}>No attachments yet</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {attachments.map(a => (
            <div key={a.id} style={{
              background: 'var(--bg-dark)',
              padding: '12px 14px',
              borderRadius: '8px',
              border: '1px solid var(--border)',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
            }}>
              <FaFile size={16} style={{ color: 'var(--gold)', flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ margin: 0, fontSize: '12px', fontWeight: '500', color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {a.filename}
                </p>
                <p style={{ margin: '2px 0 0', fontSize: '10px', color: 'var(--muted)' }}>
                  {timeAgo(a.uploaded_at)}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
