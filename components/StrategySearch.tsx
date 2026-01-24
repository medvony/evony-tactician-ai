import React, { useState } from 'react';
import { searchStrategy, isTrustedSource } from '../services/strategySearch';

export const StrategySearch: React.FC = () => {
  const [query, setQuery] = useState('');
  const [sourceUrl, setSourceUrl] = useState('');
  const [searchWeb, setSearchWeb] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string>('');
  const [source, setSource] = useState<{ title: string; url: string } | null>(null);
  const [error, setError] = useState<string>('');

  const handleSearch = async () => {
    if (!query.trim()) {
      setError('Please enter a question');
      return;
    }

    if (searchWeb && sourceUrl && !isTrustedSource(sourceUrl)) {
      setError('Please use a trusted Evony strategy source');
      return;
    }

    setLoading(true);
    setError('');
    setResult('');
    setSource(null);

    try {
      const response = await searchStrategy({
        query,
        searchWeb,
        sourceUrl: searchWeb ? sourceUrl : undefined,
      });

      if (response.error) {
        setError(response.error);
      } else {
        setResult(response.response);
        setSource(response.source || null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h2>Evony Strategy Assistant</h2>
      
      <div style={{ marginBottom: '15px' }}>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Ask about Evony strategy..."
          style={{
            width: '100%',
            padding: '10px',
            fontSize: '16px',
            borderRadius: '4px',
            border: '1px solid #ccc',
          }}
          onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
        />
      </div>

      <div style={{ marginBottom: '15px' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <input
            type="checkbox"
            checked={searchWeb}
            onChange={(e) => setSearchWeb(e.target.checked)}
          />
          <span>Search web for additional context</span>
        </label>
      </div>

      {searchWeb && (
        <div style={{ marginBottom: '15px' }}>
          <input
            type="url"
            value={sourceUrl}
            onChange={(e) => setSourceUrl(e.target.value)}
            placeholder="https://evonyguidewiki.com/..."
            style={{
              width: '100%',
              padding: '10px',
              fontSize: '14px',
              borderRadius: '4px',
              border: '1px solid #ccc',
            }}
          />
          <small style={{ color: '#666', display: 'block', marginTop: '5px' }}>
            Trusted sources: evonyguidewiki.com, gamerempire.net, mrguider.org, pockettactics.com
          </small>
        </div>
      )}

      <button
        onClick={handleSearch}
        disabled={loading}
        style={{
          padding: '12px 24px',
          fontSize: '16px',
          backgroundColor: loading ? '#ccc' : '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: loading ? 'not-allowed' : 'pointer',
          width: '100%',
        }}
      >
        {loading ? 'Searching...' : 'Search'}
      </button>

      {error && (
        <div style={{
          marginTop: '20px',
          padding: '15px',
          backgroundColor: '#fee',
          border: '1px solid #fcc',
          borderRadius: '4px',
          color: '#c00',
        }}>
          {error}
        </div>
      )}

      {source && (
        <div style={{
          marginTop: '20px',
          padding: '10px',
          backgroundColor: '#e7f3ff',
          border: '1px solid #b3d9ff',
          borderRadius: '4px',
        }}>
          <strong>Source:</strong> {source.title}<br />
          <a href={source.url} target="_blank" rel="noopener noreferrer" style={{ color: '#007bff' }}>
            {source.url}
          </a>
        </div>
      )}

      {result && (
        <div style={{
          marginTop: '20px',
          padding: '20px',
          backgroundColor: '#f9f9f9',
          border: '1px solid #ddd',
          borderRadius: '4px',
          whiteSpace: 'pre-wrap',
          lineHeight: '1.6',
        }}>
          {result}
        </div>
      )}
    </div>
  );
};
