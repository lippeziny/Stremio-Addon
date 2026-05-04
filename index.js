const { addonBuilder, serveHTTP } = require("stremio-addon-sdk");
const axios = require("axios");

const builder = new addonBuilder({
  id: "org.kelvin.streamexistente",
  version: "2.3.0",
  name: "Streams Ias+Lippe (Multi)",
  description: "Euphoria & Miraculous - Seleção de Qualidade",
  resources: ["stream"],
  types: ["series"],
  idPrefixes: ["tt8772296", "tt2580046"], 
  catalogs: []
});

builder.defineStreamHandler(async (args) => {
  const [ttid, season, episode] = args.id.split(":");
  const streams = [];

  let pageUrl = "";
  let referer = "";

  if (ttid === "tt8772296") {
    pageUrl = `https://ww20.321moviesfree.com/pt/detail/drama/kTfB7Zz0UgZbRGOZEPTgU-Euphoria-Season-${season}/${episode}`;
    referer = "https://ww20.321moviesfree.com/";
  } else if (ttid === "tt2580046") {
    pageUrl = `https://es.cuevana4br.com/pt/detail/drama/sqA4FSfx1TFbiDPgieGd9-Miraculous-Tales-of-Ladybug--Cat-Noir-Season-${season}/${episode}`;
    referer = "https://es.cuevana4br.com/";
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
    const regexVideo = /https?:\/\/[a-z0-9-]+\.(321moviesfree|cuevana4br)\.com\/[^\s"']+\.m3u8[^\s"']*/gi;
    const matches = html.match(regexVideo);

    if (matches && matches.length > 0) {
      // Remove duplicatas e limpa as barras
      let allLinks = [...new Set(matches.map(link => link.replace(/\\/g, '')))];

      // Criar uma lista de streams para cada qualidade encontrada
      allLinks.forEach(link => {
        let quality = "Qualidade Padrão";
        
        // Mapeamento baseado nos links que você me mandou
        if (link.includes("-hd.m3u8")) quality = "1080p Full HD";
        else if (link.includes("-sd.m3u8")) quality = "720p HD (SD)";
        else if (link.includes("-ld.m3u8")) quality = "480p/540p LD";

        streams.push({
          title: `🎬 [${quality}] - T${season} E${episode}`,
          url: link,
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
      });

      // Ordena para o melhor link aparecer primeiro na lista do Stremio
      streams.sort((a, b) => {
        if (a.title.includes("1080p")) return -1;
        if (b.title.includes("1080p")) return 1;
        if (a.title.includes("720p")) return -1;
        return 1;
      });

    }
  } catch (error) {
    console.error(`❌ Erro: ${error.message}`);
  }

  // Adiciona o vídeo de teste no final da lista
  streams.push({
    title: "🧪 TESTE: Addon Online",
    url: "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"
  });

  return { streams };
});

serveHTTP(builder.getInterface(), { port: process.env.PORT || 7000 });
