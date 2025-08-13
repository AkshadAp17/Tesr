import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { GitHubClient } from "@/lib/github";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import type { GitHubFile } from "@/lib/github";
import type { RepositoryFile } from "@shared/schema";

interface FileBrowserProps {
  repositoryId: string;
  owner: string;
  repo: string;
  accessToken: string;
}

interface FileNode extends GitHubFile {
  isExpanded?: boolean;
  isSelected?: boolean;
  children?: FileNode[];
  language?: string;
  content?: string;
  id?: string;
}

export default function FileBrowser({ repositoryId, owner, repo, accessToken }: FileBrowserProps) {
  const { toast } = useToast();
  const [fileTree, setFileTree] = useState<FileNode[]>([]);
  const [selectedCount, setSelectedCount] = useState(0);
  const githubClient = new GitHubClient(accessToken);

  // Fetch repository files from storage
  const { data: storedFiles = [] } = useQuery<RepositoryFile[]>({
    queryKey: ["/api/repositories", repositoryId, "files"],
    enabled: !!repositoryId,
  });

  // Fetch root directory from GitHub
  const { data: rootFiles, isLoading } = useQuery({
    queryKey: ["/api/github/repositories", owner, repo, "contents", ""],
    queryFn: async () => {
      return githubClient.getRepositoryContents(owner, repo, "");
    },
    enabled: !!owner && !!repo && !!accessToken,
  });

  // Store file mutation
  const storeFileMutation = useMutation({
    mutationFn: async (file: Omit<RepositoryFile, 'id'>) => {
      const response = await apiRequest(
        "POST",
        `/api/repositories/${repositoryId}/files`,
        file
      );
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/repositories", repositoryId, "files"],
      });
    },
  });

  // Update file selection mutation
  const updateFileMutation = useMutation({
    mutationFn: async ({ fileId, isSelected }: { fileId: string; isSelected: boolean }) => {
      const response = await apiRequest(
        "PATCH",
        `/api/files/${fileId}`,
        { isSelected }
      );
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/repositories", repositoryId, "files"],
      });
    },
  });

  useEffect(() => {
    if (rootFiles && storedFiles) {
      const mergedTree = mergeGitHubWithStored(rootFiles, storedFiles);
      setFileTree(mergedTree);
      updateSelectedCount(mergedTree);
    } else if (rootFiles) {
      setFileTree(rootFiles.map(file => ({ ...file, isSelected: false })));
    }
  }, [rootFiles, storedFiles]);

  const mergeGitHubWithStored = (githubFiles: GitHubFile[], stored: RepositoryFile[]): FileNode[] => {
    return githubFiles.map(githubFile => {
      const storedFile = stored.find(f => f.path === githubFile.path);
      return {
        ...githubFile,
        id: storedFile?.id,
        isSelected: storedFile?.isSelected || false,
        language: storedFile?.language || getLanguageFromExtension(githubFile.name),
        content: storedFile?.content || undefined,
      };
    });
  };

  const updateSelectedCount = (tree: FileNode[]) => {
    const count = countSelectedFiles(tree);
    setSelectedCount(count);
  };

  const countSelectedFiles = (nodes: FileNode[]): number => {
    return nodes.reduce((count, node) => {
      let nodeCount = node.isSelected && node.type === 'file' ? 1 : 0;
      if (node.children) {
        nodeCount += countSelectedFiles(node.children);
      }
      return count + nodeCount;
    }, 0);
  };

  const getLanguageFromExtension = (filename: string): string => {
    const ext = filename.toLowerCase().split('.').pop();
    const languageMap: Record<string, string> = {
      'js': 'javascript',
      'jsx': 'javascript',
      'ts': 'typescript',
      'tsx': 'typescript',
      'py': 'python',
      'java': 'java',
      'cpp': 'cpp',
      'c': 'c',
      'cs': 'csharp',
      'php': 'php',
      'rb': 'ruby',
      'go': 'go',
      'rs': 'rust',
      'html': 'html',
      'css': 'css',
      'scss': 'scss',
      'json': 'json',
      'md': 'markdown',
    };
    return languageMap[ext || ''] || 'text';
  };

  const getFileIcon = (file: FileNode) => {
    if (file.type === 'dir') {
      return file.isExpanded ? 'fas fa-folder-open text-yellow-500' : 'fas fa-folder text-yellow-500';
    }
    
    const ext = file.name.toLowerCase().split('.').pop();
    const iconMap: Record<string, string> = {
      'js': 'fab fa-js-square text-yellow-400',
      'jsx': 'fab fa-js-square text-yellow-400',
      'ts': 'fab fa-js-square text-blue-400',
      'tsx': 'fab fa-js-square text-blue-400',
      'py': 'fab fa-python text-green-400',
      'java': 'fab fa-java text-red-400',
      'html': 'fab fa-html5 text-orange-400',
      'css': 'fab fa-css3-alt text-blue-400',
      'md': 'fab fa-markdown text-blue-300',
      'json': 'fas fa-file-code text-green-400',
    };
    
    return iconMap[ext || ''] || 'fas fa-file text-slate-400';
  };

  const handleFileSelect = async (file: FileNode) => {
    if (file.type === 'dir') {
      await handleDirectoryToggle(file);
      return;
    }

    const newSelected = !file.isSelected;
    
    // Update local state immediately
    setFileTree(prev => updateFileSelection(prev, file.path, newSelected));
    
    // If file is not stored yet, store it first
    if (!file.id) {
      try {
        // Fetch file content if selecting
        let content = '';
        if (newSelected && file.download_url) {
          content = await githubClient.getFileContent(owner, repo, file.path);
        }

        const storedFile = await storeFileMutation.mutateAsync({
          repositoryId,
          path: file.path,
          name: file.name,
          type: file.type,
          size: file.size?.toString() || '0',
          content,
          language: getLanguageFromExtension(file.name),
          isSelected: newSelected,
        });
        
        // Update file tree with stored file ID
        setFileTree(prev => updateFileId(prev, file.path, storedFile.id));
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to process file",
          variant: "destructive",
        });
      }
    } else {
      // Update existing file selection
      updateFileMutation.mutate({ fileId: file.id, isSelected: newSelected });
    }
  };

  const updateFileSelection = (tree: FileNode[], path: string, isSelected: boolean): FileNode[] => {
    return tree.map(node => {
      if (node.path === path) {
        return { ...node, isSelected };
      }
      if (node.children) {
        return { ...node, children: updateFileSelection(node.children, path, isSelected) };
      }
      return node;
    });
  };

  const updateFileId = (tree: FileNode[], path: string, id: string): FileNode[] => {
    return tree.map(node => {
      if (node.path === path) {
        return { ...node, id };
      }
      if (node.children) {
        return { ...node, children: updateFileId(node.children, path, id) };
      }
      return node;
    });
  };

  const handleDirectoryToggle = async (directory: FileNode) => {
    if (!directory.isExpanded && !directory.children) {
      try {
        const children = await githubClient.getRepositoryContents(owner, repo, directory.path);
        const mergedChildren = storedFiles 
          ? mergeGitHubWithStored(children, storedFiles)
          : children.map(child => ({ ...child, isSelected: false }));
        
        setFileTree(prev => 
          prev.map(node => 
            node.path === directory.path 
              ? { ...node, isExpanded: true, children: mergedChildren }
              : node
          )
        );
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to load directory contents",
          variant: "destructive",
        });
      }
    } else {
      setFileTree(prev => 
        prev.map(node => 
          node.path === directory.path 
            ? { ...node, isExpanded: !node.isExpanded }
            : node
        )
      );
    }
  };

  const renderFileNode = (file: FileNode, depth: number = 0) => (
    <div key={file.path} className="file-tree-item">
      <div 
        className="flex items-center py-1 hover:bg-dark-border/20 rounded cursor-pointer"
        style={{ paddingLeft: `${depth * 24 + 8}px` }}
        onClick={() => handleFileSelect(file)}
        data-testid={`file-${file.name}`}
      >
        {file.type === 'file' && (
          <Checkbox
            checked={file.isSelected || false}
            className="mr-3 text-gh-blue"
            data-testid={`checkbox-${file.name}`}
          />
        )}
        <i className={`${getFileIcon(file)} mr-2`}></i>
        <span className="text-slate-100 text-sm flex-1" data-testid={`filename-${file.name}`}>
          {file.name}
        </span>
        {file.type === 'file' && file.size && (
          <span className="text-xs text-slate-500" data-testid={`filesize-${file.name}`}>
            {formatFileSize(parseInt(file.size.toString()))}
          </span>
        )}
      </div>
      
      {file.isExpanded && file.children && (
        <div className="ml-0">
          {file.children.map(child => renderFileNode(child, depth + 1))}
        </div>
      )}
    </div>
  );

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
  };

  const clearSelection = () => {
    setFileTree(prev => clearAllSelections(prev));
    
    // Update stored files
    if (storedFiles) {
      storedFiles
        .filter(f => f.isSelected)
        .forEach(f => {
          if (f.id) {
            updateFileMutation.mutate({ fileId: f.id, isSelected: false });
          }
        });
    }
  };

  const clearAllSelections = (tree: FileNode[]): FileNode[] => {
    return tree.map(node => ({
      ...node,
      isSelected: false,
      children: node.children ? clearAllSelections(node.children) : undefined,
    }));
  };

  if (isLoading) {
    return (
      <div className="flex-1 p-4 flex items-center justify-center" data-testid="loading-files">
        <div className="animate-spin w-6 h-6 border-2 border-gh-blue border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4">
      <div className="space-y-1">
        {selectedCount > 0 && (
          <div className="flex items-center justify-between mb-4 p-2 bg-gh-blue/10 rounded-lg">
            <span className="text-sm text-gh-blue" data-testid="selected-count">
              {selectedCount} files selected
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearSelection}
              className="text-slate-400 hover:text-slate-100"
              data-testid="clear-selection-button"
            >
              <i className="fas fa-times"></i>
            </Button>
          </div>
        )}
        
        {fileTree.map(file => renderFileNode(file))}
        
        {fileTree.length === 0 && (
          <div className="text-center text-slate-400 py-8" data-testid="no-files">
            <i className="fas fa-folder-open text-2xl mb-2"></i>
            <p>No files found</p>
          </div>
        )}
      </div>
    </div>
  );
}
