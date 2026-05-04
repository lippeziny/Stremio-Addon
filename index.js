const { addonBuilder, serveHTTP } = require("stremio-addon-sdk");
const axios = require("axios");

const builder = new addonBuilder({
  id: "org.kelvin.streamexistente",
  version: "2.2.5",
  name: "Streams Ias+Lippe (Fixed)",
  description: "Euphoria & Miraculous - Anti-Block",
  resources: ["stream"],
  types: ["series"],
  idPrefixes: ["tt8772296", "tt2580046"], 
  catalogs: []
});

builder.defineStreamHandler(async (args) => {
  const [ttid, season, episode] = args.id.split(":");
  
  const streams = [
    {
      title: "🧪 TESTE: Addon Conectado",
      url: "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"
    }
  ];

  let pageUrl = "";
  let siteReferer = "";

  if (ttid === "tt8772296") {
    pageUrl = `https://ww20.321moviesfree.com/pt/detail/drama/kTfB7Zz0UgZbRGOZEPTgU-Euphoria-Season-${season}/${episode}`;
    siteReferer = "https://ww20.321moviesfree.com/";
  } else if (ttid === "tt2580046") {
    pageUrl = `https://es.cuevana4br.com/pt/detail/drama/sqA4FSfx1TFbiDPgieGd9-Miraculous-Tales-of-Ladybug--Cat-Noir-Season-${season}/${episode}`;
    siteReferer = "https://es.cuevana4br.com/";
  }

  try {
    const response = await axios.get(pageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
        'Referer': siteReferer,
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      },
      timeout: 10000
    });

    const html = response.data;
    
    // Regex ajustado para capturar o link completo com o token de segurança
    const regexVideo = /https?[\/\w\d\.\-\\]+\.m3u8[\w\d\:\.\-\/\\%\?\=\&\#]*/gi;
    const matches = html.match(regexVideo);

    if (matches) {
      // Filtrar para pegar o link que realmente pertence ao player de vídeo
      const videoLink = matches.find(link => link.includes('stream') || link.includes('321movies') || link.includes('cuevana'));

      if (videoLink) {
        let directLink = videoLink.replace(/\\/g, '');

        streams.push({
          title: `🎬 Stream - T${season} E${episode}`,
          url: directLink,
          behaviorHints: {
            notInterstitials: true,
            proxyHeaders: {
              "common": { 
                "Referer": siteReferer,
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
              }
            }
          }
        });
        console.log("✅ Link extraído com sucesso!");
      }
    }
  } catch (error) {
    console.error(`❌ Erro 403 ou de Conexão: ${error.message}`);
  }

  return { streams };
});

serveHTTP(builder.getInterface(), { port: process.env.PORT || 7000 });
