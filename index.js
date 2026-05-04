const { addonBuilder, serveHTTP } = require("stremio-addon-sdk");
const axios = require("axios");

const builder = new addonBuilder({
  id: "org.kelvin.streamexistente",
  version: "2.3.2",
  name: "Streams Ias+Lippe (SAO Update)",
  description: "Euphoria, Miraculous & SAO - Full HD",
  resources: ["stream"],
  types: ["series"],
  // Adicionado tt2250192 para Sword Art Online
  idPrefixes: ["tt8772296", "tt2580046", "tt2250192"], 
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
  } else if (ttid === "tt2250192") {
    // Lógica para Sword Art Online (SushiAnimes)
    referer = "https://sushianimes.com.br/";
    // O site usa mapeamentos diferentes para as temporadas
    if (season === "1") {
      pageUrl = `https://sushianimes.com.br/anime/sword-art-online-dublado-864-1-season-1-episode-${episode}`;
    } else {
      // Exemplo para temporada 3 conforme enviado
      pageUrl = `https://sushianimes.com.br/anime/sword-art-online-dublado-864-2-season-3-episode-${episode}`;
    }
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
    // Regex atualizado para capturar .m3u8 e .mp4 de todos os domínios suportados
    const regexVideo = /https?:\/\/[a-z0-9-.]+\.(321moviesfree|cuevana4br|pixel-sus-4k-image)\.com\/[^\s"']+\.(m3u8|mp4)[^\s"']*/gi;
    const matches = html.match(regexVideo);

    if (matches && matches.length > 0) {
      let allLinks = [...new Set(matches.map(link => link.replace(/\\/g, '')))];

      allLinks.forEach(link => {
        // Filtro: Ignora se for qualidade baixa (LD)
        if (link.includes("-ld.m3u8")) return; 

        let quality = "720p HD";
        // Marca como 1080p se tiver o sufixo ou se for do novo CDN 4k
        if (link.includes("-hd.m3u8") || link.includes("4k-image")) {
          quality = "1080p Full HD";
        }

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

      // Ordena para que a melhor qualidade apareça primeiro
      streams.sort((a, b) => a.title.includes("1080p") ? -1 : 1);
    }
  } catch (error) {
    console.error(`❌ Erro: ${error.message}`);
  }

  streams.push({
    title: "🧪 TESTE: Addon Online",
    url: "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"
  });

  return { streams };
});

serveHTTP(builder.getInterface(), { port: process.env.PORT || 7000 });
