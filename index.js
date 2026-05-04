const { addonBuilder, serveHTTP } = require("stremio-addon-sdk");
const axios = require("axios");

const builder = new addonBuilder({
  id: "org.kelvin.streamexistente",
  version: "2.2.6",
  name: "Streams Ias+Lippe (V3)",
  description: "Euphoria & Miraculous - Bypass 403",
  resources: ["stream"],
  types: ["series"],
  idPrefixes: ["tt8772296", "tt2580046"], 
  catalogs: []
});

builder.defineStreamHandler(async (args) => {
  const [ttid, season, episode] = args.id.split(":");
  const streams = [{
    title: "🧪 TESTE: Addon Online",
    url: "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"
  }];

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
        // Disfarce de Galaxy A15 (Seu celular)
        'User-Agent': 'Mozilla/5.0 (Linux; Android 14; SM-A155F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Encoding': 'gzip, deflate, br',
        'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
        'Referer': siteReferer,
        'Origin': siteReferer,
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'same-origin',
        'Upgrade-Insecure-Requests': '1',
        'Cache-Control': 'max-age=0'
      },
      timeout: 12000
    });

    const html = response.data;
    
    // REGEX REFORÇADO: Pega o link mesmo com o token gigante (?hdnts=...)
    const regexVideo = /https?[\/\w\d\.\-\\]+\.m3u8[^\s"']*/gi;
    const matches = html.match(regexVideo);

    if (matches) {
      const videoLink = matches.find(link => link.includes('stream') || link.includes('321movies') || link.includes('cuevana'));

      if (videoLink) {
        let directLink = videoLink.replace(/\\/g, ''); // Limpa barras do JSON

        streams.push({
          title: `🎬 Stream - T${season} E${episode}`,
          url: directLink,
          behaviorHints: {
            notInterstitials: true,
            proxyHeaders: {
              "common": { 
                "Referer": siteReferer,
                "User-Agent": "Mozilla/5.0 (Linux; Android 14; SM-A155F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36"
              }
            }
          }
        });
      }
    }
  } catch (error) {
    console.error(`Status: ${error.response ? error.response.status : 'Erro de rede'}`);
  }

  return { streams };
});

serveHTTP(builder.getInterface(), { port: process.env.PORT || 7000 });
