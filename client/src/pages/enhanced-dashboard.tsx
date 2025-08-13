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
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
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
  Sparkles
} from "lucide-react";

export default function EnhancedDashboard() {
  const { toast } = useToast();
  const [accessToken, setAccessToken] = useState("");
  const [selectedRepository, setSelectedRepository] = useState("");
  const [testFramework, setTestFramework] = useState("Jest (React)");
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [selectedTestCases, setSelectedTestCases] = useState<string[]>([]);
  const [customPrompt, setCustomPrompt] = useState("");
  const [prTitle, setPrTitle] = useState("");
  const [prDescription, setPrDescription] = useState("");
  const [showPrModal, setShowPrModal] = useState(false);
  const [showCustomTestModal, setShowCustomTestModal] = useState(false);
  const [batchMode, setBatchMode] = useState(false);
  const [viewMode, setViewMode] = useState<"files" | "tests" | "code">("files");

  const testFrameworks = [
    "Jest (React)",
    "Cypress", 
    "Selenium",
    "Playwright",
    "Pytest",
    "JUnit",
    "Mocha"
  ];

  // Fetch repositories
  const { data: repositories = [], isLoading: isLoadingRepos } = useQuery<any[]>({
    queryKey: ["/api/repositories"],
    enabled: !!accessToken,
  });

  // Sync repositories mutation
  const syncReposMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/repositories", { accessToken });
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

  // Fetch repository files
  const { data: repositoryFiles = [], isLoading: isLoadingFiles } = useQuery<any[]>({
    queryKey: ["/api/repositories", selectedRepository, "files"],
    enabled: !!selectedRepository,
  });

  // Fetch test case summaries
  const { data: testCaseSummaries = [], isLoading: isLoadingTestCases } = useQuery<any[]>({
    queryKey: ["/api/repositories", selectedRepository, "test-cases"],
    enabled: !!selectedRepository,
  });

  // Fetch test templates
  const { data: testTemplates = [] } = useQuery({
    queryKey: ["/api/test-templates"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/test-templates");
      return response.json();
    },
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
        description: `Pull request created successfully: ${data.url}`,
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

  // Generate custom test mutation
  const generateCustomTestMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", `/api/repositories/${selectedRepository}/custom-test`, {
        customPrompt,
        testFramework,
        fileIds: selectedFiles
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Custom test generated successfully",
      });
      setShowCustomTestModal(false);
      setCustomPrompt("");
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to generate custom test: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // File selection mutations
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

  const handleGenerateTests = () => {
    if (!selectedRepository) {
      toast({
        title: "Error",
        description: "Please select a repository first",
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
            <Badge variant="secondary" className="text-xs">Enhanced</Badge>
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
        {/* GitHub Token Input */}
        {!accessToken && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <GitBranch className="w-5 h-5" />
                <span>GitHub Integration</span>
              </CardTitle>
              <CardDescription>
                Enter your GitHub personal access token to browse repositories and create pull requests
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex space-x-4">
                <Input
                  type="password"
                  placeholder="GitHub Personal Access Token"
                  value={accessToken}
                  onChange={(e) => setAccessToken(e.target.value)}
                  className="flex-1"
                  data-testid="input-access-token"
                />
                <Button 
                  onClick={handleSyncRepositories}
                  disabled={syncReposMutation.isPending}
                  data-testid="button-sync-repos"
                >
                  {syncReposMutation.isPending ? "Syncing..." : "Connect"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Repository Selection */}
        {accessToken && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <FileCode className="w-5 h-5" />
                  <span>Repository Selection</span>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleSyncRepositories}
                  disabled={syncReposMutation.isPending}
                  data-testid="button-refresh-repos"
                >
                  {syncReposMutation.isPending ? "Syncing..." : "Refresh"}
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={selectedRepository} onValueChange={setSelectedRepository}>
                <SelectTrigger data-testid="select-repository">
                  <SelectValue placeholder="Select a repository" />
                </SelectTrigger>
                <SelectContent>
                  {repositories.map((repo: any) => (
                    <SelectItem key={repo.id} value={repo.id}>
                      <div className="flex items-center space-x-2">
                        <span>{repo.fullName}</span>
                        {repo.language && (
                          <Badge variant="outline" className="text-xs">
                            {repo.language}
                          </Badge>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {selectedRepository_data && (
                <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium">{selectedRepository_data.name}</h3>
                    <div className="flex items-center space-x-2">
                      {selectedRepository_data.isPrivate && (
                        <Badge variant="secondary">Private</Badge>
                      )}
                      {selectedRepository_data.language && (
                        <Badge variant="outline">{selectedRepository_data.language}</Badge>
                      )}
                    </div>
                  </div>
                  {selectedRepository_data.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {selectedRepository_data.description}
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Main Content Tabs */}
        {selectedRepository && (
          <Tabs value={viewMode} onValueChange={(value: any) => setViewMode(value)}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="files" className="flex items-center space-x-2">
                <FileText className="w-4 h-4" />
                <span>Files ({selectedFiles_data.length})</span>
              </TabsTrigger>
              <TabsTrigger value="tests" className="flex items-center space-x-2">
                <TestTube className="w-4 h-4" />
                <span>Tests ({testCaseSummaries.length})</span>
              </TabsTrigger>
              <TabsTrigger value="code" className="flex items-center space-x-2">
                <Code className="w-4 h-4" />
                <span>Generated Code</span>
              </TabsTrigger>
            </TabsList>

            {/* Files Tab */}
            <TabsContent value="files" className="mt-6">
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
                        onClick={() => selectAllFilesMutation.mutate()}
                        disabled={selectAllFilesMutation.isPending}
                        data-testid="button-select-all"
                      >
                        Select All
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => clearSelectionMutation.mutate()}
                        disabled={clearSelectionMutation.isPending}
                        data-testid="button-clear-selection"
                      >
                        Clear Selection
                      </Button>
                    </div>
                  </div>
                  <CardDescription>
                    Select files to include in test case generation
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoadingFiles ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                  ) : (
                    <ScrollArea className="h-64">
                      <div className="space-y-2">
                        {repositoryFiles.map((file: any) => (
                          <div 
                            key={file.id}
                            className={`p-3 rounded-lg border ${
                              file.isSelected 
                                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                                : 'border-gray-200 dark:border-gray-700'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                <input
                                  type="checkbox"
                                  checked={file.isSelected}
                                  onChange={() => {
                                    // Toggle file selection
                                    apiRequest("PUT", `/api/repositories/${selectedRepository}/files/${file.id}`, {
                                      isSelected: !file.isSelected
                                    }).then(() => {
                                      queryClient.invalidateQueries({
                                        queryKey: ["/api/repositories", selectedRepository, "files"],
                                      });
                                    });
                                  }}
                                  data-testid={`checkbox-file-${file.id}`}
                                />
                                <div>
                                  <div className="font-medium text-sm">{file.name}</div>
                                  <div className="text-xs text-gray-500">{file.path}</div>
                                </div>
                              </div>
                              <div className="flex items-center space-x-2">
                                {file.language && (
                                  <Badge variant="outline" className="text-xs">
                                    {file.language}
                                  </Badge>
                                )}
                                {file.size && (
                                  <span className="text-xs text-gray-500">{file.size} bytes</span>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tests Tab */}
            <TabsContent value="tests" className="mt-6">
              <div className="space-y-6">
                {/* Test Generation Controls */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Sparkles className="w-5 h-5" />
                      <span>Test Generation</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <Button
                          onClick={handleGenerateTests}
                          disabled={generateTestCasesMutation.isPending || selectedFiles_data.length === 0}
                          className="flex items-center space-x-2"
                          data-testid="button-generate-tests"
                        >
                          <Play className="w-4 h-4" />
                          <span>
                            {generateTestCasesMutation.isPending 
                              ? "Generating..." 
                              : batchMode 
                                ? "Generate Batch Tests" 
                                : "Generate Test Cases"}
                          </span>
                        </Button>
                        
                        <Dialog open={showCustomTestModal} onOpenChange={setShowCustomTestModal}>
                          <DialogTrigger asChild>
                            <Button variant="outline" data-testid="button-custom-test">
                              <Settings className="w-4 h-4 mr-2" />
                              Custom Test
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>Generate Custom Test</DialogTitle>
                              <DialogDescription>
                                Describe the specific test requirements you want to generate
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div>
                                <Label htmlFor="custom-prompt">Custom Test Description</Label>
                                <Textarea
                                  id="custom-prompt"
                                  placeholder="e.g., Generate integration tests for the payment processing workflow with error handling..."
                                  value={customPrompt}
                                  onChange={(e) => setCustomPrompt(e.target.value)}
                                  rows={4}
                                  data-testid="textarea-custom-prompt"
                                />
                              </div>
                              <div className="flex justify-end space-x-2">
                                <Button variant="outline" onClick={() => setShowCustomTestModal(false)}>
                                  Cancel
                                </Button>
                                <Button 
                                  onClick={() => generateCustomTestMutation.mutate()}
                                  disabled={!customPrompt.trim() || generateCustomTestMutation.isPending}
                                  data-testid="button-generate-custom"
                                >
                                  {generateCustomTestMutation.isPending ? "Generating..." : "Generate"}
                                </Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>

                      {selectedTestCases.length > 0 && (
                        <div className="flex items-center space-x-2">
                          <Badge>{selectedTestCases.length} selected</Badge>
                          <Dialog open={showPrModal} onOpenChange={setShowPrModal}>
                            <DialogTrigger asChild>
                              <Button data-testid="button-create-pr">
                                <GitPullRequest className="w-4 h-4 mr-2" />
                                Create PR
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Create Pull Request</DialogTitle>
                                <DialogDescription>
                                  Create a pull request with the selected test cases
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
                                    placeholder="AI-generated comprehensive test cases"
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
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Test Case List */}
                <Card>
                  <CardHeader>
                    <CardTitle>Test Case Summaries</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {isLoadingTestCases ? (
                      <div className="flex items-center justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                      </div>
                    ) : testCaseSummaries.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        No test cases generated yet. Select files and generate test cases to get started.
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {testCaseSummaries.map((testCase: any) => (
                          <div 
                            key={testCase.id}
                            className={`p-4 rounded-lg border ${
                              selectedTestCases.includes(testCase.id)
                                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                : 'border-gray-200 dark:border-gray-700'
                            }`}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex items-start space-x-3 flex-1">
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
                                    <Badge 
                                      variant={
                                        testCase.priority === 'high' ? 'destructive' :
                                        testCase.priority === 'medium' ? 'default' : 'secondary'
                                      }
                                    >
                                      {testCase.priority}
                                    </Badge>
                                    <Badge variant="outline">{testCase.category}</Badge>
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
                                      <span>{testCase.files.length} files</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                              
                              <div className="flex items-center space-x-2">
                                {testCase.generatedCode ? (
                                  <Badge variant="default" className="bg-green-600">
                                    <CheckCircle className="w-3 h-3 mr-1" />
                                    Code Generated
                                  </Badge>
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
              </div>
            </TabsContent>

            {/* Generated Code Tab */}
            <TabsContent value="code" className="mt-6">
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
                        No generated code yet. Generate test code from the Tests tab.
                      </div>
                    ) : (
                      <Accordion type="single" collapsible>
                        {testCaseSummaries
                          .filter((tc: any) => tc.generatedCode)
                          .map((testCase: any) => (
                          <AccordionItem key={testCase.id} value={testCase.id}>
                            <AccordionTrigger className="text-left">
                              <div className="flex items-center space-x-2">
                                <span>{testCase.title}</span>
                                <Badge variant="outline">{testCase.testFramework}</Badge>
                              </div>
                            </AccordionTrigger>
                            <AccordionContent>
                              <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
                                <pre className="text-green-400 text-sm">
                                  <code>{testCase.generatedCode}</code>
                                </pre>
                              </div>
                              <div className="mt-2 flex justify-end">
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
                                  Copy Code
                                </Button>
                              </div>
                            </AccordionContent>
                          </AccordionItem>
                        ))}
                      </Accordion>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
}