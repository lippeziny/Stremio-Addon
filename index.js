const { addonBuilder, serveHTTP } = require("stremio-addon-sdk");
const axios = require("axios");

const builder = new addonBuilder({
  id: "org.kelvin.streamexistente",
  version: "2.3.1",
  name: "Streams Ias+Lippe (Alta Qualidade)",
  description: "Apenas 720p e 1080p",
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
      let allLinks = [...new Set(matches.map(link => link.replace(/\\/g, '')))];

      allLinks.forEach(link => {
        // FILTRO DE QUALIDADE: Ignora se for LD (Low Definition)
        if (link.includes("-ld.m3u8")) return; 

        let quality = "720p HD";
        if (link.includes("-hd.m3u8")) quality = "1080p Full HD";

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

      // Ordena para o 1080p ficar sempre no topo
      streams.sort((a, b) => a.title.includes("1080p") ? -1 : 1);
    }
  } catch (error) {
    console.error(`❌ Erro: ${error.message}`);
  }

  // O vídeo de teste a gente deixa pra você saber que o addon não caiu
  streams.push({
    title: "🧪 TESTE: Addon Conectado",
    url: "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"
  });

  return { streams };
});

serveHTTP(builder.getInterface(), { port: process.env.PORT || 7000 });
