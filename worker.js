// FionzyGPT Grabber - Cloudflare Worker FIXED
// Gabungin semua dalam 1 file biar ga error

export default {
  async fetch(request) {
    const url = new URL(request.url);
    const path = url.pathname;
    
    // ========== API PROXY ENDPOINT ==========
    if (path === '/api/grab') {
      const targetUrl = url.searchParams.get('url');
      
      if (!targetUrl) {
        return new Response(JSON.stringify({ 
          error: 'URL kosong!', 
          success: false 
        }), {
          status: 400,
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        });
      }
      
      try {
        // Fetch target website
        const response = await fetch(targetUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9',
            'Accept-Language': 'en-US,en;q=0.9'
          }
        });
        
        const html = await response.text();
        
        // Deteksi protection
        const isBlocked = html.includes('cf-challenge') || 
                         html.includes('__cf_chl') ||
                         html.includes('Just a moment');
        
        return new Response(JSON.stringify({
          success: true,
          html: html,
          url: targetUrl,
          size: html.length,
          blocked: isBlocked
        }), {
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        });
        
      } catch (error) {
        return new Response(JSON.stringify({
          success: false,
          error: error.message
        }), {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        });
      }
    }
    
    // ========== HEALTH CHECK ==========
    if (path === '/api/health') {
      return new Response(JSON.stringify({
        status: 'online',
        name: 'FionzyGPT Grabber',
        version: '2879'
      }), {
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }
    
    // ========== SERVE HTML (LANGSUNG DI WORKER) ==========
    // Biar ga perlu file index.html terpisah
    return new Response(getHTML(), {
      headers: { 
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-cache'
      }
    });
  }
};

// HTML langsung di dalam Worker biar ga ribet
function getHTML() {
  return `<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>FionzyGPT Grabber ⚡</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            background: linear-gradient(135deg, #0a0a0a, #1a1a2e);
            font-family: 'Courier New', monospace;
            color: #0f0;
            padding: 20px;
            min-height: 100vh;
        }
        .container { max-width: 1400px; margin: 0 auto; }
        .header {
            border: 2px solid #0f0;
            padding: 20px;
            margin-bottom: 20px;
            background: rgba(0, 255, 0, 0.05);
            box-shadow: 0 0 20px rgba(0, 255, 0, 0.3);
            text-align: center;
        }
        .header h1 { font-size: 28px; letter-spacing: 2px; }
        .badge {
            display: inline-block;
            background: #0f0;
            color: #000;
            padding: 5px 15px;
            margin: 10px 5px;
            font-weight: bold;
            border-radius: 5px;
        }
        .badge-red { background: #f00; color: #fff; }
        .control-panel {
            display: grid;
            grid-template-columns: 1fr auto auto;
            gap: 15px;
            margin-bottom: 20px;
        }
        .url-input {
            background: #000;
            border: 2px solid #0f0;
            padding: 12px;
            color: #0f0;
            font-family: monospace;
            font-size: 14px;
            outline: none;
        }
        .btn {
            background: #0f0;
            color: #000;
            border: none;
            padding: 12px 24px;
            font-weight: bold;
            cursor: pointer;
            font-family: monospace;
            transition: all 0.3s;
        }
        .btn:hover { background: #0a0; box-shadow: 0 0 15px #0f0; transform: scale(1.02); }
        .btn-danger { background: #f00; color: #fff; }
        .tabs {
            display: flex;
            gap: 10px;
            margin-bottom: 15px;
            border-bottom: 1px solid #0f0;
            flex-wrap: wrap;
        }
        .tab {
            padding: 10px 20px;
            background: #000;
            border: 1px solid #0f0;
            cursor: pointer;
            transition: 0.3s;
        }
        .tab.active { background: #0f0; color: #000; font-weight: bold; }
        .tab-content { display: none; background: #000; border: 2px solid #0f0; padding: 15px; min-height: 500px; }
        .tab-content.active { display: block; }
        #resultFrame { width: 100%; height: 600px; border: 1px solid #0f0; background: #fff; }
        .editor {
            width: 100%;
            height: 500px;
            background: #0a0a0a;
            color: #0f0;
            font-family: monospace;
            font-size: 12px;
            padding: 10px;
            border: 1px solid #0f0;
            resize: vertical;
        }
        .log {
            margin-top: 20px;
            padding: 10px;
            background: #000;
            border: 1px solid #0f0;
            max-height: 150px;
            overflow-y: auto;
            font-size: 12px;
        }
        .log-entry { border-left: 2px solid #0f0; padding-left: 10px; margin: 5px 0; }
        .loading {
            display: inline-block;
            width: 20px;
            height: 20px;
            border: 2px solid #0f0;
            border-radius: 50%;
            border-top-color: transparent;
            animation: spin 1s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes blink { 0%,100%{opacity:1;} 50%{opacity:0.5;} }
        .blink { animation: blink 1s infinite; }
        @media (max-width: 768px) {
            .control-panel { grid-template-columns: 1fr; }
            .header h1 { font-size: 20px; }
        }
    </style>
</head>
<body>
<div class="container">
    <div class="header">
        <h1>⚡ FIONZYGPT GRABBER ⚡</h1>
        <p>Cloudflare Worker Edition | Bypass CORS | Anti-Block</p>
        <div>
            <div class="badge">🔓 CORS BYPASS: ACTIVE</div>
            <div class="badge-red blink">⚡ CLOUDFLARE EDGE</div>
        </div>
    </div>
    
    <div class="control-panel">
        <input type="text" id="targetUrl" class="url-input" placeholder="https://example.com" value="https://example.com">
        <button class="btn" onclick="grabWebsite()">🚀 GRAB WEBSITE</button>
        <button class="btn btn-danger" onclick="clearAll()">🗑️ CLEAR</button>
    </div>
    
    <div class="tabs">
        <div class="tab active" onclick="switchTab('viewer')">📺 LIVE VIEWER</div>
        <div class="tab" onclick="switchTab('source')">📄 SOURCE CODE</div>
    </div>
    
    <div id="viewer" class="tab-content active">
        <iframe id="resultFrame" sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-modals"></iframe>
    </div>
    
    <div id="source" class="tab-content">
        <textarea id="sourceEditor" class="editor" placeholder="Source code hasil grab akan muncul di sini..."></textarea>
        <div style="margin-top: 10px;">
            <button class="btn" onclick="copySource()">📋 COPY SOURCE</button>
            <button class="btn" onclick="downloadHTML()">💾 DOWNLOAD HTML</button>
        </div>
    </div>
    
    <div class="log" id="logPanel">
        <div class="log-entry">[SYSTEM] FionzyGPT Grabber Active ⚡</div>
        <div class="log-entry">[SYSTEM] Worker Mode: ON</div>
        <div class="log-entry">[SYSTEM] Siap grab website apapun!</div>
    </div>
</div>

<script>
    let currentHTML = '';
    
    function addLog(message, type = 'info') {
        const logPanel = document.getElementById('logPanel');
        const logEntry = document.createElement('div');
        logEntry.className = 'log-entry';
        logEntry.style.color = type === 'error' ? '#f00' : type === 'warning' ? '#ff0' : '#0f0';
        logEntry.innerHTML = \`[\${new Date().toLocaleTimeString()}] \${message}\`;
        logPanel.appendChild(logEntry);
        logPanel.scrollTop = logPanel.scrollHeight;
    }
    
    async function grabWebsite() {
        const url = document.getElementById('targetUrl').value.trim();
        
        if (!url) {
            addLog('URL kosong! Isi dulu!', 'error');
            return;
        }
        
        addLog(\`🔥 Grab: \${url}\`);
        
        const loadingDiv = document.createElement('div');
        loadingDiv.className = 'loading';
        loadingDiv.style.margin = '10px auto';
        document.getElementById('logPanel').appendChild(loadingDiv);
        
        try {
            const response = await fetch(\`/api/grab?url=\${encodeURIComponent(url)}\`);
            const data = await response.json();
            
            if (data.success) {
                currentHTML = data.html;
                document.getElementById('sourceEditor').value = currentHTML;
                
                const iframe = document.getElementById('resultFrame');
                const iframeDoc = iframe.contentWindow.document;
                iframeDoc.open();
                iframeDoc.write(currentHTML);
                iframeDoc.close();
                
                addLog(\`✅ Berhasil! Size: \${(data.size / 1024).toFixed(2)} KB\`);
                
                if (data.blocked) {
                    addLog(\`⚠️ Website pake Cloudflare protection!\`, 'warning');
                }
            } else {
                addLog(\`❌ Gagal: \${data.error}\`, 'error');
            }
        } catch (error) {
            addLog(\`❌ Error: \${error.message}\`, 'error');
        } finally {
            loadingDiv.remove();
        }
    }
    
    function switchTab(tabName) {
        document.querySelectorAll('.tab-content').forEach(tab => {
            tab.classList.remove('active');
        });
        document.querySelectorAll('.tab').forEach(tab => {
            tab.classList.remove('active');
        });
        
        document.getElementById(tabName).classList.add('active');
        
        const tabs = document.querySelectorAll('.tab');
        if (tabName === 'viewer') tabs[0].classList.add('active');
        if (tabName === 'source') tabs[1].classList.add('active');
    }
    
    function copySource() {
        const source = document.getElementById('sourceEditor').value;
        if (!source) {
            addLog('⚠️ Grab dulu!', 'warning');
            return;
        }
        navigator.clipboard.writeText(source);
        addLog(\`📋 Source di-copy! (\${(source.length/1024).toFixed(2)} KB)\`);
    }
    
    function downloadHTML() {
        if (!currentHTML) {
            addLog('⚠️ Grab dulu!', 'warning');
            return;
        }
        const blob = new Blob([currentHTML], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = \`grabbed_\${Date.now()}.html\`;
        a.click();
        URL.revokeObjectURL(url);
        addLog(\`💾 HTML di-download!\`);
    }
    
    function clearAll() {
        document.getElementById('targetUrl').value = '';
        document.getElementById('sourceEditor').value = '';
        document.getElementById('resultFrame').src = 'about:blank';
        currentHTML = '';
        addLog(\`🗑️ Bersih!\`);
    }
    
    document.getElementById('targetUrl').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') grabWebsite();
    });
    
    addLog(\`⚡ Siap tempur!\`);
</script>
</body>
</html>`;
}