import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { AlertCircle, CheckCircle2, Clock, Code, FileCode, RefreshCw, Shield, Zap } from 'lucide-react';
import { useAutoUpdateContext } from '@/contexts/AutoUpdateContext';
import { CodeUpdateRecommendation, TechnologyUpdate } from '@/types/llm';
import { toast } from 'sonner';

interface AutoUpdatePanelProps {
  projectId: string;
}

const AutoUpdatePanel: React.FC<AutoUpdatePanelProps> = ({ projectId }) => {
  const {
    settings,
    updateSettings,
    isLoading,
    analysisResult,
    technologyUpdates,
    runAnalysis,
    applyUpdates,
    encryptData,
    decryptData
  } = useAutoUpdateContext();

  const [selectedRecommendations, setSelectedRecommendations] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState('overview');

  // Handle running analysis
  const handleRunAnalysis = async () => {
    toast.info('Starting code analysis. This may take a few moments...');
    await runAnalysis();
  };

  // Handle applying updates
  const handleApplyUpdates = async () => {
    if (selectedRecommendations.length === 0) {
      toast.warning('Please select at least one recommendation to apply');
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to apply ${selectedRecommendations.length} selected updates? This will modify your code.`
    );

    if (confirmed) {
      toast.info('Applying selected updates...');
      const success = await applyUpdates(selectedRecommendations);
      
      if (success) {
        setSelectedRecommendations([]);
        toast.success('Updates applied successfully');
      }
    }
  };

  // Handle toggling a recommendation selection
  const toggleRecommendation = (id: string) => {
    setSelectedRecommendations(prev => 
      prev.includes(id) 
        ? prev.filter(recId => recId !== id)
        : [...prev, id]
    );
  };

  // Handle settings changes
  const handleSettingChange = async (key: keyof typeof settings, value: any) => {
    await updateSettings({ [key]: value });
  };

  // Get severity color
  const getSeverityColor = (severity: 'low' | 'medium' | 'high') => {
    switch (severity) {
      case 'high':
        return 'text-red-500 bg-red-100';
      case 'medium':
        return 'text-amber-500 bg-amber-100';
      case 'low':
        return 'text-green-500 bg-green-100';
      default:
        return 'text-slate-500 bg-slate-100';
    }
  };

  // Get category icon
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'dependency':
        return <RefreshCw className="h-4 w-4" />;
      case 'security':
        return <Shield className="h-4 w-4" />;
      case 'performance':
        return <Zap className="h-4 w-4" />;
      case 'best-practice':
        return <CheckCircle2 className="h-4 w-4" />;
      case 'new-technology':
        return <Code className="h-4 w-4" />;
      default:
        return <FileCode className="h-4 w-4" />;
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-2xl">AI Code Optimizer</CardTitle>
            <CardDescription>
              Automatically analyze and optimize your code with AI-powered recommendations
            </CardDescription>
          </div>
          <div className="flex items-center space-x-2">
            <Label htmlFor="auto-update-enabled">Auto-updates</Label>
            <Switch
              id="auto-update-enabled"
              checked={settings.enabled}
              onCheckedChange={(checked) => handleSettingChange('enabled', checked)}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-4 mb-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
            <TabsTrigger value="technologies">Technologies</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>
          
          {/* Overview Tab */}
          <TabsContent value="overview">
            {analysisResult ? (
              <div className="space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <div className="text-3xl font-bold">{analysisResult.summary.totalIssues}</div>
                        <p className="text-sm text-muted-foreground">Total Issues</p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <div className="text-3xl font-bold">{analysisResult.summary.outdatedDependencies}</div>
                        <p className="text-sm text-muted-foreground">Outdated Dependencies</p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <div className="text-3xl font-bold">{analysisResult.summary.securityVulnerabilities}</div>
                        <p className="text-sm text-muted-foreground">Security Issues</p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <div className="text-3xl font-bold">{analysisResult.summary.codeQualityScore}</div>
                        <p className="text-sm text-muted-foreground">Code Quality Score</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium mb-2">Code Quality</h3>
                  <Progress value={analysisResult.summary.codeQualityScore} className="h-2" />
                  <div className="flex justify-between mt-1 text-sm text-muted-foreground">
                    <span>Needs Improvement</span>
                    <span>Excellent</span>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium mb-2">Analysis Summary</h3>
                  <p className="text-muted-foreground">
                    Analyzed {analysisResult.analyzedFiles} files with {analysisResult.analyzedLines} lines of code.
                    Found {analysisResult.summary.totalIssues} issues to optimize.
                  </p>
                  
                  <div className="mt-4 flex justify-between">
                    <div className="text-sm text-muted-foreground flex items-center">
                      <Clock className="h-4 w-4 mr-1" />
                      Last analyzed: {new Date(analysisResult.timestamp).toLocaleString()}
                    </div>
                    <Button onClick={handleRunAnalysis} disabled={isLoading}>
                      {isLoading ? 'Analyzing...' : 'Run New Analysis'}
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
                  <Code className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-medium">No Analysis Results Yet</h3>
                <p className="text-muted-foreground mt-2 mb-6">
                  Run your first code analysis to get AI-powered optimization recommendations.
                </p>
                <Button onClick={handleRunAnalysis} disabled={isLoading}>
                  {isLoading ? 'Analyzing...' : 'Run Analysis'}
                </Button>
              </div>
            )}
          </TabsContent>
          
          {/* Recommendations Tab */}
          <TabsContent value="recommendations">
            {analysisResult && analysisResult.recommendations.length > 0 ? (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium">
                    {analysisResult.recommendations.length} Recommendations
                  </h3>
                  {selectedRecommendations.length > 0 && (
                    <Button onClick={handleApplyUpdates} disabled={isLoading}>
                      Apply {selectedRecommendations.length} Selected Updates
                    </Button>
                  )}
                </div>
                
                <div className="space-y-4">
                  {analysisResult.recommendations.map((rec: CodeUpdateRecommendation) => (
                    <Card key={rec.id} className={selectedRecommendations.includes(rec.id) ? 'border-scottie' : ''}>
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <Badge className={getSeverityColor(rec.severity)}>
                                {rec.severity.charAt(0).toUpperCase() + rec.severity.slice(1)}
                              </Badge>
                              <Badge variant="outline" className="flex items-center">
                                {getCategoryIcon(rec.category)}
                                <span className="ml-1">{rec.category.replace('-', ' ')}</span>
                              </Badge>
                            </div>
                            <CardTitle className="mt-2">{rec.title}</CardTitle>
                          </div>
                          <Switch
                            checked={selectedRecommendations.includes(rec.id)}
                            onCheckedChange={() => toggleRecommendation(rec.id)}
                          />
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-muted-foreground mb-4">{rec.description}</p>
                        
                        {rec.filePath && (
                          <div className="text-sm text-muted-foreground mb-2">
                            File: <code className="bg-muted px-1 py-0.5 rounded">{rec.filePath}</code>
                            {rec.lineNumbers && ` (lines ${rec.lineNumbers[0]}-${rec.lineNumbers[1]})`}
                          </div>
                        )}
                        
                        {rec.currentCode && rec.suggestedCode && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                            <div>
                              <div className="text-sm font-medium mb-1">Current Code:</div>
                              <pre className="bg-muted p-2 rounded text-xs overflow-x-auto">{rec.currentCode}</pre>
                            </div>
                            <div>
                              <div className="text-sm font-medium mb-1">Suggested Code:</div>
                              <pre className="bg-muted p-2 rounded text-xs overflow-x-auto">{rec.suggestedCode}</pre>
                            </div>
                          </div>
                        )}
                        
                        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <div className="text-sm font-medium mb-1">Benefits:</div>
                            <ul className="text-sm list-disc pl-5 space-y-1">
                              {rec.benefits.map((benefit, i) => (
                                <li key={i}>{benefit}</li>
                              ))}
                            </ul>
                          </div>
                          {rec.risks.length > 0 && (
                            <div>
                              <div className="text-sm font-medium mb-1">Risks:</div>
                              <ul className="text-sm list-disc pl-5 space-y-1">
                                {rec.risks.map((risk, i) => (
                                  <li key={i}>{risk}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                        
                        <div className="mt-4 text-sm text-muted-foreground">
                          Effort: <span className="font-medium">{rec.estimatedEffort}</span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium">No Recommendations Available</h3>
                <p className="text-muted-foreground mt-2 mb-6">
                  {analysisResult 
                    ? "Great job! Your code doesn't have any issues that need attention."
                    : "Run a code analysis to get recommendations for your project."}
                </p>
                <Button onClick={handleRunAnalysis} disabled={isLoading}>
                  {isLoading ? 'Analyzing...' : 'Run Analysis'}
                </Button>
              </div>
            )}
          </TabsContent>
          
          {/* Technologies Tab */}
          <TabsContent value="technologies">
            {technologyUpdates.length > 0 ? (
              <div className="space-y-6">
                <h3 className="text-lg font-medium">
                  {technologyUpdates.length} Technology Updates Available
                </h3>
                
                <div className="space-y-4">
                  {technologyUpdates.map((tech: TechnologyUpdate) => (
                    <Card key={tech.id}>
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <Badge variant="outline" className="mb-2">
                              {tech.category}
                            </Badge>
                            <CardTitle>{tech.name}</CardTitle>
                            {tech.currentVersion && tech.latestVersion && (
                              <CardDescription>
                                {tech.currentVersion} → {tech.latestVersion}
                              </CardDescription>
                            )}
                          </div>
                          <Badge 
                            className={
                              tech.recommendedAction === 'update' 
                                ? 'bg-green-100 text-green-800' 
                                : tech.recommendedAction === 'evaluate' 
                                  ? 'bg-amber-100 text-amber-800' 
                                  : 'bg-blue-100 text-blue-800'
                            }
                          >
                            {tech.recommendedAction}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-muted-foreground mb-4">{tech.description}</p>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <div className="text-sm font-medium mb-1">Benefits:</div>
                            <ul className="text-sm list-disc pl-5 space-y-1">
                              {tech.benefits.map((benefit, i) => (
                                <li key={i}>{benefit}</li>
                              ))}
                            </ul>
                          </div>
                          <div>
                            <div className="text-sm font-medium mb-1">Details:</div>
                            <div className="space-y-2 text-sm">
                              <div>Released: {new Date(tech.releaseDate).toLocaleDateString()}</div>
                              <div>Breaking Changes: {tech.breakingChanges ? 'Yes' : 'No'}</div>
                              <div>Migration Difficulty: {tech.migrationDifficulty}</div>
                            </div>
                          </div>
                        </div>
                        
                        {tech.links && Object.keys(tech.links).length > 0 && (
                          <div className="mt-4">
                            <div className="text-sm font-medium mb-1">Resources:</div>
                            <div className="flex flex-wrap gap-2">
                              {tech.links.documentation && (
                                <Button variant="outline" size="sm" asChild>
                                  <a href={tech.links.documentation} target="_blank" rel="noopener noreferrer">
                                    Documentation
                                  </a>
                                </Button>
                              )}
                              {tech.links.releaseNotes && (
                                <Button variant="outline" size="sm" asChild>
                                  <a href={tech.links.releaseNotes} target="_blank" rel="noopener noreferrer">
                                    Release Notes
                                  </a>
                                </Button>
                              )}
                              {tech.links.migrationGuide && (
                                <Button variant="outline" size="sm" asChild>
                                  <a href={tech.links.migrationGuide} target="_blank" rel="noopener noreferrer">
                                    Migration Guide
                                  </a>
                                </Button>
                              )}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <RefreshCw className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium">No Technology Updates Available</h3>
                <p className="text-muted-foreground mt-2 mb-6">
                  {analysisResult 
                    ? "Your project is using the latest versions of all technologies."
                    : "Run a code analysis to check for technology updates."}
                </p>
                <Button onClick={handleRunAnalysis} disabled={isLoading}>
                  {isLoading ? 'Analyzing...' : 'Run Analysis'}
                </Button>
              </div>
            )}
          </TabsContent>
          
          {/* Settings Tab */}
          <TabsContent value="settings">
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium mb-4">Auto-Update Settings</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="auto-update-enabled" className="text-base">Enable Auto-Updates</Label>
                      <p className="text-sm text-muted-foreground">
                        Automatically scan your code for potential improvements
                      </p>
                    </div>
                    <Switch
                      id="auto-update-enabled"
                      checked={settings.enabled}
                      onCheckedChange={(checked) => handleSettingChange('enabled', checked)}
                    />
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-2">
                    <Label htmlFor="scan-frequency">Scan Frequency</Label>
                    <Select
                      value={settings.scanFrequency}
                      onValueChange={(value) => handleSettingChange('scanFrequency', value)}
                    >
                      <SelectTrigger id="scan-frequency">
                        <SelectValue placeholder="Select frequency" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="manual">Manual Only</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="auto-apply-minor" className="text-base">Auto-Apply Minor Updates</Label>
                      <p className="text-sm text-muted-foreground">
                        Automatically apply low-risk updates without confirmation
                      </p>
                    </div>
                    <Switch
                      id="auto-apply-minor"
                      checked={settings.autoApplyMinorUpdates}
                      onCheckedChange={(checked) => handleSettingChange('autoApplyMinorUpdates', checked)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="notify-major" className="text-base">Notify on Major Updates</Label>
                      <p className="text-sm text-muted-foreground">
                        Receive notifications when major updates are available
                      </p>
                    </div>
                    <Switch
                      id="notify-major"
                      checked={settings.notifyOnMajorUpdates}
                      onCheckedChange={(checked) => handleSettingChange('notifyOnMajorUpdates', checked)}
                    />
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-2">
                    <Label htmlFor="excluded-dirs">Excluded Directories</Label>
                    <Input
                      id="excluded-dirs"
                      value={settings.excludedDirectories.join(', ')}
                      onChange={(e) => handleSettingChange(
                        'excludedDirectories', 
                        e.target.value.split(',').map(dir => dir.trim()).filter(Boolean)
                      )}
                      placeholder="node_modules, dist, .git"
                    />
                    <p className="text-xs text-muted-foreground">
                      Comma-separated list of directories to exclude from analysis
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="excluded-files">Excluded Files</Label>
                    <Input
                      id="excluded-files"
                      value={settings.excludedFiles.join(', ')}
                      onChange={(e) => handleSettingChange(
                        'excludedFiles', 
                        e.target.value.split(',').map(file => file.trim()).filter(Boolean)
                      )}
                      placeholder=".env, *.lock"
                    />
                    <p className="text-xs text-muted-foreground">
                      Comma-separated list of files to exclude from analysis
                    </p>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-medium mb-4">Security Settings</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-base">Encrypt Analysis Data</Label>
                      <p className="text-sm text-muted-foreground">
                        All code analysis data is encrypted using AES-256
                      </p>
                    </div>
                    <Badge className="bg-green-100 text-green-800">Enabled</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-base">Secure Storage</Label>
                      <p className="text-sm text-muted-foreground">
                        Analysis results are stored securely and encrypted at rest
                      </p>
                    </div>
                    <Badge className="bg-green-100 text-green-800">Enabled</Badge>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => updateSettings(defaultAutoUpdateSettings)}>
                  Reset to Defaults
                </Button>
                <Button className="bg-scottie hover:bg-scottie-secondary">
                  Save Settings
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter className="border-t bg-muted/50 flex justify-between">
        <div className="text-sm text-muted-foreground">
          {settings.lastScanDate && (
            <span>Last scan: {new Date(settings.lastScanDate).toLocaleString()}</span>
          )}
          {settings.nextScanDate && settings.enabled && (
            <span className="ml-4">Next scan: {new Date(settings.nextScanDate).toLocaleString()}</span>
          )}
        </div>
        <div className="flex items-center text-sm text-muted-foreground">
          <Shield className="h-4 w-4 mr-1" />
          Secured with AES-256 encryption
        </div>
      </CardFooter>
    </Card>
  );
};

export default AutoUpdatePanel;
