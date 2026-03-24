// FionzyGPT Grabber - Cloudflare Worker
// Backend Proxy for Bypass CORS & Grab Website

export default {
  async fetch(request) {
    const url = new URL(request.url);
    
    // ========== PROXY ENDPOINT ==========
    if (url.pathname === '/api/grab') {
      const targetUrl = url.searchParams.get('url');
      
      if (!targetUrl) {
        return new Response(JSON.stringify({ 
          error: 'URL kosong! Isi parameter url', 
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
        // Fetch target website dengan headers lengkap
        const response = await fetch(targetUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept-Encoding': 'gzip, deflate, br',
            'Cache-Control': 'no-cache',
            'Upgrade-Insecure-Requests': '1',
            'Sec-Fetch-Dest': 'document',
            'Sec-Fetch-Mode': 'navigate',
            'Sec-Fetch-Site': 'none'
          }
        });
        
        // Ambil HTML
        let html = await response.text();
        
        // Deteksi Cloudflare Protection
        const isCloudflareBlocked = html.includes('cf-challenge') || 
                                    html.includes('__cf_chl') ||
                                    html.includes('Just a moment') ||
                                    html.includes('Checking your browser') ||
                                    html.includes('cf-browser-verification');
        
        // Deteksi JS Protection ringan
        const hasJsProtection = html.includes('document.write') && 
                                html.includes('eval') ||
                                html.includes('script') && html.includes('atob');
        
        // Inject helper script buat bypass protection ringan
        if (hasJsProtection && !isCloudflareBlocked) {
          html = html.replace('</body>', `
            <script>
              // FionzyGPT Bypass Helper
              (function() {
                console.log('⚡ FionzyGPT Grabber Active');
                
                // Force load semua lazy content
                const observer = new MutationObserver(function(mutations) {
                  mutations.forEach(function(mutation) {
                    mutation.addedNodes.forEach(function(node) {
                      if(node.nodeType === 1) {
                        if(node.tagName === 'IMG' && node.dataset.src) {
                          node.src = node.dataset.src;
                        }
                        if(node.tagName === 'IFRAME' && node.dataset.src) {
                          node.src = node.dataset.src;
                        }
                      }
                    });
                  });
                });
                observer.observe(document.body, { childList: true, subtree: true });
                
                // Trigger semua event
                window.dispatchEvent(new Event('load'));
                document.dispatchEvent(new Event('DOMContentLoaded'));
                document.body.dispatchEvent(new Event('load'));
              })();
            </script>
          </body>`);
        }
        
        // Return hasil
        return new Response(JSON.stringify({
          success: true,
          html: html,
          url: targetUrl,
          size: html.length,
          blocked: isCloudflareBlocked,
          protection: {
            cloudflare: isCloudflareBlocked,
            jsProtection: hasJsProtection
          }
        }), {
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache'
          }
        });
        
      } catch (error) {
        return new Response(JSON.stringify({
          success: false,
          error: error.message,
          url: targetUrl
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
    if (url.pathname === '/api/health') {
      return new Response(JSON.stringify({
        status: 'online',
        name: 'FionzyGPT Grabber',
        version: '2879',
        timestamp: new Date().toISOString()
      }), {
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }
    
    // ========== SERVE INDEX.HTML ==========
    try {
      // Coba ambil index.html dari static assets
      const htmlResponse = await fetch(new URL('/index.html', request.url));
      if (htmlResponse.ok) {
        return htmlResponse;
      }
    } catch (e) {
      // Fallback ke HTML default
    }
    
    return new Response('Not Found - Upload index.html', { status: 404 });
  }
};