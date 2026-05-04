const { addonBuilder, serveHTTP } = require("stremio-addon-sdk");
const axios = require("axios");

const builder = new addonBuilder({
  id: "org.kelvin.streamexistente",
  version: "2.2.4",
  name: "Streams Ias+Lippe (Multi)",
  description: "Euphoria & Miraculous - Versão Estável",
  resources: ["stream"],
  types: ["series"],
  idPrefixes: ["tt8772296", "tt2580046"], 
  catalogs: []
});

builder.defineStreamHandler(async (args) => {
  const [ttid, season, episode] = args.id.split(":");
  
  const streams = [
    {
      title: "🧪 TESTE: Addon Ativo",
      url: "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"
    }
  ];

  let pageUrl = "";
  let referer = "";

  if (ttid === "tt8772296") {
    // EUPHORIA - Note que usamos o padrão do site para a S3
    pageUrl = `https://ww20.321moviesfree.com/pt/detail/drama/kTfB7Zz0UgZbRGOZEPTgU-Euphoria-Season-${season}/${episode}`;
    referer = "https://ww20.321moviesfree.com/";
  } else if (ttid === "tt2580046") {
    // MIRACULOUS
    pageUrl = `https://es.cuevana4br.com/pt/detail/drama/sqA4FSfx1TFbiDPgieGd9-Miraculous-Tales-of-Ladybug--Cat-Noir-Season-${season}/${episode}`;
    referer = "https://es.cuevana4br.com/";
  }

  try {
    const response = await axios.get(pageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': referer
      },
      timeout: 10000
    });

    const html = response.data;
    
    // REGEX REFINADO: Busca links .m3u8 específicos desses domínios, com ou sem tokens
    const regexVideo = /https?[\(\)\[\]\w\d\:\.\-\/\\%]+\.m3u8[\w\d\:\.\-\/\\%\?\=\&\#]*/gi;
    const matches = html.match(regexVideo);

    if (matches) {
      // Pega o primeiro link que contenha o nome do servidor de vídeo
      const videoLink = matches.find(link => link.includes('321moviesfree') || link.includes('cuevana4br') || link.includes('stream'));

      if (videoLink) {
        // Limpa barras invertidas (comum em arquivos JSON/HTML)
        let directLink = videoLink.replace(/\\/g, '');

        streams.push({
          title: `🎬 Stream - T${season} E${episode}`,
          url: directLink,
          behaviorHints: {
            notInterstitials: true,
            proxyHeaders: {
              "common": { 
                "Referer": referer,
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
              }
            }
          }
        });
      }
    }
  } catch (error) {
    console.error(`ERRO: ${error.message}`);
  }

  return { streams };
});

serveHTTP(builder.getInterface(), { port: process.env.PORT || 7000 });
