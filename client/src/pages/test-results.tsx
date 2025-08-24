import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link, useRoute } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { 
  ArrowLeft, 
  Copy, 
  FileText, 
  GitPullRequest,
  CheckCircle,
  Clock,
  Target,
  Code,
  FileCode,
  Terminal,
  TestTube
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface TestFrameworkInstructions {
  setup: string[];
  fileLocation: string;
  runCommand: string;
}

export default function TestResults() {
  const { toast } = useToast();
  const [, params] = useRoute("/repositories/:id/results");
  const repositoryId = params?.id ? decodeURIComponent(params.id) : "";
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [showPrModal, setShowPrModal] = useState(false);
  const [prTitle, setPrTitle] = useState("");
  const [prDescription, setPrDescription] = useState("");
  const [selectedTestCases, setSelectedTestCases] = useState<string[]>([]);
  const [accessToken, setAccessToken] = useState(() => {
    return localStorage.getItem('accessToken') || "";
  });

  // Fetch test case summaries
  const { data: testCases = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/repositories", repositoryId && encodeURIComponent(repositoryId), "test-cases"],
    enabled: !!repositoryId,
  });

  // Create PR mutation
  const createPrMutation = useMutation({
    mutationFn: async () => {
      const encodedRepo = encodeURIComponent(repositoryId);
      const testCaseIds = testCases.map((tc: any) => tc.id);
      const response = await apiRequest("POST", `/api/repositories/${encodedRepo}/create-pr`, {
        testCaseIds,
        prTitle: prTitle || `Add test cases for ${repositoryId}`,
        prDescription: prDescription || "AI-generated comprehensive test cases",
        accessToken: accessToken
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

  const handleCopyCode = async (code: string, testId: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(testId);
      setTimeout(() => setCopiedCode(null), 2000);
    } catch (err) {
      console.error('Failed to copy code:', err);
    }
  };

  const getFrameworkInstructions = (framework: string): TestFrameworkInstructions => {
    const instructions: Record<string, TestFrameworkInstructions> = {
      "Jest (React)": {
        setup: [
          "npm install --save-dev @testing-library/react @testing-library/jest-dom jest-environment-jsdom",
          "Create jest.config.js in your project root",
          "Add test script to package.json: \"test\": \"jest\""
        ],
        fileLocation: "Create test files in __tests__ folder or alongside component files with .test.js extension",
        runCommand: "npm test"
      },
      "Cypress": {
        setup: [
          "npm install --save-dev cypress",
          "npx cypress open",
          "Configure cypress.config.js"
        ],
        fileLocation: "Place test files in cypress/e2e/ directory with .cy.js extension",
        runCommand: "npx cypress run"
      },
      "Playwright": {
        setup: [
          "npm init playwright@latest",
          "Configure playwright.config.js",
          "npx playwright install"
        ],
        fileLocation: "Place test files in tests/ directory with .spec.js extension",
        runCommand: "npx playwright test"
      },
      "Pytest": {
        setup: [
          "pip install pytest",
          "pip install pytest-mock requests-mock",
          "Create pytest.ini configuration file"
        ],
        fileLocation: "Place test files in tests/ directory with test_ prefix or _test suffix",
        runCommand: "pytest"
      }
    };

    return instructions[framework] || instructions["Jest (React)"];
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Loading test results...</p>
          </div>
        </div>
      </div>
    );
  }

  const testsWithCode = testCases.filter(test => test.generatedCode);
  const frameworks = Array.from(new Set(testCases.map(test => test.testFramework)));

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => window.history.back()}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Generator
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Test Results</h1>
          <p className="text-muted-foreground">
            Generated {testCases.length} test cases for {repositoryId}
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <TestTube className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{testCases.length}</p>
                <p className="text-sm text-muted-foreground">Total Tests</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Code className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{testsWithCode.length}</p>
                <p className="text-sm text-muted-foreground">Code Generated</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Target className="h-8 w-8 text-orange-500" />
              <div>
                <p className="text-2xl font-bold">
                  {testCases.filter(t => t.priority === 'high').length}
                </p>
                <p className="text-sm text-muted-foreground">High Priority</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Clock className="h-8 w-8 text-purple-500" />
              <div>
                <p className="text-2xl font-bold">
                  {Math.ceil(testCases.reduce((sum: number, test: any) => {
                    const timeStr = test.estimatedTime || "1 minute";
                    const minutes = parseInt(timeStr.match(/\d+/)?.[0] || "1");
                    return sum + minutes;
                  }, 0) / 60)}h
                </p>
                <p className="text-sm text-muted-foreground">Est. Time</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Test Cases List */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Generated Test Cases
              </CardTitle>
              <CardDescription>
                Review and copy the generated test code for your project
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[600px]">
                <div className="space-y-4">
                  {testCases.map((testCase: any) => (
                    <Card key={testCase.id} className="border-l-4 border-l-blue-500">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <CardTitle className="text-lg">{testCase.title}</CardTitle>
                            <div className="flex items-center gap-2">
                              <Badge variant={testCase.priority === 'high' ? 'destructive' : 'secondary'}>
                                {testCase.priority}
                              </Badge>
                              <Badge variant="outline">{testCase.testFramework}</Badge>
                              <span className="text-sm text-muted-foreground">
                                {testCase.testCaseCount} tests • {testCase.estimatedTime}
                              </span>
                            </div>
                          </div>
                          {testCase.generatedCode && (
                            <CheckCircle className="h-5 w-5 text-green-500" />
                          )}
                        </div>
                        <CardDescription className="mt-2">
                          {testCase.description}
                        </CardDescription>
                      </CardHeader>
                      
                      {testCase.generatedCode && (
                        <CardContent className="pt-0">
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <h4 className="font-medium">Generated Test Code</h4>
                              <Button
                                onClick={() => handleCopyCode(testCase.generatedCode, testCase.id)}
                                size="sm"
                                variant="outline"
                                data-testid={`button-copy-${testCase.id}`}
                              >
                                {copiedCode === testCase.id ? (
                                  <CheckCircle className="h-4 w-4 mr-2" />
                                ) : (
                                  <Copy className="h-4 w-4 mr-2" />
                                )}
                                {copiedCode === testCase.id ? 'Copied!' : 'Copy Code'}
                              </Button>
                            </div>
                            <div className="relative">
                              <pre className="bg-slate-900 text-slate-100 p-4 rounded-lg overflow-x-auto text-sm">
                                <code>{testCase.generatedCode}</code>
                              </pre>
                            </div>
                            <div className="text-sm text-muted-foreground">
                              <p><strong>Files tested:</strong> {testCase.files.join(', ')}</p>
                            </div>
                          </div>
                        </CardContent>
                      )}
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Implementation Guide */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Terminal className="h-5 w-5" />
                How to Apply Tests
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm">1</span>
                    Set up Testing Framework
                  </h4>
                  {frameworks.map((framework: string) => {
                    const instructions = getFrameworkInstructions(framework);
                    return (
                      <div key={framework} className="ml-8 space-y-2">
                        <Badge variant="outline">{framework}</Badge>
                        <div className="text-sm space-y-1">
                          {instructions.setup.map((step: string, i: number) => (
                            <div key={i} className="bg-slate-100 dark:bg-slate-800 p-2 rounded font-mono text-xs">
                              {step}
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <Separator />

                <div>
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm">2</span>
                    Create Test Files
                  </h4>
                  <div className="ml-8 space-y-2">
                    {frameworks.map((framework: string) => {
                      const instructions = getFrameworkInstructions(framework);
                      return (
                        <div key={framework} className="text-sm">
                          <Badge variant="outline" className="mb-1">{framework}</Badge>
                          <p className="text-muted-foreground">{instructions.fileLocation}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <Separator />

                <div>
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm">3</span>
                    Copy & Paste Code
                  </h4>
                  <p className="ml-8 text-sm text-muted-foreground">
                    Use the copy buttons above to copy each test case and paste into your test files.
                  </p>
                </div>

                <Separator />

                <div>
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm">4</span>
                    Run Tests
                  </h4>
                  <div className="ml-8 space-y-2">
                    {frameworks.map((framework: string) => {
                      const instructions = getFrameworkInstructions(framework);
                      return (
                        <div key={framework} className="space-y-1">
                          <Badge variant="outline">{framework}</Badge>
                          <div className="bg-slate-100 dark:bg-slate-800 p-2 rounded font-mono text-xs">
                            {instructions.runCommand}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GitPullRequest className="h-5 w-5" />
                GitHub Integration
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Create a pull request to add these tests directly to your repository.
              </p>
              {testsWithCode.length > 0 ? (
                <Dialog open={showPrModal} onOpenChange={setShowPrModal}>
                  <DialogTrigger asChild>
                    <Button className="w-full" data-testid="button-create-pr">
                      <GitPullRequest className="h-4 w-4 mr-2" />
                      Create Pull Request ({testsWithCode.length} tests)
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create Pull Request</DialogTitle>
                      <DialogDescription>
                        Create a pull request with {testsWithCode.length} generated test cases
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="pr-title">Pull Request Title</Label>
                        <Input
                          id="pr-title"
                          placeholder={`Add test cases for ${repositoryId}`}
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
              ) : (
                <div className="text-center p-4 border-2 border-dashed border-gray-300 rounded-lg">
                  <p className="text-sm text-gray-500 mb-2">No test code generated yet</p>
                  <Link href="/test-generator">
                    <Button variant="outline" size="sm">
                      Generate Test Code First
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileCode className="h-5 w-5" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => {
                  const allCode = testsWithCode.map(test => 
                    `// ${test.title}\n${test.generatedCode}\n\n`
                  ).join('');
                  navigator.clipboard.writeText(allCode);
                }}
                data-testid="button-copy-all"
              >
                <Copy className="h-4 w-4 mr-2" />
                Copy All Test Code
              </Button>
              
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => {
                  const testSummary = testCases.map(test => 
                    `${test.title}: ${test.testCaseCount} tests (${test.priority} priority)`
                  ).join('\n');
                  navigator.clipboard.writeText(testSummary);
                }}
                data-testid="button-copy-summary"
              >
                <FileText className="h-4 w-4 mr-2" />
                Copy Test Summary
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}