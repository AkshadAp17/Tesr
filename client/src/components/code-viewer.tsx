import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import type { TestCaseSummary } from "@shared/schema";

interface CodeViewerProps {
  code: string;
  testCase: TestCaseSummary;
  onCreatePR: () => void;
}

export default function CodeViewer({ code, testCase, onCreatePR }: CodeViewerProps) {
  const { toast } = useToast();
  const [isCopied, setIsCopied] = useState(false);

  const handleCopyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setIsCopied(true);
      toast({
        title: "Copied",
        description: "Test code copied to clipboard",
      });
      setTimeout(() => setIsCopied(false), 2000);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy to clipboard",
        variant: "destructive",
      });
    }
  };

  const handleDownload = () => {
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${testCase.title.replace(/\s+/g, '_').toLowerCase()}.test.js`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Downloaded",
      description: "Test file downloaded successfully",
    });
  };

  const getLineNumbers = () => {
    const lines = code.split('\n');
    return lines.map((_, index) => (
      <div key={index + 1} className="text-right pr-4 select-none">
        {index + 1}
      </div>
    ));
  };

  return (
    <div className="bg-dark-surface rounded-xl border border-dark-border overflow-hidden" data-testid="code-viewer">
      <div className="flex items-center justify-between px-6 py-4 border-b border-dark-border">
        <div className="flex items-center space-x-3">
          <i className="fas fa-code text-gh-blue"></i>
          <h3 className="font-semibold text-slate-100" data-testid="code-title">
            Generated Test Code
          </h3>
          <span className="px-2 py-1 bg-gh-blue/10 text-gh-blue text-xs rounded" data-testid="code-filename">
            {testCase.title.replace(/\s+/g, '_').toLowerCase()}.test.js
          </span>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopyToClipboard}
            className="text-slate-400 hover:text-slate-100"
            data-testid="copy-button"
          >
            <i className={`fas ${isCopied ? 'fa-check text-green-400' : 'fa-copy'}`}></i>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDownload}
            className="text-slate-400 hover:text-slate-100"
            data-testid="download-button"
          >
            <i className="fas fa-download"></i>
          </Button>
          <Button
            onClick={onCreatePR}
            className="bg-green-600 hover:bg-green-700 text-white"
            data-testid="create-pr-button"
          >
            <i className="fas fa-git-alt mr-2"></i>
            Create PR
          </Button>
        </div>
      </div>

      {/* Code Display with Syntax Highlighting */}
      <div className="relative">
        <div className="flex">
          {/* Line numbers */}
          <div className="bg-dark-bg/50 text-xs text-slate-500 py-6 font-mono leading-relaxed min-w-[60px]" data-testid="line-numbers">
            {getLineNumbers()}
          </div>
          
          {/* Code content */}
          <pre className="bg-dark-bg p-6 text-sm text-slate-300 overflow-x-auto font-mono leading-relaxed flex-1" data-testid="code-content">
            <code>{code}</code>
          </pre>
        </div>
      </div>

      {/* Code Actions Footer */}
      <div className="px-6 py-4 bg-dark-bg/50 border-t border-dark-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4 text-sm text-slate-400">
            <span data-testid="test-cases-count">
              <i className="fas fa-check-circle text-green-400 mr-1"></i>
              {testCase.testCaseCount} test cases generated
            </span>
            <span data-testid="code-stats">
              <i className="fas fa-file-code mr-1"></i>
              {code.split('\n').length} lines
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-xs text-slate-500" data-testid="generation-time">
              Generated {new Date().toLocaleTimeString()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
