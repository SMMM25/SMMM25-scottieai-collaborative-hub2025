import React, { useState, useEffect } from 'react';
import { useRecommendations } from '../../contexts/RecommendationContext';
import { Recommendation } from '../../services/continuousImprovementService';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Badge } from '../ui/badge';
import { ScrollArea } from '../ui/scroll-area';
import { Calendar } from '../ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { format } from 'date-fns';
import { CalendarIcon, CheckIcon, XIcon, ClockIcon, InfoIcon, AlertTriangleIcon, ShieldIcon, ZapIcon, CodeIcon, PackageIcon, BugIcon, ActivityIcon } from 'lucide-react';

export const RecommendationPanel: React.FC = () => {
  const { 
    pendingRecommendations, 
    approvedRecommendations,
    rejectedRecommendations,
    implementedRecommendations,
    loadingRecommendations,
    refreshRecommendations,
    approveRecommendation,
    rejectRecommendation,
    implementRecommendation
  } = useRecommendations();
  
  const [selectedRecommendation, setSelectedRecommendation] = useState<Recommendation | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const [scheduledDate, setScheduledDate] = useState<Date | undefined>(undefined);
  
  // Refresh recommendations on mount
  useEffect(() => {
    refreshRecommendations();
  }, [refreshRecommendations]);
  
  // Handle recommendation selection
  const handleSelectRecommendation = (recommendation: Recommendation) => {
    setSelectedRecommendation(recommendation);
    setIsDetailsOpen(true);
  };
  
  // Handle recommendation approval
  const handleApprove = () => {
    if (selectedRecommendation) {
      approveRecommendation(selectedRecommendation.id);
      setIsDetailsOpen(false);
    }
  };
  
  // Handle recommendation scheduling
  const handleSchedule = () => {
    setIsScheduleOpen(true);
  };
  
  // Handle schedule confirmation
  const handleConfirmSchedule = () => {
    if (selectedRecommendation && scheduledDate) {
      approveRecommendation(selectedRecommendation.id, scheduledDate);
      setIsScheduleOpen(false);
      setIsDetailsOpen(false);
      setScheduledDate(undefined);
    }
  };
  
  // Handle recommendation rejection
  const handleReject = () => {
    if (selectedRecommendation) {
      rejectRecommendation(selectedRecommendation.id);
      setIsDetailsOpen(false);
    }
  };
  
  // Handle recommendation implementation
  const handleImplement = async () => {
    if (selectedRecommendation) {
      const success = await implementRecommendation(selectedRecommendation.id);
      if (success) {
        setIsDetailsOpen(false);
      }
    }
  };
  
  // Get category icon
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'performance':
        return <ZapIcon className="h-4 w-4" />;
      case 'security':
        return <ShieldIcon className="h-4 w-4" />;
      case 'user_experience':
        return <ActivityIcon className="h-4 w-4" />;
      case 'accessibility':
        return <InfoIcon className="h-4 w-4" />;
      case 'code_quality':
        return <CodeIcon className="h-4 w-4" />;
      case 'new_feature':
        return <PackageIcon className="h-4 w-4" />;
      case 'dependency_update':
        return <PackageIcon className="h-4 w-4" />;
      case 'bug_fix':
        return <BugIcon className="h-4 w-4" />;
      case 'optimization':
        return <ZapIcon className="h-4 w-4" />;
      default:
        return <InfoIcon className="h-4 w-4" />;
    }
  };
  
  // Get priority badge
  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'critical':
        return <Badge variant="destructive">Critical</Badge>;
      case 'high':
        return <Badge variant="destructive">High</Badge>;
      case 'medium':
        return <Badge variant="default">Medium</Badge>;
      case 'low':
        return <Badge variant="secondary">Low</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };
  
  // Get difficulty badge
  const getDifficultyBadge = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Easy</Badge>;
      case 'moderate':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Moderate</Badge>;
      case 'complex':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Complex</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };
  
  // Render recommendation card
  const renderRecommendationCard = (recommendation: Recommendation) => (
    <Card 
      key={recommendation.id} 
      className="mb-4 cursor-pointer hover:shadow-md transition-shadow"
      onClick={() => handleSelectRecommendation(recommendation)}
    >
      <div className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            {getCategoryIcon(recommendation.category)}
            <h3 className="text-lg font-semibold">{recommendation.title}</h3>
          </div>
          <div className="flex gap-2">
            {getPriorityBadge(recommendation.priority)}
            {getDifficultyBadge(recommendation.difficulty)}
          </div>
        </div>
        <p className="mt-2 text-sm text-gray-600">{recommendation.description}</p>
        <div className="mt-3 flex items-center justify-between text-sm text-gray-500">
          <div>
            <span className="capitalize">{recommendation.category.replace('_', ' ')}</span>
            <span className="mx-2">•</span>
            <span>{recommendation.estimatedTime}</span>
          </div>
          <div>
            {recommendation.status === 'scheduled' && recommendation.scheduledFor && (
              <div className="flex items-center">
                <ClockIcon className="h-4 w-4 mr-1" />
                <span>Scheduled: {format(recommendation.scheduledFor, 'MMM d, yyyy')}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
  
  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">AI Recommendations</h2>
        <Button 
          onClick={() => refreshRecommendations()} 
          disabled={loadingRecommendations}
        >
          {loadingRecommendations ? 'Analyzing...' : 'Analyze System'}
        </Button>
      </div>
      
      <Tabs defaultValue="pending">
        <TabsList className="mb-4">
          <TabsTrigger value="pending">
            Pending
            {pendingRecommendations.length > 0 && (
              <Badge variant="secondary" className="ml-2">{pendingRecommendations.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="approved">
            Approved
            {approvedRecommendations.length > 0 && (
              <Badge variant="secondary" className="ml-2">{approvedRecommendations.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="implemented">
            Implemented
            {implementedRecommendations.length > 0 && (
              <Badge variant="secondary" className="ml-2">{implementedRecommendations.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="rejected">
            Rejected
            {rejectedRecommendations.length > 0 && (
              <Badge variant="secondary" className="ml-2">{rejectedRecommendations.length}</Badge>
            )}
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="pending">
          {pendingRecommendations.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No pending recommendations
            </div>
          ) : (
            pendingRecommendations.map(renderRecommendationCard)
          )}
        </TabsContent>
        
        <TabsContent value="approved">
          {approvedRecommendations.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No approved recommendations
            </div>
          ) : (
            approvedRecommendations.map(renderRecommendationCard)
          )}
        </TabsContent>
        
        <TabsContent value="implemented">
          {implementedRecommendations.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No implemented recommendations
            </div>
          ) : (
            implementedRecommendations.map(renderRecommendationCard)
          )}
        </TabsContent>
        
        <TabsContent value="rejected">
          {rejectedRecommendations.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No rejected recommendations
            </div>
          ) : (
            rejectedRecommendations.map(renderRecommendationCard)
          )}
        </TabsContent>
      </Tabs>
      
      {/* Recommendation Details Dialog */}
      {selectedRecommendation && (
        <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {getCategoryIcon(selectedRecommendation.category)}
                {selectedRecommendation.title}
              </DialogTitle>
              <div className="flex gap-2 mt-2">
                {getPriorityBadge(selectedRecommendation.priority)}
                {getDifficultyBadge(selectedRecommendation.difficulty)}
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                  {selectedRecommendation.estimatedTime}
                </Badge>
              </div>
              <DialogDescription className="mt-2">
                {selectedRecommendation.description}
              </DialogDescription>
            </DialogHeader>
            
            <div className="flex-1 overflow-hidden">
              <ScrollArea className="h-[calc(80vh-200px)]">
                <div className="space-y-4 p-1">
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Benefits</h3>
                    <ul className="list-disc pl-5 space-y-1">
                      {selectedRecommendation.benefits.map((benefit, index) => (
                        <li key={index}>{benefit}</li>
                      ))}
                    </ul>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Implementation</h3>
                    <pre className="bg-gray-100 p-4 rounded-md overflow-x-auto text-sm">
                      {selectedRecommendation.implementation}
                    </pre>
                  </div>
                </div>
              </ScrollArea>
            </div>
            
            <DialogFooter className="mt-4">
              {selectedRecommendation.status === 'pending' && (
                <>
                  <Button variant="outline" onClick={handleReject}>
                    <XIcon className="h-4 w-4 mr-2" />
                    Reject
                  </Button>
                  <Button variant="outline" onClick={handleSchedule}>
                    <ClockIcon className="h-4 w-4 mr-2" />
                    Schedule
                  </Button>
                  <Button variant="default" onClick={handleApprove}>
                    <CheckIcon className="h-4 w-4 mr-2" />
                    Approve
                  </Button>
                </>
              )}
              
              {selectedRecommendation.status === 'approved' && (
                <Button variant="default" onClick={handleImplement}>
                  Implement Now
                </Button>
              )}
              
              {selectedRecommendation.status === 'scheduled' && (
                <>
                  <div className="flex items-center text-sm text-gray-500 mr-auto">
                    <ClockIcon className="h-4 w-4 mr-1" />
                    <span>
                      Scheduled for: {selectedRecommendation.scheduledFor 
                        ? format(selectedRecommendation.scheduledFor, 'MMMM d, yyyy') 
                        : 'Unknown date'}
                    </span>
                  </div>
                  <Button variant="default" onClick={handleImplement}>
                    Implement Now
                  </Button>
                </>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
      
      {/* Schedule Dialog */}
      <Dialog open={isScheduleOpen} onOpenChange={setIsScheduleOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Schedule Implementation</DialogTitle>
            <DialogDescription>
              Select a date to schedule this recommendation for implementation.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {scheduledDate ? format(scheduledDate, 'PPP') : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={scheduledDate}
                  onSelect={setScheduledDate}
                  initialFocus
                  disabled={(date) => date < new Date()}
                />
              </PopoverContent>
            </Popover>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsScheduleOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant="default" 
              onClick={handleConfirmSchedule}
              disabled={!scheduledDate}
            >
              Confirm Schedule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
