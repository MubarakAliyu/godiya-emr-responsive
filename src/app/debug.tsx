import React from 'react';

export function DebugApp() {
  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh',
      flexDirection: 'column',
      padding: '20px',
      fontFamily: 'monospace'
    }}>
      <h1 style={{ fontSize: '24px', marginBottom: '20px' }}>App Debug Mode</h1>
      <p style={{ fontSize: '16px', color: '#059669' }}>✅ React is rendering</p>
      <p style={{ fontSize: '14px', color: '#666', marginTop: '10px' }}>
        If you see this, the base app is working. The issue is with the routes or providers.
      </p>
    </div>
  );
}
