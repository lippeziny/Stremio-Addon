const { addonBuilder, serveHTTP } = require("stremio-addon-sdk");
const axios = require("axios");

const builder = new addonBuilder({
  id: "org.kelvin.streamexistente",
  version: "2.2.2",
  name: "Streams Ias+Lippe (Multi)",
  description: "Euphoria & Miraculous - Corrigido",
  resources: ["stream"],
  types: ["series"],
  // IDs CORRETOS: Euphoria e Miraculous (Série)
  idPrefixes: ["tt8772296", "tt2580046"], 
  catalogs: []
});

builder.defineStreamHandler(async (args) => {
  const [ttid, season, episode] = args.id.split(":");
  
  const streams = [
    {
      title: "🧪 TESTE: Addon no Termux",
      url: "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"
    }
  ];

  let pageUrl = "";
  let referer = "";

  // Lógica de Direcionamento por ID
  if (ttid === "tt8772296") {
    // EUPHORIA
    pageUrl = `https://ww20.321moviesfree.com/pt/detail/drama/kTfB7Zz0UgZbRGOZEPTgU-Euphoria-Season-${season}/${episode}`;
    referer = "https://ww20.321moviesfree.com/";
  } else if (ttid === "tt2580046") {
    // MIRACULOUS (Usando o ID que você confirmou)
    pageUrl = `https://es.cuevana4br.com/pt/detail/drama/sqA4FSfx1TFbiDPgieGd9-Miraculous-Tales-of-Ladybug--Cat-Noir-Season-${season}/${episode}`;
    referer = "https://es.cuevana4br.com/";
  } else {
    return { streams: [] };
  }

  try {
    const response = await axios.get(pageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36',
        'Referer': referer,
        'Accept-Language': 'pt-BR,pt;q=0.9'
      },
      timeout: 10000
    });

    const html = response.data;
    
    // Regex Multi-Site (Pega 321movies ou Cuevana4br)
    const regexVideo = /https?:\/\/[a-z0-9-]+\.(321moviesfree|cuevana4br)\.com\/[^\s"']+\.m3u8[^\s"']*/gi;
    const matches = html.match(regexVideo);

    if (matches && matches.length > 0) {
      let directLink = matches[0].replace(/\\/g, '');

      streams.push({
        title: `🎬 Stream - T${season} E${episode}`,
        url: directLink,
        behaviorHints: {
          notInterstitials: true,
          proxyHeaders: {
            "common": { 
              "Referer": referer,
              "User-Agent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36"
            }
          }
        }
      });
      console.log(`✅ Sucesso! Link extraído para o ID ${ttid}`);
    } else {
      console.log(`⚠️ Link não encontrado na página para ${ttid} T${season} E${episode}`);
    }

  } catch (error) {
    console.error(`❌ Erro no Termux: ${error.message}`);
  }

  return { streams };
});

serveHTTP(builder.getInterface(), { port: process.env.PORT || 7000 });

