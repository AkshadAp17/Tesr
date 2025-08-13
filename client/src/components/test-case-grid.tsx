import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { TestCaseSummary } from "@shared/schema";

interface TestCaseGridProps {
  testCases: TestCaseSummary[];
  onGenerateCode: (testCase: TestCaseSummary) => void;
  isGeneratingCode: boolean;
}

export default function TestCaseGrid({ testCases, onGenerateCode, isGeneratingCode }: TestCaseGridProps) {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-500/10 text-red-400';
      case 'medium':
        return 'bg-yellow-500/10 text-yellow-400';
      case 'low':
        return 'bg-blue-500/10 text-blue-400';
      default:
        return 'bg-slate-500/10 text-slate-400';
    }
  };

  const getCategoryIcon = (title: string) => {
    const lowerTitle = title.toLowerCase();
    if (lowerTitle.includes('render')) return 'fas fa-flask text-gh-blue';
    if (lowerTitle.includes('interaction') || lowerTitle.includes('click')) return 'fas fa-mouse-pointer text-purple-400';
    if (lowerTitle.includes('state') || lowerTitle.includes('data')) return 'fas fa-database text-orange-400';
    if (lowerTitle.includes('error') || lowerTitle.includes('exception')) return 'fas fa-exclamation-triangle text-red-400';
    return 'fas fa-code text-gh-blue';
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      {testCases.map((testCase) => (
        <div
          key={testCase.id}
          className="bg-dark-surface rounded-xl border border-dark-border p-6 hover:border-gh-blue/50 transition-colors"
          data-testid={`test-case-${testCase.id}`}
        >
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gh-blue/10 rounded-lg flex items-center justify-center">
                <i className={getCategoryIcon(testCase.title)}></i>
              </div>
              <div>
                <h3 className="font-semibold text-slate-100" data-testid={`test-title-${testCase.id}`}>
                  {testCase.title}
                </h3>
                <p className="text-sm text-slate-400" data-testid={`test-files-${testCase.id}`}>
                  {testCase.files.join(', ')}
                </p>
              </div>
            </div>
            <Badge 
              className={getPriorityColor(testCase.priority)}
              data-testid={`test-priority-${testCase.id}`}
            >
              {testCase.priority.charAt(0).toUpperCase() + testCase.priority.slice(1)} Priority
            </Badge>
          </div>
          
          <p className="text-slate-300 text-sm leading-relaxed mb-4" data-testid={`test-description-${testCase.id}`}>
            {testCase.description}
          </p>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4 text-sm text-slate-400">
              <span data-testid={`test-count-${testCase.id}`}>
                <i className="fas fa-check-circle mr-1"></i>
                {testCase.testCaseCount} test cases
              </span>
              <span data-testid={`test-time-${testCase.id}`}>
                <i className="fas fa-clock mr-1"></i>
                {testCase.estimatedTime}
              </span>
            </div>
            <Button
              onClick={() => onGenerateCode(testCase)}
              disabled={isGeneratingCode}
              className="bg-gh-blue hover:bg-blue-600 text-white text-sm"
              data-testid={`generate-code-${testCase.id}`}
            >
              {isGeneratingCode ? "Generating..." : "Generate Code"}
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
