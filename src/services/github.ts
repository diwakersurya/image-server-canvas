/**
 * GitHub API service for fetching user information
 */

export interface GitHubUserInfo {
  login: string;
  id: number;
  node_id: string;
  avatar_url: string;
  gravatar_id: string;
  url: string;
  html_url: string;
  followers_url: string;
  following_url: string;
  gists_url: string;
  starred_url: string;
  subscriptions_url: string;
  organizations_url: string;
  repos_url: string;
  events_url: string;
  received_events_url: string;
  type: string;
  site_admin: boolean;
  name: string | null;
  company: string | null;
  blog: string;
  location: string | null;
  email: string | null;
  hireable: boolean | null;
  bio: string | null;
  twitter_username: string | null;
  public_repos: number;
  public_gists: number;
  followers: number;
  following: number;
  created_at: string;
  updated_at: string;
}

export interface GitHubServiceOptions {
  timeout?: number;
  userAgent?: string;
}

export class GitHubService {
  private readonly baseUrl = 'https://api.github.com';
  private readonly timeout: number;
  private readonly userAgent: string;
  private cache = new Map<string, { data: GitHubUserInfo; timestamp: number }>();
  private readonly cacheTimeout = 5 * 60 * 1000; // 5 minutes

  constructor(options: GitHubServiceOptions = {}) {
    this.timeout = options.timeout || 10000;
    this.userAgent = options.userAgent || 'Greeting-Image-Generator/1.0';
  }

  /**
   * Fetch GitHub user information
   */
  async getUserInfo(username: string): Promise<GitHubUserInfo> {
    // Check cache first
    const cached = this.cache.get(username);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(`${this.baseUrl}/users/${username}`, {
        headers: {
          'User-Agent': this.userAgent,
          'Accept': 'application/vnd.github.v3+json'
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error(`GitHub user '${username}' not found`);
        }
        if (response.status === 403) {
          throw new Error('GitHub API rate limit exceeded');
        }
        throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
      }

      const userInfo: GitHubUserInfo = await response.json();
      
      // Cache the result
      this.cache.set(username, {
        data: userInfo,
        timestamp: Date.now()
      });

      return userInfo;
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new Error('GitHub API request timeout');
        }
        throw error;
      }
      throw new Error('Unknown error occurred while fetching GitHub user info');
    }
  }

  /**
   * Get user avatar URL with fallback
   */
  async getUserAvatar(username: string): Promise<string> {
    try {
      const userInfo = await this.getUserInfo(username);
      return userInfo.avatar_url;
    } catch (error) {
      // Fallback to GitHub's default avatar URL pattern
      return `https://github.com/${username}.png`;
    }
  }

  /**
   * Check if user exists
   */
  async userExists(username: string): Promise<boolean> {
    try {
      await this.getUserInfo(username);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get cache stats
   */
  getCacheStats(): { size: number; entries: string[] } {
    return {
      size: this.cache.size,
      entries: Array.from(this.cache.keys())
    };
  }
}

/**
 * Default GitHub service instance
 */
export const githubService = new GitHubService();