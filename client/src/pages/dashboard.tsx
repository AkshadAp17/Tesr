import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { FileBrowser, TestCaseGrid, CodeViewer, PrModal } from "@/components";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { GitHubClient } from "@/lib/github";
import type { Repository, TestCaseSummary } from "@shared/schema";

export default function Dashboard() {
  const { toast } = useToast();
  const [selectedRepository, setSelectedRepository] = useState<string>("");
  const [testFramework, setTestFramework] = useState("Jest (React)");
  const [selectedTestCase, setSelectedTestCase] = useState<TestCaseSummary | null>(null);
  const [generatedCode, setGeneratedCode] = useState<string>("");
  const [showPrModal, setShowPrModal] = useState(false);
  const [accessToken, setAccessToken] = useState(
    import.meta.env.VITE_GITHUB_ACCESS_TOKEN || ""
  );

  // Fetch GitHub repositories
  const { data: githubRepos = [], isLoading: isLoadingRepos } = useQuery<any[]>({
    queryKey: ["/api/github/repositories"],
    enabled: !!accessToken,
    retry: false,
  });

  // Fetch test case summaries for selected repository
  const { data: testCaseSummaries = [], isLoading: isLoadingTestCases } = useQuery<TestCaseSummary[]>({
    queryKey: ["/api/repositories", selectedRepository, "test-cases"],
    enabled: !!selectedRepository,
  });

  // Generate test summaries mutation
  const generateSummariesMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest(
        "POST",
        `/api/repositories/${selectedRepository}/generate-test-summaries`,
        { testFramework }
      );
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/repositories", selectedRepository, "test-cases"],
      });
      toast({
        title: "Success",
        description: "Test case summaries generated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Generate test code mutation
  const generateCodeMutation = useMutation({
    mutationFn: async (testCaseId: string) => {
      const response = await apiRequest(
        "POST",
        `/api/test-cases/${testCaseId}/generate-code`
      );
      return response.json();
    },
    onSuccess: (data) => {
      setGeneratedCode(data.content);
      toast({
        title: "Success",
        description: "Test code generated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleRepositoryChange = (repoFullName: string) => {
    setSelectedRepository(repoFullName);
    setSelectedTestCase(null);
    setGeneratedCode("");
  };

  const handleGenerateTestCases = () => {
    if (!selectedRepository) {
      toast({
        title: "Error",
        description: "Please select a repository first",
        variant: "destructive",
      });
      return;
    }
    generateSummariesMutation.mutate();
  };

  const handleGenerateCode = (testCase: TestCaseSummary) => {
    setSelectedTestCase(testCase);
    generateCodeMutation.mutate(testCase.id);
  };

  const currentRepo = githubRepos?.find((repo: any) => repo.full_name === selectedRepository);

  return (
    <div className="min-h-screen bg-dark-bg text-slate-100">
      {/* Header */}
      <header className="bg-dark-surface border-b border-dark-border px-6 py-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gh-blue rounded-lg flex items-center justify-center">
                <i className="fas fa-vial text-white text-sm"></i>
              </div>
              <h1 className="text-xl font-bold text-slate-100" data-testid="app-title">
                TestGen AI
              </h1>
            </div>
            <div className="hidden md:flex items-center space-x-6 ml-8">
              <button className="text-slate-300 hover:text-slate-100 transition-colors" data-testid="nav-dashboard">
                <i className="fas fa-home mr-2"></i>Dashboard
              </button>
              <button className="text-slate-300 hover:text-slate-100 transition-colors" data-testid="nav-history">
                <i className="fas fa-history mr-2"></i>History
              </button>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            {/* Repository Selector */}
            <Select value={selectedRepository} onValueChange={handleRepositoryChange}>
              <SelectTrigger className="bg-dark-surface border-dark-border text-slate-100 w-64" data-testid="repository-selector">
                <SelectValue placeholder="Select repository..." />
              </SelectTrigger>
              <SelectContent className="bg-dark-surface border-dark-border">
                {githubRepos?.map((repo: any) => (
                  <SelectItem key={repo.id} value={repo.full_name} data-testid={`repo-option-${repo.id}`}>
                    {repo.full_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {/* GitHub Access Token Input */}
            {!accessToken && (
              <div className="flex items-center space-x-2">
                <input
                  type="password"
                  placeholder="GitHub Access Token"
                  value={accessToken}
                  onChange={(e) => setAccessToken(e.target.value)}
                  className="bg-dark-surface border border-dark-border rounded-lg px-4 py-2 text-slate-100 focus:ring-2 focus:ring-gh-blue focus:border-transparent"
                  data-testid="github-token-input"
                />
              </div>
            )}
            
            {/* User Profile */}
            <div className="flex items-center space-x-3">
              <img 
                src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=150&h=150" 
                alt="User profile" 
                className="w-8 h-8 rounded-full object-cover"
                data-testid="user-avatar"
              />
              <span className="text-slate-100 font-medium" data-testid="user-name">Developer</span>
            </div>
          </div>
        </div>
      </header>

      <div className="flex h-screen pt-0">
        {/* Sidebar - File Browser */}
        <div className="w-80 bg-dark-surface border-r border-dark-border flex flex-col">
          {/* File Browser Header */}
          <div className="p-4 border-b border-dark-border">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-slate-100" data-testid="file-browser-title">
                Repository Files
              </h2>
              <button 
                className="text-gh-blue hover:text-blue-400 text-sm"
                data-testid="refresh-files-button"
              >
                <i className="fas fa-sync-alt mr-1"></i>Refresh
              </button>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                onClick={handleGenerateTestCases}
                disabled={!selectedRepository || generateSummariesMutation.isPending}
                className="flex-1 bg-gh-blue text-white hover:bg-blue-600"
                data-testid="generate-tests-button"
              >
                <i className="fas fa-check-square mr-2"></i>
                {generateSummariesMutation.isPending ? "Generating..." : "Generate Tests"}
              </Button>
            </div>
          </div>

          {/* File Browser */}
          {selectedRepository && currentRepo && (
            <FileBrowser
              repositoryId={selectedRepository}
              owner={currentRepo.owner.login}
              repo={currentRepo.name}
              accessToken={accessToken}
            />
          )}

          {/* Test Framework Selector */}
          <div className="p-4 border-t border-dark-border">
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Test Framework
            </label>
            <Select value={testFramework} onValueChange={setTestFramework}>
              <SelectTrigger className="bg-dark-bg border-dark-border text-slate-100" data-testid="framework-selector">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-dark-surface border-dark-border">
                <SelectItem value="Jest (React)" data-testid="framework-jest">Jest (React)</SelectItem>
                <SelectItem value="Pytest (Python)" data-testid="framework-pytest">Pytest (Python)</SelectItem>
                <SelectItem value="JUnit (Java)" data-testid="framework-junit">JUnit (Java)</SelectItem>
                <SelectItem value="Mocha (Node.js)" data-testid="framework-mocha">Mocha (Node.js)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col">
          {/* Content Header */}
          <div className="bg-dark-surface border-b border-dark-border px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-slate-100" data-testid="content-title">
                  Test Case Generation
                </h2>
                <p className="text-slate-400 text-sm mt-1" data-testid="content-description">
                  AI-powered test case suggestions for your selected files
                </p>
              </div>
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2 text-sm text-slate-400">
                  <span>Framework:</span>
                  <span className="text-slate-100" data-testid="selected-framework">
                    {testFramework}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 p-6 overflow-y-auto">
            {/* Loading State */}
            {generateSummariesMutation.isPending && (
              <div className="bg-dark-surface rounded-xl border border-dark-border p-8 text-center" data-testid="loading-state">
                <div className="animate-spin w-8 h-8 border-2 border-gh-blue border-t-transparent rounded-full mx-auto mb-4"></div>
                <h3 className="text-lg font-semibold text-slate-100 mb-2">Generating Test Cases...</h3>
                <p className="text-slate-400">AI is analyzing your selected files and creating comprehensive test cases.</p>
              </div>
            )}

            {/* Test Case Summaries Grid */}
            {testCaseSummaries && testCaseSummaries.length > 0 && (
              <TestCaseGrid
                testCases={testCaseSummaries}
                onGenerateCode={handleGenerateCode}
                isGeneratingCode={generateCodeMutation.isPending}
              />
            )}

            {/* Generated Test Code Section */}
            {generatedCode && selectedTestCase && (
              <div className="mt-8">
                <CodeViewer
                  code={generatedCode}
                  testCase={selectedTestCase}
                  onCreatePR={() => setShowPrModal(true)}
                />
              </div>
            )}

            {/* Empty State */}
            {!generateSummariesMutation.isPending && 
             (!testCaseSummaries || testCaseSummaries.length === 0) && 
             !generatedCode && (
              <div className="bg-dark-surface rounded-xl border border-dark-border p-12 text-center" data-testid="empty-state">
                <div className="w-16 h-16 bg-slate-700 rounded-xl flex items-center justify-center mx-auto mb-6">
                  <i className="fas fa-flask text-2xl text-slate-400"></i>
                </div>
                <h3 className="text-xl font-semibold text-slate-100 mb-3">Ready to Generate Test Cases</h3>
                <p className="text-slate-400 mb-6">
                  Select files from the sidebar and click "Generate Test Cases" to get started with AI-powered test case suggestions.
                </p>
                <Button 
                  onClick={handleGenerateTestCases}
                  disabled={!selectedRepository}
                  className="bg-gh-blue hover:bg-blue-600 text-white"
                  data-testid="get-started-button"
                >
                  <i className="fas fa-play mr-2"></i>
                  Get Started
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* PR Creation Modal */}
      {showPrModal && currentRepo && selectedTestCase && (
        <PrModal
          repository={currentRepo}
          testCase={selectedTestCase}
          generatedCode={generatedCode}
          accessToken={accessToken}
          onClose={() => setShowPrModal(false)}
        />
      )}
    </div>
  );
}
