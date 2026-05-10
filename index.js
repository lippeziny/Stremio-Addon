const { addonBuilder, serveHTTP } = require("stremio-addon-sdk");
const axios = require("axios");

const USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

const STATIC_CATALOG = {
  movie: [
    { id: "tt0133093", type: "movie", name: "The Matrix" },
    { id: "tt1375666", type: "movie", name: "Inception" },
    { id: "tt4154796", type: "movie", name: "Avengers: Endgame" },
    { id: "tt0816692", type: "movie", name: "Interstellar" },
    { id: "tt0111161", type: "movie", name: "The Shawshank Redemption" },
    { id: "tt7286456", type: "movie", name: "Joker" },
    { id: "tt10872600", type: "movie", name: "Spider-Man: No Way Home" },
    { id: "tt9362722", type: "movie", name: "Spider-Man: Across the Spider-Verse" }
  ],
  series: [
    { id: "tt0944947", type: "series", name: "Game of Thrones" },
    { id: "tt0903747", type: "series", name: "Breaking Bad" },
    { id: "tt2861424", type: "series", name: "Rick and Morty" },
    { id: "tt4574334", type: "series", name: "Stranger Things" },
    { id: "tt7366338", type: "series", name: "Chernobyl" },
    { id: "tt0417299", type: "series", name: "Avatar: The Last Airbender" },
    { id: "tt5180504", type: "series", name: "The Witcher" },
    { id: "tt2250192", type: "series", name: "Sword Art Online" }
  ]
};

const builder = new addonBuilder({
  id: "org.kelvin.streamexistente",
  version: "3.0.0",
  name: "Streams Ias+Lippe (Global Update)",
  description: "Catálogo ampliado com busca e suporte para filmes e séries por IMDb",
  resources: ["catalog", "meta", "stream"],
  types: ["movie", "series"],
  idPrefixes: ["tt"],
  catalogs: [
    {
      type: "movie",
      id: "global-movies",
      name: "🎬 Filmes Populares",
      extra: [{ name: "search", isRequired: false }]
    },
    {
      type: "series",
      id: "global-series",
      name: "📺 Séries Populares",
      extra: [{ name: "search", isRequired: false }]
    }
  ]
});

async function searchImdb(term, type) {
  const letter = term[0]?.toLowerCase() || "a";
  const url = `https://v2.sg.media-imdb.com/suggestion/${letter}/${encodeURIComponent(term)}.json`;
  const response = await axios.get(url, {
    timeout: 10000,
    headers: { "User-Agent": USER_AGENT }
  });

  const wantedType = type === "movie" ? "feature" : "tvSeries";
  const items = response.data?.d || [];

  return items
    .filter(item => item.id?.startsWith("tt") && item.qid === wantedType)
    .slice(0, 30)
    .map(item => ({
      id: item.id,
      type,
      name: item.l,
      poster: item.i?.imageUrl,
      releaseInfo: item.y ? String(item.y) : undefined
    }));
}

function extractVideoLinks(html) {
  const regexVideo = new RegExp("https?://[^\\s\"\']+\\.(m3u8|mp4)(\\?[^\\s\"\']*)?", "gi");
  const matches = html.match(regexVideo) || [];
  return [...new Set(matches.map(link => link.replace(/\\/g, "")))];
}

builder.defineCatalogHandler(async ({ type, extra }) => {
  try {
    if (extra?.search) {
      const metas = await searchImdb(extra.search, type);
      return { metas };
    }
  } catch (error) {
    console.error(`Erro busca catálogo: ${error.message}`);
  }

  return { metas: STATIC_CATALOG[type] || [] };
});

builder.defineMetaHandler(async ({ type, id }) => {
  const fromStatic = STATIC_CATALOG[type]?.find(item => item.id === id);
  if (fromStatic) {
    return { meta: fromStatic };
  }

  return {
    meta: {
      id,
      type,
      name: id
    }
  };
});

builder.defineStreamHandler(async (args) => {
  const parts = args.id.split(":");
  const imdbId = parts[0];
  const season = parts[1];
  const episode = parts[2];
  const streams = [];

  const embedTargets = [];

  if (args.type === "series" && season && episode) {
    embedTargets.push(
      { url: `https://vidsrc.cc/v2/embed/tv/${imdbId}/${season}/${episode}`, referer: "https://vidsrc.cc/" },
      { url: `https://vidsrc.xyz/embed/tv/${imdbId}/${season}-${episode}`, referer: "https://vidsrc.xyz/" }
    );
  } else {
    embedTargets.push(
      { url: `https://vidsrc.cc/v2/embed/movie/${imdbId}`, referer: "https://vidsrc.cc/" },
      { url: `https://vidsrc.xyz/embed/movie/${imdbId}`, referer: "https://vidsrc.xyz/" }
    );
  }

  for (const target of embedTargets) {
    try {
      const response = await axios.get(target.url, {
        headers: {
          "User-Agent": USER_AGENT,
          "Referer": target.referer,
          "Accept-Language": "pt-BR,pt;q=0.9,en-US;q=0.8"
        },
        timeout: 10000
      });

      const allLinks = extractVideoLinks(response.data);
      allLinks.forEach(link => {
        if (link.includes("-ld.") || link.includes("/360/")) return;

        let quality = "HD";
        if (link.includes("1080") || link.includes("fullhd")) quality = "1080p Full HD";
        if (link.includes("2160") || link.includes("4k")) quality = "2160p 4K";

        streams.push({
          title: `🎬 ${quality} | Fonte automática`,
          url: link,
          behaviorHints: {
            notInterstitials: true,
            proxyHeaders: {
              common: {
                Referer: target.referer,
                "User-Agent": USER_AGENT
              }
            }
          }
        });
      });
    } catch (error) {
      console.error(`Falha em ${target.url}: ${error.message}`);
    }
  }

  const deduped = [];
  const seen = new Set();
  for (const stream of streams) {
    if (seen.has(stream.url)) continue;
    seen.add(stream.url);
    deduped.push(stream);
  }

  deduped.sort((a, b) => (a.title.includes("4K") ? -1 : b.title.includes("4K") ? 1 : 0));

  if (!deduped.length) {
    deduped.push({
      title: "⚠️ Nenhum stream encontrado para este título/episódio",
      url: "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"
    });
  }

  return { streams: deduped };
});

serveHTTP(builder.getInterface(), { port: process.env.PORT || 7000 });
