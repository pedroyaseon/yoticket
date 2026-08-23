import {
  BadRequestException,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface TmdbMovie {
  id: number;
  title: string;
  overview: string;
  poster_path: string | null;
  release_date: string;
}
interface TmdbResponse {
  results: TmdbMovie[];
}

@Injectable()
export class CatalogService {
  constructor(private readonly config: ConfigService) {}

  async searchMovies(query: string) {
    const normalized = query.trim();
    if (normalized.length < 2)
      throw new BadRequestException(
        'Informe ao menos dois caracteres para buscar um filme.',
      );
    const token = this.config.get<string>('TMDB_API_READ_ACCESS_TOKEN');
    if (!token)
      throw new ServiceUnavailableException(
        'Catálogo de filmes não configurado.',
      );
    try {
      const response = await fetch(
        `https://api.themoviedb.org/3/search/movie?language=pt-BR&query=${encodeURIComponent(normalized)}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            accept: 'application/json',
          },
          signal: AbortSignal.timeout(8000),
        },
      );
      if (!response.ok) throw new Error(`TMDb ${response.status}`);
      const payload = (await response.json()) as TmdbResponse;
      return payload.results.slice(0, 12).map((movie) => ({
        externalId: movie.id,
        title: movie.title,
        description: movie.overview,
        posterUrl: movie.poster_path
          ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
          : null,
        releaseDate: movie.release_date || null,
      }));
    } catch {
      throw new ServiceUnavailableException(
        'Não foi possível consultar o catálogo agora.',
      );
    }
  }
}
