export interface GitHubRepository {
  id: number;
  name: string;
  full_name: string;
  description: string;
  language: string;
  private: boolean;
  owner: {
    login: string;
  };
}

export interface GitHubFile {
  name: string;
  path: string;
  type: 'file' | 'dir';
  size?: number;
  download_url?: string;
}

export class GitHubClient {
  private accessToken: string;

  constructor(accessToken: string) {
    this.accessToken = accessToken;
  }

  private getHeaders() {
    return {
      'Authorization': `Bearer ${this.accessToken}`,
      'Content-Type': 'application/json',
    };
  }

  async getRepositories(): Promise<GitHubRepository[]> {
    const response = await fetch('/api/github/repositories', {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch repositories');
    }

    return response.json();
  }

  async getRepositoryContents(owner: string, repo: string, path: string = ''): Promise<GitHubFile[]> {
    const url = `/api/github/repositories/${owner}/${repo}/contents?path=${encodeURIComponent(path)}`;
    
    const response = await fetch(url, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch repository contents');
    }

    return response.json();
  }

  async getFileContent(owner: string, repo: string, path: string): Promise<string> {
    const url = `/api/github/repositories/${owner}/${repo}/file?path=${encodeURIComponent(path)}`;
    
    const response = await fetch(url, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch file content');
    }

    const data = await response.json();
    return data.content;
  }

  async createPullRequest(
    owner: string,
    repo: string,
    title: string,
    body: string,
    head: string,
    base: string
  ) {
    const url = `/api/github/repositories/${owner}/${repo}/pull-requests`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ title, body, head, base }),
    });

    if (!response.ok) {
      throw new Error('Failed to create pull request');
    }

    return response.json();
  }
}
