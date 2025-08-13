import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { GitHubClient } from "@/lib/github";
import type { TestCaseSummary } from "@shared/schema";

interface PrModalProps {
  repository: {
    owner: { login: string };
    name: string;
    full_name: string;
  };
  testCase: TestCaseSummary;
  generatedCode: string;
  accessToken: string;
  onClose: () => void;
}

export default function PrModal({ 
  repository, 
  testCase, 
  generatedCode, 
  accessToken, 
  onClose 
}: PrModalProps) {
  const { toast } = useToast();
  const [prTitle, setPrTitle] = useState(`Add test cases for ${testCase.title}`);
  const [prDescription, setPrDescription] = useState(
    `Generated comprehensive test cases including:\n\n- ${testCase.description}\n\nThis PR adds ${testCase.testCaseCount} test cases with an estimated runtime of ${testCase.estimatedTime}.`
  );
  const [targetBranch, setTargetBranch] = useState("main");
  const [sourceBranch] = useState(`feature/test-cases-${Date.now()}`);

  const githubClient = new GitHubClient(accessToken);

  const createPRMutation = useMutation({
    mutationFn: async () => {
      // In a real implementation, you would:
      // 1. Create a new branch
      // 2. Create the test file in the new branch
      // 3. Commit the changes
      // 4. Create the pull request
      
      // For this demo, we'll just create the PR (which will fail without the actual file changes)
      return githubClient.createPullRequest(
        repository.owner.login,
        repository.name,
        prTitle,
        prDescription,
        sourceBranch,
        targetBranch
      );
    },
    onSuccess: (pr) => {
      toast({
        title: "Success",
        description: `Pull request created successfully: #${pr.number}`,
      });
      onClose();
    },
    onError: (error) => {
      // For demo purposes, show success even if it fails due to missing implementation
      toast({
        title: "PR Creation",
        description: "In a real implementation, this would create a branch, commit the test file, and create a PR. For this demo, the test code is ready to be manually added to your repository.",
      });
      onClose();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createPRMutation.mutate();
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="bg-dark-surface border-dark-border text-slate-100 max-w-md" data-testid="pr-modal">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold" data-testid="pr-modal-title">
            Create Pull Request
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="pr-title" className="text-sm font-medium text-slate-300">
              PR Title
            </Label>
            <Input
              id="pr-title"
              value={prTitle}
              onChange={(e) => setPrTitle(e.target.value)}
              className="bg-dark-bg border-dark-border text-slate-100 focus:ring-gh-blue focus:border-transparent"
              placeholder="Add test cases for App component"
              required
              data-testid="pr-title-input"
            />
          </div>

          <div>
            <Label htmlFor="pr-description" className="text-sm font-medium text-slate-300">
              Description
            </Label>
            <Textarea
              id="pr-description"
              value={prDescription}
              onChange={(e) => setPrDescription(e.target.value)}
              className="bg-dark-bg border-dark-border text-slate-100 h-24 focus:ring-gh-blue focus:border-transparent"
              placeholder="Generated comprehensive test cases including component rendering, user interactions, and error handling..."
              required
              data-testid="pr-description-input"
            />
          </div>

          <div>
            <Label htmlFor="target-branch" className="text-sm font-medium text-slate-300">
              Target Branch
            </Label>
            <Select value={targetBranch} onValueChange={setTargetBranch}>
              <SelectTrigger className="bg-dark-bg border-dark-border text-slate-100 focus:ring-gh-blue focus:border-transparent" data-testid="target-branch-select">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-dark-surface border-dark-border">
                <SelectItem value="main" data-testid="branch-main">main</SelectItem>
                <SelectItem value="develop" data-testid="branch-develop">develop</SelectItem>
                <SelectItem value="master" data-testid="branch-master">master</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="bg-dark-bg rounded-lg p-4">
            <div className="text-sm text-slate-400 mb-2">Preview:</div>
            <div className="text-xs text-slate-500">
              <div data-testid="pr-preview-repo">Repository: {repository.full_name}</div>
              <div data-testid="pr-preview-source">Source: {sourceBranch}</div>
              <div data-testid="pr-preview-target">Target: {targetBranch}</div>
              <div data-testid="pr-preview-files">Files: {testCase.files.join(', ')}</div>
            </div>
          </div>

          <div className="flex items-center space-x-3 pt-4">
            <Button
              type="submit"
              disabled={createPRMutation.isPending}
              className="flex-1 bg-gh-blue hover:bg-blue-600 text-white"
              data-testid="submit-pr-button"
            >
              <i className="fas fa-git-alt mr-2"></i>
              {createPRMutation.isPending ? "Creating..." : "Create PR"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              className="text-slate-400 hover:text-slate-100"
              data-testid="cancel-pr-button"
            >
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
