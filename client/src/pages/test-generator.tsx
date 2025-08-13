import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { 
  GitBranch, 
  Code, 
  TestTube, 
  FileText, 
  Settings, 
  Play, 
  Download, 
  GitPullRequest, 
  Zap,
  FileCode,
  CheckCircle,
  AlertCircle,
  Clock,
  Target,
  Layers,
  Sparkles,
  RefreshCw,
  Plus,
  Minus
} from "lucide-react";

export default function TestGenerator() {
  const { toast } = useToast();
  const [accessToken, setAccessToken] = useState("");
  const [selectedRepository, setSelectedRepository] = useState("");
  const [testFramework, setTestFramework] = useState("Jest (React)");
  const [selectedTestCases, setSelectedTestCases] = useState<string[]>([]);
  const [customPrompt, setCustomPrompt] = useState("");
  const [prTitle, setPrTitle] = useState("");
  const [prDescription, setPrDescription] = useState("");
  const [showPrModal, setShowPrModal] = useState(false);
  const [showCustomTestModal, setShowCustomTestModal] = useState(false);
  const [batchMode, setBatchMode] = useState(false);
  const [viewMode, setViewMode] = useState<"setup" | "files" | "tests" | "code">("setup");

  const testFrameworks = [
    "Jest (React)",
    "Cypress", 
    "Selenium",
    "Playwright",
    "Pytest",
    "JUnit",
    "Mocha"
  ];

  // Sync repositories from GitHub
  const syncReposMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/repositories/sync", { accessToken });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/repositories"] });
      toast({
        title: "Success",
        description: "Repositories synced successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to sync repositories: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Fetch repositories
  const { data: repositories = [], isLoading: isLoadingRepos } = useQuery<any[]>({
    queryKey: ["/api/repositories"],
    enabled: !!accessToken,
  });

  // Fetch repository files
  const { data: repositoryFiles = [], isLoading: isLoadingFiles } = useQuery<any[]>({
    queryKey: ["/api/repositories", selectedRepository, "files"],
    enabled: !!selectedRepository,
  });

  // Sync repository files mutation
  const syncFilesMutation = useMutation({
    mutationFn: async (repositoryId: string) => {
      const response = await apiRequest("POST", `/api/repositories/${repositoryId}/files/sync`);
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ["/api/repositories", selectedRepository, "files"],
      });
      toast({
        title: "Success",
        description: data.message,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to sync files: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Fetch test case summaries
  const { data: testCaseSummaries = [], isLoading: isLoadingTestCases } = useQuery<any[]>({
    queryKey: ["/api/repositories", selectedRepository, "test-cases"],
    enabled: !!selectedRepository,
  });

  // Generate test cases mutation
  const generateTestCasesMutation = useMutation({
    mutationFn: async () => {
      const endpoint = batchMode 
        ? `/api/repositories/${selectedRepository}/test-cases/batch-generate`
        : `/api/repositories/${selectedRepository}/test-cases/generate`;
      
      const response = await apiRequest("POST", endpoint, { testFramework });
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ["/api/repositories", selectedRepository, "test-cases"],
      });
      const count = Array.isArray(data) ? data.length : data.testCases?.length || 0;
      toast({
        title: "Success",
        description: `Generated ${count} test case${count !== 1 ? 's' : ''} successfully`,
      });
      setViewMode("tests");
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to generate test cases: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Generate test code mutation
  const generateCodeMutation = useMutation({
    mutationFn: async (testCaseId: string) => {
      const response = await apiRequest("POST", `/api/test-cases/${testCaseId}/generate-code`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/repositories", selectedRepository, "test-cases"],
      });
      toast({
        title: "Success",
        description: "Test code generated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to generate test code: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Create PR mutation
  const createPrMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", `/api/repositories/${selectedRepository}/create-pr`, {
        testCaseIds: selectedTestCases,
        prTitle: prTitle || `Add ${testFramework} test cases`,
        prDescription: prDescription || "AI-generated comprehensive test cases"
      });
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Success",
        description: `Pull request created successfully!`,
      });
      setShowPrModal(false);
      setPrTitle("");
      setPrDescription("");
      setSelectedTestCases([]);
      // Open PR in new tab
      if (data.url) {
        window.open(data.url, '_blank');
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to create pull request: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // File selection mutations
  const toggleFileMutation = useMutation({
    mutationFn: async ({ fileId, isSelected }: { fileId: string; isSelected: boolean }) => {
      const response = await apiRequest("PUT", `/api/repositories/${selectedRepository}/files/${fileId}`, {
        isSelected: !isSelected
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/repositories", selectedRepository, "files"],
      });
    },
  });

  const selectAllFilesMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", `/api/repositories/${selectedRepository}/files/select-all`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/repositories", selectedRepository, "files"],
      });
      toast({
        title: "Success",
        description: "All files selected",
      });
    },
  });

  const clearSelectionMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", `/api/repositories/${selectedRepository}/files/clear-selection`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/repositories", selectedRepository, "files"],
      });
      toast({
        title: "Success",
        description: "File selection cleared",
      });
    },
  });

  const handleSyncRepositories = () => {
    if (!accessToken) {
      toast({
        title: "Error",
        description: "Please enter your GitHub access token",
        variant: "destructive",
      });
      return;
    }
    syncReposMutation.mutate();
  };

  const handleSyncFiles = () => {
    if (!selectedRepository) {
      toast({
        title: "Error",
        description: "Please select a repository first",
        variant: "destructive",
      });
      return;
    }
    syncFilesMutation.mutate(selectedRepository);
  };

  const handleRepositoryChange = (repoId: string) => {
    setSelectedRepository(repoId);
    // Auto-sync files when repository is selected
    if (repoId) {
      syncFilesMutation.mutate(repoId);
    }
  };

  const handleGenerateTests = () => {
    if (!selectedRepository) {
      toast({
        title: "Error",
        description: "Please select a repository first",
        variant: "destructive",
      });
      return;
    }
    
    const selectedFiles = repositoryFiles.filter((file: any) => file.isSelected);
    if (!batchMode && selectedFiles.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one file",
        variant: "destructive",
      });
      return;
    }
    
    generateTestCasesMutation.mutate();
  };

  const handleToggleTestCase = (testCaseId: string) => {
    setSelectedTestCases(prev => 
      prev.includes(testCaseId)
        ? prev.filter(id => id !== testCaseId)
        : [...prev, testCaseId]
    );
  };

  const selectedRepository_data = repositories.find((repo: any) => repo.id === selectedRepository);
  const selectedFiles_data = repositoryFiles.filter((file: any) => file.isSelected);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <TestTube className="w-4 h-4 text-white" />
              </div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100" data-testid="app-title">
                TestGen AI Pro
              </h1>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Label htmlFor="batch-mode" className="text-sm">Batch Mode</Label>
              <Switch 
                id="batch-mode"
                checked={batchMode}
                onCheckedChange={setBatchMode}
                data-testid="switch-batch-mode"
              />
            </div>
            <Select value={testFramework} onValueChange={setTestFramework}>
              <SelectTrigger className="w-40" data-testid="select-framework">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {testFrameworks.map(framework => (
                  <SelectItem key={framework} value={framework}>
                    {framework}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-6">
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center space-x-4">
            {[
              { key: "setup", label: "Setup", icon: Settings },
              { key: "files", label: "Files", icon: FileCode },
              { key: "tests", label: "Tests", icon: TestTube },
              { key: "code", label: "Code", icon: Code },
            ].map(({ key, label, icon: Icon }, index) => (
              <div key={key} className="flex items-center">
                <button
                  onClick={() => setViewMode(key as any)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                    viewMode === key
                      ? "bg-blue-600 text-white"
                      : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
                  }`}
                  data-testid={`step-${key}`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{label}</span>
                </button>
                {index < 3 && (
                  <div className="w-8 h-0.5 bg-gray-300 dark:bg-gray-600 mx-2" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step 1: Setup */}
        {viewMode === "setup" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <GitBranch className="w-5 h-5" />
                <span>GitHub Integration Setup</span>
              </CardTitle>
              <CardDescription>
                Connect your GitHub account to browse repositories and create pull requests
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="access-token">GitHub Personal Access Token</Label>
                  <Input
                    id="access-token"
                    type="password"
                    placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                    value={accessToken}
                    onChange={(e) => setAccessToken(e.target.value)}
                    data-testid="input-access-token"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Generate a token at: <a href="https://github.com/settings/tokens" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">GitHub Settings</a>
                  </p>
                </div>
                
                <Button 
                  onClick={handleSyncRepositories}
                  disabled={!accessToken || syncReposMutation.isPending}
                  className="w-full"
                  data-testid="button-sync-repos"
                >
                  {syncReposMutation.isPending ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Syncing...
                    </>
                  ) : (
                    <>
                      <GitBranch className="w-4 h-4 mr-2" />
                      Sync Repositories
                    </>
                  )}
                </Button>
              </div>

              {repositories.length > 0 && (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="repository">Select Repository</Label>
                    <Select value={selectedRepository} onValueChange={handleRepositoryChange}>
                      <SelectTrigger data-testid="select-repository">
                        <SelectValue placeholder="Choose a repository" />
                      </SelectTrigger>
                      <SelectContent>
                        {repositories.map((repo: any) => (
                          <SelectItem key={repo.id} value={repo.id}>
                            <div className="flex items-center space-x-2">
                              <span>{repo.fullName}</span>
                              {repo.language && (
                                <span className="text-xs bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">
                                  {repo.language}
                                </span>
                              )}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {selectedRepository && (
                    <Button 
                      onClick={() => setViewMode("files")}
                      className="w-full"
                      data-testid="button-next-files"
                    >
                      <FileCode className="w-4 h-4 mr-2" />
                      Continue to File Selection
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Step 2: Files */}
        {viewMode === "files" && selectedRepository && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center space-x-2">
                  <FileText className="w-5 h-5" />
                  <span>File Selection</span>
                </CardTitle>
                <div className="flex items-center space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={handleSyncFiles}
                    disabled={syncFilesMutation.isPending}
                    data-testid="button-sync-files"
                  >
                    {syncFilesMutation.isPending ? (
                      <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
                    ) : (
                      <RefreshCw className="w-3 h-3 mr-1" />
                    )}
                    Sync Files
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => selectAllFilesMutation.mutate()}
                    disabled={selectAllFilesMutation.isPending}
                    data-testid="button-select-all"
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    Select All
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => clearSelectionMutation.mutate()}
                    disabled={clearSelectionMutation.isPending}
                    data-testid="button-clear-selection"
                  >
                    <Minus className="w-3 h-3 mr-1" />
                    Clear
                  </Button>
                </div>
              </div>
              <CardDescription>
                {batchMode 
                  ? "In batch mode, all code files will be automatically selected"
                  : `Select files for test generation (${selectedFiles_data.length} selected)`
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingFiles ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="w-6 h-6 animate-spin" />
                </div>
              ) : repositoryFiles.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No files found. Click "Sync Files" to fetch repository contents.</p>
                </div>
              ) : (
                <>
                  <ScrollArea className="h-64 mb-4">
                    <div className="space-y-2">
                      {repositoryFiles.map((file: any) => (
                        <div 
                          key={file.id}
                          className={`p-3 rounded-lg border transition-colors ${
                            file.isSelected 
                              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                              : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                          }`}
                        >
                          <div className="flex items-center space-x-3">
                            <input
                              type="checkbox"
                              checked={file.isSelected}
                              onChange={() => toggleFileMutation.mutate({ fileId: file.id, isSelected: file.isSelected })}
                              disabled={batchMode}
                              data-testid={`checkbox-file-${file.id}`}
                            />
                            <div className="flex-1">
                              <div className="font-medium text-sm">{file.name}</div>
                              <div className="text-xs text-gray-500">{file.path}</div>
                            </div>
                            <div className="flex items-center space-x-2">
                              {file.language && (
                                <span className="text-xs bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">
                                  {file.language}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                  
                  <Button
                    onClick={handleGenerateTests}
                    disabled={generateTestCasesMutation.isPending || (!batchMode && selectedFiles_data.length === 0)}
                    className="w-full"
                    data-testid="button-generate-tests"
                  >
                    {generateTestCasesMutation.isPending ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 mr-2" />
                        {batchMode ? "Generate Batch Tests" : `Generate Tests (${selectedFiles_data.length} files)`}
                      </>
                    )}
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        )}

        {/* Step 3: Tests */}
        {viewMode === "tests" && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center space-x-2">
                    <TestTube className="w-5 h-5" />
                    <span>Generated Test Cases ({testCaseSummaries.length})</span>
                  </CardTitle>
                  {selectedTestCases.length > 0 && (
                    <Dialog open={showPrModal} onOpenChange={setShowPrModal}>
                      <DialogTrigger asChild>
                        <Button data-testid="button-create-pr">
                          <GitPullRequest className="w-4 h-4 mr-2" />
                          Create PR ({selectedTestCases.length})
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Create Pull Request</DialogTitle>
                          <DialogDescription>
                            Create a pull request with {selectedTestCases.length} selected test cases
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="pr-title">Pull Request Title</Label>
                            <Input
                              id="pr-title"
                              placeholder={`Add ${testFramework} test cases`}
                              value={prTitle}
                              onChange={(e) => setPrTitle(e.target.value)}
                              data-testid="input-pr-title"
                            />
                          </div>
                          <div>
                            <Label htmlFor="pr-description">Description</Label>
                            <Textarea
                              id="pr-description"
                              placeholder="AI-generated comprehensive test cases with full coverage"
                              value={prDescription}
                              onChange={(e) => setPrDescription(e.target.value)}
                              rows={3}
                              data-testid="textarea-pr-description"
                            />
                          </div>
                          <div className="flex justify-end space-x-2">
                            <Button variant="outline" onClick={() => setShowPrModal(false)}>
                              Cancel
                            </Button>
                            <Button 
                              onClick={() => createPrMutation.mutate()}
                              disabled={createPrMutation.isPending}
                              data-testid="button-confirm-pr"
                            >
                              {createPrMutation.isPending ? "Creating..." : "Create PR"}
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {isLoadingTestCases ? (
                  <div className="flex items-center justify-center py-8">
                    <RefreshCw className="w-6 h-6 animate-spin" />
                  </div>
                ) : testCaseSummaries.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No test cases generated yet. Go back to generate tests from your selected files.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {testCaseSummaries.map((testCase: any) => (
                      <div 
                        key={testCase.id}
                        className={`p-4 rounded-lg border transition-colors ${
                          selectedTestCases.includes(testCase.id)
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                            : 'border-gray-200 dark:border-gray-700'
                        }`}
                      >
                        <div className="flex items-start space-x-3">
                          <input
                            type="checkbox"
                            checked={selectedTestCases.includes(testCase.id)}
                            onChange={() => handleToggleTestCase(testCase.id)}
                            className="mt-1"
                            data-testid={`checkbox-test-${testCase.id}`}
                          />
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <h3 className="font-medium">{testCase.title}</h3>
                              <span className={`px-2 py-1 rounded text-xs ${
                                testCase.priority === 'high' ? 'bg-red-100 text-red-800' :
                                testCase.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' : 
                                'bg-green-100 text-green-800'
                              }`}>
                                {testCase.priority}
                              </span>
                              <span className="px-2 py-1 rounded text-xs bg-gray-100 text-gray-800">
                                {testCase.category}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                              {testCase.description}
                            </p>
                            <div className="flex items-center space-x-4 text-xs text-gray-500">
                              <div className="flex items-center space-x-1">
                                <Target className="w-3 h-3" />
                                <span>{testCase.testCaseCount} tests</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <Clock className="w-3 h-3" />
                                <span>{testCase.estimatedTime}</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <Layers className="w-3 h-3" />
                                <span>{testCase.files?.length || 0} files</span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            {testCase.generatedCode ? (
                              <div className="flex items-center space-x-1 px-2 py-1 rounded bg-green-100 text-green-800 text-xs">
                                <CheckCircle className="w-3 h-3" />
                                <span>Generated</span>
                              </div>
                            ) : (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => generateCodeMutation.mutate(testCase.id)}
                                disabled={generateCodeMutation.isPending}
                                data-testid={`button-generate-code-${testCase.id}`}
                              >
                                <Code className="w-3 h-3 mr-1" />
                                Generate Code
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {testCaseSummaries.length > 0 && (
              <div className="flex justify-center">
                <Button 
                  onClick={() => setViewMode("code")}
                  variant="outline"
                  data-testid="button-view-code"
                >
                  <Code className="w-4 h-4 mr-2" />
                  View Generated Code
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Step 4: Code */}
        {viewMode === "code" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Code className="w-5 h-5" />
                <span>Generated Test Code</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {testCaseSummaries.filter((tc: any) => tc.generatedCode).length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No generated code yet. Generate test code from the Tests step.
                  </div>
                ) : (
                  <div className="space-y-6">
                    {testCaseSummaries
                      .filter((tc: any) => tc.generatedCode)
                      .map((testCase: any) => (
                      <Card key={testCase.id} className="border">
                        <CardHeader className="pb-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <h3 className="font-medium">{testCase.title}</h3>
                              <span className="text-xs bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">
                                {testCase.testFramework}
                              </span>
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                navigator.clipboard.writeText(testCase.generatedCode);
                                toast({
                                  title: "Copied",
                                  description: "Test code copied to clipboard",
                                });
                              }}
                              data-testid={`button-copy-code-${testCase.id}`}
                            >
                              <Download className="w-3 h-3 mr-1" />
                              Copy
                            </Button>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
                            <pre className="text-green-400 text-sm whitespace-pre-wrap">
                              <code>{testCase.generatedCode}</code>
                            </pre>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}