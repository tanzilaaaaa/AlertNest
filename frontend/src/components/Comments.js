import { useState, useEffect } from 'react';
import { FaComment, FaPaperPlane } from 'react-icons/fa';
import api from '../services/api';

export default function Comments({ incidentId, onToast }) {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadComments();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [incidentId]);

  const loadComments = async () => {
    try {
      const res = await api.get(`/api/incidents/${incidentId}/comments`);
      setComments(res.data.comments || []);
    } catch (err) {
      onToast?.('Failed to load comments', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    
    setSubmitting(true);
    try {
      await api.post(`/api/incidents/${incidentId}/comments`, { text: newComment });
      setNewComment('');
      loadComments();
      onToast?.('Comment added', 'success');
    } catch (err) {
      onToast?.('Failed to add comment', 'error');
    } finally {
      setSubmitting(false);
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
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
        <FaComment size={14} style={{ color: 'var(--gold)' }} />
        <h4 style={{ margin: 0, fontSize: '13px', fontWeight: '600', color: 'var(--text)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
          Comments ({comments.length})
        </h4>
      </div>

      {loading ? (
        <p style={{ fontSize: '12px', color: 'var(--muted)', margin: 0 }}>Loading...</p>
      ) : (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '16px', maxHeight: '300px', overflowY: 'auto' }}>
            {comments.length === 0 ? (
              <p style={{ fontSize: '12px', color: 'var(--muted)', margin: 0, fontStyle: 'italic' }}>No comments yet</p>
            ) : (
              comments.map(c => (
                <div key={c.id} style={{
                  background: 'var(--bg-dark)',
                  padding: '12px 14px',
                  borderRadius: '8px',
                  border: '1px solid var(--border)',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <span style={{ fontSize: '11px', fontWeight: '600', color: 'var(--gold)' }}>{c.user_name}</span>
                    <span style={{ fontSize: '10px', color: 'var(--muted)' }}>{timeAgo(c.created_at)}</span>
                  </div>
                  <p style={{ margin: 0, fontSize: '12px', color: 'var(--text)', lineHeight: 1.5 }}>{c.text}</p>
                </div>
              ))
            )}
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '8px' }}>
            <input
              type="text"
              placeholder="Add a comment..."
              value={newComment}
              onChange={e => setNewComment(e.target.value)}
              disabled={submitting}
              style={{
                flex: 1,
                border: '1px solid var(--border)',
                borderRadius: '8px',
                padding: '10px 12px',
                fontSize: '12px',
                background: 'var(--bg-input)',
                color: 'var(--text)',
                outline: 'none',
              }}
            />
            <button type="submit" disabled={submitting || !newComment.trim()} style={{
              background: 'var(--gold)',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              padding: '10px 16px',
              cursor: submitting || !newComment.trim() ? 'default' : 'pointer',
              opacity: submitting || !newComment.trim() ? 0.5 : 1,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '11px',
              fontWeight: '600',
            }}>
              <FaPaperPlane size={11} />
              {submitting ? 'Sending...' : 'Send'}
            </button>
          </form>
        </>
      )}
    </div>
  );
}
