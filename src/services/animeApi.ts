
// Serviço de API para busca de animes
export interface AnimeSearchResult {
  mal_id: number;
  title: string;
  title_english?: string;
  title_japanese?: string;
  synopsis?: string;
  score?: number;
  episodes?: number;
  status?: string;
  genres?: { name: string }[];
  images?: {
    jpg?: {
      image_url?: string;
      large_image_url?: string;
    };
  };
  year?: number;
  season?: string;
  studios?: { name: string }[];
}

export interface AnimeSearchResponse {
  data: AnimeSearchResult[];
  pagination: {
    current_page: number;
    has_next_page: boolean;
    last_visible_page: number;
  };
}

class AnimeApiService {
  private baseUrl = 'https://api.jikan.moe/v4';

  // Dados simulados para quando a API externa não estiver disponível
  private mockAnimes: AnimeSearchResult[] = [
    {
      mal_id: 16498,
      title: "Attack on Titan",
      title_english: "Attack on Titan",
      title_japanese: "進撃の巨人",
      synopsis: "Humanity fights for survival against giant humanoid Titans.",
      score: 9.0,
      episodes: 25,
      status: "Finished Airing",
      genres: [{ name: "Action" }, { name: "Drama" }, { name: "Fantasy" }],
      images: {
        jpg: {
          image_url: "https://images.pexels.com/photos/5428836/pexels-photo-5428836.jpeg?w=300",
          large_image_url: "https://images.pexels.com/photos/5428836/pexels-photo-5428836.jpeg?w=600"
        }
      },
      year: 2013,
      season: "spring",
      studios: [{ name: "Madhouse" }]
    },
    {
      mal_id: 11061,
      title: "Hunter x Hunter",
      title_english: "Hunter x Hunter",
      title_japanese: "ハンター×ハンター",
      synopsis: "A young boy named Gon freecss embarks on a quest to find his father.",
      score: 9.1,
      episodes: 148,
      status: "Finished Airing",
      genres: [{ name: "Action" }, { name: "Adventure" }, { name: "Fantasy" }],
      images: {
        jpg: {
          image_url: "https://images.pexels.com/photos/5428832/pexels-photo-5428832.jpeg?w=300",
          large_image_url: "https://images.pexels.com/photos/5428832/pexels-photo-5428832.jpeg?w=600"
        }
      },
      year: 2011,
      season: "fall",
      studios: [{ name: "Madhouse" }]
    },
    {
      mal_id: 19815,
      title: "No Game No Life",
      title_english: "No Game No Life",
      title_japanese: "ノーゲーム・ノーライフ",
      synopsis: "Two siblings are transported to a world where everything is decided by games.",
      score: 8.2,
      episodes: 12,
      status: "Finished Airing",
      genres: [{ name: "Comedy" }, { name: "Fantasy" }, { name: "Ecchi" }],
      images: {
        jpg: {
          image_url: "https://images.pexels.com/photos/5428830/pexels-photo-5428830.jpeg?w=300",
          large_image_url: "https://images.pexels.com/photos/5428830/pexels-photo-5428830.jpeg?w=600"
        }
      },
      year: 2014,
      season: "spring",
      studios: [{ name: "Madhouse" }]
    }
  ];

  async searchAnimes(query: string, page: number = 1): Promise<AnimeSearchResponse> {
    try {
      // Tentar usar a API real primeiro
      const response = await fetch(
        `${this.baseUrl}/anime?q=${encodeURIComponent(query)}&page=${page}&limit=20`
      );

      if (response.ok) {
        const data = await response.json();
        return data;
      }
    } catch (error) {
      console.warn('API externa indisponível, usando dados simulados:', error);
    }

    // Fallback para dados simulados
    const filteredAnimes = this.mockAnimes.filter(anime =>
      anime.title.toLowerCase().includes(query.toLowerCase()) ||
      (anime.title_english && anime.title_english.toLowerCase().includes(query.toLowerCase()))
    );

    return {
      data: filteredAnimes,
      pagination: {
        current_page: 1,
        has_next_page: false,
        last_visible_page: 1
      }
    };
  }

  async getAnimeById(id: number): Promise<AnimeSearchResult | null> {
    try {
      const response = await fetch(`${this.baseUrl}/anime/${id}`);
      if (response.ok) {
        const data = await response.json();
        return data.data;
      }
    } catch (error) {
      console.warn('API externa indisponível:', error);
    }

    // Fallback para dados simulados
    return this.mockAnimes.find(anime => anime.mal_id === id) || null;
  }

  async getTopAnimes(limit: number = 10): Promise<AnimeSearchResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/top/anime?limit=${limit}`);
      if (response.ok) {
        const data = await response.json();
        return data;
      }
    } catch (error) {
      console.warn('API externa indisponível:', error);
    }

    // Fallback para dados simulados
    return {
      data: this.mockAnimes.slice(0, limit),
      pagination: {
        current_page: 1,
        has_next_page: false,
        last_visible_page: 1
      }
    };
  }

  async getAnimesByGenre(genreId: number, page: number = 1): Promise<AnimeSearchResponse> {
    try {
      const response = await fetch(
        `${this.baseUrl}/anime?genres=${genreId}&page=${page}&limit=20`
      );
      if (response.ok) {
        const data = await response.json();
        return data;
      }
    } catch (error) {
      console.warn('API externa indisponível:', error);
    }

    // Fallback para dados simulados baseado no gênero
    const genreNames: { [key: number]: string } = {
      1: "Action",
      2: "Adventure", 
      4: "Comedy",
      8: "Drama",
      10: "Fantasy"
    };

    const targetGenre = genreNames[genreId];
    const filteredAnimes = targetGenre 
      ? this.mockAnimes.filter(anime => 
          anime.genres?.some(genre => genre.name === targetGenre)
        )
      : this.mockAnimes;

    return {
      data: filteredAnimes,
      pagination: {
        current_page: 1,
        has_next_page: false,
        last_visible_page: 1
      }
    };
  }
}

export const animeApi = new AnimeApiService();
