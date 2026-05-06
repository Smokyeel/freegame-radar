const axios = require("axios");

// ─── Platform Fetchers ────────────────────────────────────────────────────────

async function fetchEpicGames() {
  try {
    const url =
      "https://store-site-backend-static.ak.epicgames.com/freeGamesPromotions?locale=en-US&country=US&allowCountries=US";
    const { data } = await axios.get(url, { timeout: 10000 });
    const elements =
      data?.data?.Catalog?.searchStore?.elements || [];

    return elements
      .filter((game) => {
        const promotions = game.promotions;
        if (!promotions) return false;
        const offers = [
          ...(promotions.promotionalOffers?.[0]?.promotionalOffers || []),
          ...(promotions.upcomingPromotionalOffers?.[0]?.promotionalOffers || []),
        ];
        return offers.some(
          (o) =>
            o.discountSetting?.discountPercentage === 0 &&
            new Date(o.startDate) <= new Date() &&
            new Date(o.endDate) > new Date()
        );
      })
      .map((game) => {
        const offer =
          game.promotions.promotionalOffers?.[0]?.promotionalOffers?.[0] || {};
        const originalPrice =
          game.price?.totalPrice?.fmtPrice?.originalPrice || "Unknown";
        return {
          title: game.title,
          platform: "Epic Games",
          originalPrice,
          url: `https://store.epicgames.com/en-US/p/${game.productSlug || game.urlSlug}`,
          expiryDate: offer.endDate
            ? new Date(offer.endDate).toLocaleDateString()
            : "Unknown",
          description: game.description || "",
        };
      });
  } catch (err) {
    console.error("[Epic] Failed to fetch:", err.message);
    return [];
  }
}

async function fetchSteamFreeWeekend() {
  try {
    // Steam's free weekend / free-to-play specials via the storefront API
    const url =
      "https://store.steampowered.com/api/featuredcategories?cc=us&l=en";
    const { data } = await axios.get(url, { timeout: 10000 });
    const specials = data?.specials?.items || [];

    return specials
      .filter((game) => game.discount_percent === 100)
      .map((game) => ({
        title: game.name,
        platform: "Steam",
        originalPrice: game.original_price
          ? `$${(game.original_price / 100).toFixed(2)}`
          : "Unknown",
        url: `https://store.steampowered.com/app/${game.id}`,
        expiryDate: "Check Steam for details",
        description: "",
      }));
  } catch (err) {
    console.error("[Steam] Failed to fetch:", err.message);
    return [];
  }
}

async function fetchGOGFreeGames() {
  try {
    const url =
      "https://www.gog.com/games/ajax/filtered?mediaType=game&price=free&sort=popularity";
    const { data } = await axios.get(url, { timeout: 10000 });
    const products = data?.products || [];

    return products
      .filter((g) => g.price?.isFree)
      .map((g) => ({
        title: g.title,
        platform: "GOG",
        originalPrice: g.price?.baseAmount ? `$${g.price.baseAmount}` : "Unknown",
        url: `https://gog.com${g.url}`,
        expiryDate: "Check GOG for details",
        description: g.category || "",
      }));
  } catch (err) {
    console.error("[GOG] Failed to fetch:", err.message);
    return [];
  }
}

async function fetchIsThereAnyDeal() {
  // IsThereAnyDeal API — covers Prime Gaming, GOG giveaways, and more
  // Get a free API key at: https://isthereanydeal.com/dev/app/
  const apiKey = process.env.ITAD_API_KEY;
  if (!apiKey) {
    console.warn("[ITAD] No API key set. Add ITAD_API_KEY to your .env file.");
    console.warn("       Get a free key at: https://isthereanydeal.com/dev/app/");
    return [];
  }

  try {
    // Fetch current giveaways — PC only via the 'free' deals endpoint
    const { data } = await axios.get(
      "https://api.isthereanydeal.com/deals/v2",
      {
        timeout: 10000,
        params: {
          key: apiKey,
          limit: 20,
          price_max: 0,       // only free deals
        },
      }
    );

    const deals = data?.list || [];
    return deals.map((deal) => ({
      title: deal.title,
      platform: deal.shop?.name || "IsThereAnyDeal",
      originalPrice: deal.regular?.amount
        ? `$${deal.regular.amount.toFixed(2)}`
        : "Unknown",
      url: deal.url || "https://isthereanydeal.com",
      expiryDate: deal.expiry
        ? new Date(deal.expiry).toLocaleDateString()
        : "Limited time",
      description: "",
    }));
  } catch (err) {
    console.error("[ITAD] Failed to fetch:", err.message);
    return [];
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function fetchAllFreeGames() {
  console.log("🔍 Fetching free games from all platforms...\n");

  const [epic, steam, gog, itad] = await Promise.all([
    fetchEpicGames(),
    fetchSteamFreeWeekend(),
    fetchGOGFreeGames(),
    fetchIsThereAnyDeal(),
  ]);

  // Deduplicate by title (ITAD may overlap with Epic/GOG/Steam)
  const seen = new Set();
  const all = [...epic, ...steam, ...gog, ...itad].filter((g) => {
    const key = g.title.toLowerCase().trim();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  console.log(`✅ Found ${all.length} free game(s):\n`);
  all.forEach((g) => {
    console.log(`  🎮 [${g.platform}] ${g.title}`);
    console.log(`     Was: ${g.originalPrice} | Expires: ${g.expiryDate}`);
    console.log(`     ${g.url}\n`);
  });

  return all;
}

module.exports = { fetchAllFreeGames };
